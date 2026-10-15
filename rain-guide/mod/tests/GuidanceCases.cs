using Rainward;

internal static class GuidanceCases
{
    internal static void Run(Action<bool, string> check)
    {
        var progress = new GuidanceProgress();
        progress.Begin("save-1", " SU_C04 ");
        check(progress.CurrentTarget == "SU_C04" && progress.ShouldShowRoute(false),
            "continuous guidance is available before the first successful sleep");
        check(!progress.ShouldShowRoute(true),
            "blocked-only guidance is hidden before lack of progress");
        check(!progress.RecordGuidanceMode(true)
            && !progress.RecordGuidanceMode(false) && !progress.RecordGuidanceMode(false),
            "switching guidance mode without a blocked-state transition is stable");

        progress.SuccessfulSleep("SU_C04", "SU_C04", false);
        check(progress.SleepsWithoutProgress == 1 && !progress.ShouldShowRoute(true),
            "one unexplored successful sleep does not trigger blocked guidance");
        progress.SuccessfulSleep("SU_C04", "SU_C04", false);
        check(progress.SleepsWithoutProgress == GuidanceProgress.SleepsBeforeGuidance && progress.ShouldShowRoute(true),
            "two unexplored successful sleeps trigger blocked guidance");
        check(progress.RecordGuidanceMode(true)
            && !progress.RecordGuidanceMode(true),
            "blocked guidance invalidates the HUD map once when its threshold is reached");

        progress.SuccessfulSleep("SU_C04", "SU_C04", true);
        check(progress.SleepsWithoutProgress == 0 && !progress.ShouldShowRoute(true),
            "discovering a new room clears the blocked counter");
        check(progress.RecordGuidanceMode(true)
            && !progress.RecordGuidanceMode(true),
            "HUD route hides once progress resumes");
        progress.SuccessfulSleep("SU_C04", "SU_C04", null);
        check(progress.SleepsWithoutProgress == 0 && !progress.ShouldShowRoute(true),
            "unknown exploration data does not count as being blocked");

        progress.SuccessfulSleep("SU_C04", "HI_A21", false);
        check(progress.CurrentTarget == "HI_A21" && progress.SleepsWithoutProgress == 0 && !progress.ShouldShowRoute(true),
            "a changed story target resets blocked guidance on that sleep");
        progress.SuccessfulSleep("HI_A21", "HI_A21", false);
        check(progress.SleepsWithoutProgress == 1 && !progress.ShouldShowRoute(true),
            "blocked count starts on the sleep after a changed story target");
        check(progress.ObserveTarget("HI_A24") && progress.CurrentTarget == "HI_A24"
            && progress.SleepsWithoutProgress == 0 && !progress.ShouldShowRoute(true),
            "a newly available read-only game target refreshes the route and clears stale blocked state");
        check(!progress.ObserveTarget("HI_A24"),
            "observing the same game target does not invalidate guidance repeatedly");

        var configurable = new GuidanceProgress();
        configurable.Begin("save-config", "SU_C04");
        configurable.SuccessfulSleep("SU_C04", "SU_C04", false);
        configurable.SuccessfulSleep("SU_C04", "SU_C04", false);
        check(!configurable.ShouldShowRoute(true, 3),
            "a higher blocked-guidance threshold delays the route");
        configurable.SuccessfulSleep("SU_C04", "SU_C04", false);
        check(configurable.ShouldShowRoute(true, 3)
            && configurable.RecordGuidanceMode(true, 3),
            "the configured blocked-guidance threshold is applied");

        var edges = new List<RouteEdge>
        {
            new(0, 1), new(1, 3),
            new(0, 2), new(2, 4), new(4, 3)
        };
        var goals = new HashSet<int> { 3 };
        var direct = GuidanceRoutePlanner.FindPath(edges, 0, goals);
        check(direct.Count == 2, "route planner finds the shortest room path");
        var pathRooms = GuidanceRoutePlanner.PathRooms(direct, 0);
        check(pathRooms.SequenceEqual(new[] { 0, 1, 3 }),
            "route planner preserves the ordered rooms for visible path fallback");
        check(GuidanceRoutePlanner.RegionExitOnPath(new[] { 0, 1, 8, 9 },
                new HashSet<int> { 0, 1, 2 }, 0) == 1,
            "region guidance stops at the current-region exit on a cross-region path");
        check(GuidanceRoutePlanner.RegionExitOnPath(new[] { 0, 1, 3 },
                new HashSet<int> { 0, 1, 3 }, 0) == -1,
            "region guidance does not continue toward a specific room inside the destination region");
        check(GuidanceRoutePlanner.RegionExitOnPath(new[] { 0, 8, 9 },
                new HashSet<int> { 0, 1, 2 }, 0) == -1,
            "region guidance does not draw a fabricated path when already at the regional exit");
        check(!GuidanceRoutePlanner.DefaultLocateSpecificRoom,
            "specific-room guidance defaults off");
        var regionalRoomHint = GuidanceRoutePlanner.RegionalGuidancePath(edges, 0, 3, false);
        check(regionalRoomHint.Count == 1 && regionalRoomHint[0].A == 0 && regionalRoomHint[0].B == 1,
            "regional mode keeps the next highlighted connection without exposing the full in-region room route");
        var regionalExitRoute = GuidanceRoutePlanner.RegionalGuidancePath(edges, 0, 3, true);
        check(regionalExitRoute.Count == direct.Count,
            "regional mode preserves the complete route to a confirmed region exit");
        check(GuidanceRoutePlanner.RegionalGuidancePath(edges, 3, 3, false).Count == 0,
            "regional guidance stops once the player reaches the target room");
        var interestDoors = GuidanceRoutePlanner.FindInterestDoors(edges, direct, 0, new HashSet<int> { 2, 4 });
        check(interestDoors.Contains(GuidanceRoutePlanner.EdgeKey(0, 2))
            && interestDoors.Contains(GuidanceRoutePlanner.EdgeKey(3, 4))
            && interestDoors.Count == 2,
            "interest points mark connected room entrances without changing the main route");
        check(direct.Count == 2 && !interestDoors.Contains(GuidanceRoutePlanner.EdgeKey(0, 1)),
            "interest-point hints do not replace or alter highlighted route connections");
        var interestWithoutMainRoute = GuidanceRoutePlanner.FindInterestDoors(edges, new List<RouteEdge>(), 0,
            new HashSet<int> { 2 });
        check(interestWithoutMainRoute.Contains(GuidanceRoutePlanner.EdgeKey(0, 2)),
            "interest-point hints remain available when the main route is empty");
        check(Math.Abs(GuidanceAnimation.Pulse(0f) - GuidanceAnimation.Pulse(GuidanceAnimation.PeriodSeconds)) < 0.001f,
            "route pulse returns to its initial brightness after one slow cycle");
        check(GuidanceAnimation.Pulse(0f) < GuidanceAnimation.Pulse(GuidanceAnimation.PeriodSeconds / 4f)
            && GuidanceAnimation.Pulse(GuidanceAnimation.PeriodSeconds / 4f) > GuidanceAnimation.Pulse(GuidanceAnimation.PeriodSeconds / 2f),
            "route pulse smoothly moves from dim to bright and back");
        check(Math.Abs(GuidanceAnimation.ApplyAlpha(0.8f, 0.72f) - 0.576f) < 0.001f
            && Math.Abs(GuidanceAnimation.ApplyAlpha(0.8f, 1f) - 0.8f) < 0.001f,
            "route pulse alpha preserves the base opacity for lines and room markers");
        check(progress.Begin("save-2", "HI_A21") && progress.CurrentTarget == "HI_A21"
            && progress.SleepsWithoutProgress == 0 && !progress.ShouldShowRoute(true),
            "a different campaign save resets blocked-guidance state");
        var disconnected = GuidanceRoutePlanner.FindPath(edges, 9, goals);
        check(disconnected.Count == 0, "route planner returns no path when the current room is disconnected");
        var alreadyAtGoal = GuidanceRoutePlanner.FindPath(edges, 3, goals);
        check(alreadyAtGoal.Count == 0, "route planner does not draw a route after reaching the goal");
    }

}
