// English player-facing text. Route geometry, requirements, IDs, and source
// links are inherited from the Chinese data so both locales remain identical.
import { REGIONS, CAMPAIGNS, SURVIVAL_TIPS } from './data.js';

const regionClues = {
  SU: 'Keep track of nearby food and shelters.',
  HI: 'There are many branches here. Establish a reliable place to rest.',
  DS: 'Leave enough room to turn back when exploring underwater passages.',
  GW: 'Watch how the other inhabitants behave before choosing how to pass.',
  SH: 'In the dark, a light source is more useful than rushing ahead.',
  SL: 'Look for safe places along the water, and avoid swimming too far at once.',
  CC: 'Observe open routes at height before committing to a jump.',
  SI: 'Distances between regions are greater than the flat map suggests.',
  LF: 'Some routes here depend on creatures in the environment.',
  UW: 'Check that you have a safe way back before climbing higher.',
  SS: 'Take time to adjust to the changed movement rules.',
  SB: 'Find a place to rest before setting out on a long expedition.',
  VS: 'There are many vertical branches. Remember the entrances you pass.',
  OE: 'This entrance has a story requirement; a locked gate does not always mean low Karma.',
  MS: 'Assess your underwater abilities before going deeper.',
  LM: 'Look for new shelters when crossing water and elevated structures.',
  LC: 'An important encounter is required before this entrance becomes available.',
  RM: 'The route is complex. Do not assume another character’s room path will work here.',
  DM: 'The route up and the way back may use different entrances.',
  UG: 'The different climate is a chance to regroup and plan.',
  CL: 'Look for high ground and passages that lead to different elevations.',
  HR: 'Enter only when this journey’s requirements are met.',
  waypoint: 'Use the in-game warp map and your current abilities as the guide; these are exploration waypoints only.',
};

export const EN_REGIONS = Object.fromEntries(Object.entries(REGIONS).map(([id, region]) => [id, {
  ...region,
  name: region.english,
  clue: region.waypoint ? regionClues.waypoint : regionClues[id],
}]));

const campaignNames = {
  survivor: 'Survivor', monk: 'Monk', hunter: 'Hunter', gourmand: 'Gourmand',
  artificer: 'Artificer', rivulet: 'Rivulet', spearmaster: 'Spearmaster',
  saint: 'Saint', watcher: 'Watcher',
};
const dlcNames = { 原版: 'Base game', Downpour: 'Downpour', 'The Watcher': 'The Watcher' };
const baseScope = 'Regional connections and a recommended story route across the 12 base-game regions. Downpour passages and optional endings are noted separately. This is not room-by-room navigation.';
const baseGraphNote = 'Lines show that regions are connected; they do not indicate the shortest, safest, or currently passable route. Karma, one-way drops, character abilities, and story requirements still apply in game.';

const story = {
  settle: {
    title: 'Find a safe shelter',
    hints: [
      'There is no need to rush this journey. Secure enough food and a safe place to hibernate before exploring farther.',
      'Explore up and to the right from your starting point. A good first expedition leads to a region dense with pipes and industrial structures.',
      'Outskirts → Industrial Complex. Find an available shelter and hibernate once before continuing.',
    ],
    completion: 'I found a shelter beyond the starting region and survived the night.',
  },
  'first-visit': {
    title: 'Visit an inhabitant',
    hints: [
      'Follow the yellow Overseer. It may point out food or shelter instead of giving directions, and it will not guide you constantly.',
      'Travel from Industrial Complex through Garbage Wastes toward the open water. Once you reach the coast, continue east.',
      'Go to the easternmost structure in Shoreline and look for an inhabitant to observe. Do not take or eat the glowing objects nearby. Not understanding the exchange yet does not mean you have taken the wrong route.',
    ],
    completion: 'I completed my first encounter in the eastern structure.',
  },
  'high-visit': {
    title: 'Continue toward higher ground',
    hints: [
      'After the first encounter, the journey points upward. Prepare for darkness and climbing.',
      'Enter Shaded Citadel from Shoreline and climb through Memory Crypts to The Exterior. This story route takes patience; it is not the shortest path.',
      'The Exterior → Five Pebbles. Explore upward inside until the full encounter is complete and you receive new guidance. Some internal branches can be bypassed; you do not need to tackle every dangerous route.',
    ],
    completion: 'The encounter above is complete, and I received guidance for what comes next.',
  },
  'far-journey': {
    title: 'Continue with your new guidance',
    hints: [
      'Continue in the direction you have just received. Make any desired return visits before setting out.',
      'Travel west and look for a way underground. A common regional route is The Exterior → Chimney Canopy → Sky Islands → Farm Arrays.',
      'Travel from Farm Arrays into Subterranean and continue deeper. Confirm that the previous encounter is complete. If the route remains blocked, return and check the growth requirement.',
    ],
    completion: 'I completed this journey’s final leg.',
  },
  'return-visit': {
    title: 'Optional: return for a visit',
    hints: [
      'After the encounter above, you can revisit an inhabitant you met earlier.',
      'Retrace your route toward the eastern water. You do not need to reset your save.',
      'Return to the easternmost structure in Shoreline. Bring only an item you want to ask about; this is an optional story branch.',
    ],
    completion: 'I completed a return visit I wanted to make.',
  },
  'alternate-journey': {
    title: 'An alternate journey, unlocked later',
    hints: [
      'With Downpour enabled, some earlier characters gain another optional journey.',
      'Complete Gourmand’s journey in the same save slot first. Until it is unlocked, do not repeatedly test the special gate.',
      'Once unlocked, enter Outer Expanse from the western side of Subterranean and continue toward its end. A connection shown near Outskirts is not a shortcut into this region.',
    ],
    completion: 'I completed the alternate journey after meeting its unlock requirement.',
  },
  'high-stop-1': {
    title: 'Plan your stops along the way',
    hints: [
      'This character has a limited number of cycles. Keep the starting items and plan the important stops as part of the route.',
      'Travel from Farm Arrays toward Sky Islands and watch for a special environmental signal as you approach higher ground.',
      'A growth encounter is high in Sky Islands near the Farm Arrays connection. Hunter does not need to activate it first, but still needs enough current Karma. Check whether your Karma cap increased afterward.',
    ],
    completion: 'I completed the special Sky Islands encounter or reached equivalent growth.',
  },
  'high-stop-2': {
    title: 'A second stop at height',
    hints: [
      'A special stop along the way can reduce backtracking later. Keep yourself supplied before moving on.',
      'Enter Chimney Canopy from Sky Islands and look upward near the connection between the regions.',
      'Another growth encounter is at the highest point of Chimney Canopy. Do not confuse the current Karma gained from hibernating with an increase to the Karma cap.',
    ],
    completion: 'I completed the special Chimney Canopy encounter or reached equivalent growth.',
  },
  'high-stop-3': {
    title: 'Climb the outer wall',
    hints: [
      'Continue upward and include another important stop in the same expedition.',
      'Enter The Exterior from Chimney Canopy and climb along the wall.',
      'A third growth encounter is near the top of the wall in The Exterior. Confirm that your cap increased before preparing to enter the neighboring structure.',
    ],
    completion: 'I completed the wall-top encounter or reached equivalent growth.',
  },
  'extra-time': {
    title: 'Gain a little more time',
    hints: [
      'This visit is optional. An encounter above can provide more time for the remainder of the journey.',
      'Keep the starting items before entering the elevated structure. Do not consume a quest item as food.',
      'Complete the encounter in Five Pebbles. By default, it grants five additional cycles. This raises the cap only once; Survivor’s growth requirements do not apply here.',
    ],
    completion: 'I completed the encounter above and checked my remaining cycles and cap.',
  },
  delivery: {
    title: 'Deliver the item you are carrying',
    hints: [
      'The item carried from the start is tied to a later objective. Do not abandon it to free a hand.',
      'Return from the high regions to The Exterior, then cross Shaded Citadel toward Shoreline.',
      'Go to the easternmost structure in Shoreline. Release the green item you are carrying and let the encounter finish; you can also offer the pearl you already have in your stomach. Leave only after the delivery is complete.',
    ],
    completion: 'I delivered the starting quest item and waited for the encounter to finish.',
  },
  'hunter-close': {
    title: 'Continue with the time you have left',
    hints: [
      'After completing the delivery, continue toward the end of the journey.',
      'You can enter Subterranean from Shoreline. Confirm that your cap is high enough; other special encounters along the way can help if it is not.',
      'The Karma cap must be 10 before entering the depths of Subterranean. The three earlier special stops and the encounter above meet this requirement. By default, continuing after the cycle count reaches zero carries serious risk.',
    ],
    completion: 'I completed the final leg within the time available to me.',
  },
  'gourmand-visit': {
    title: 'Visit the region above first',
    hints: [
      'Establish a supply stop first. Consider a long climb once you have recovered your strength.',
      'Enter The Exterior through Shaded Citadel and Memory Crypts, then explore the elevated structure.',
      'Complete the encounter in Five Pebbles and listen for the new direction. This encounter affects the next entrance; reaching the region boundary alone is not enough.',
    ],
    completion: 'I completed the encounter above and received a new direction.',
  },
  'gourmand-west': {
    title: 'Travel toward the distant exit',
    hints: [
      'Follow your new guidance to begin crossing beyond the familiar world.',
      'Travel west and look for the special entrance at the far western end of Subterranean.',
      'Enter Outer Expanse from Subterranean and continue west toward the end of the journey. The entrance requires the encounter above; the food quest does not need to be complete first.',
    ],
    completion: 'I reached the outer region and completed this journey.',
  },
  'gourmand-food': {
    title: 'Record the flavors along the way',
    hints: [
      'The food record in the hibernation menu is an optional goal that you can work on over time.',
      'Use the list to collect foods you have already discovered. The last few require the outer region, so not seeing them yet does not mean you missed anything.',
      'The list requires 22 food types. A complete list reveals creatures and locations, so it is not expanded here by default. If you want this branch, finish the list before reaching the end of Outer Expanse.',
    ],
    completion: 'I chose to complete the food quest and confirmed it before the journey’s end.',
  },
  'gourmand-coast': {
    title: 'A visit along the way',
    hints: [
      'You can make time for another inhabitant during the journey.',
      'Travel east toward the water from Shaded Citadel or Garbage Wastes.',
      'The easternmost structure in Shoreline has an optional encounter. It is not required to open the western exit.',
    ],
    completion: 'I completed this optional visit.',
  },
  'artificer-visit': {
    title: 'Give the journey a direction',
    hints: [
      'Learn how your movement abilities work before setting your sights on higher ground.',
      'Garbage Wastes → Industrial Complex → Chimney Canopy → The Exterior is one regional route. You can also climb from Shaded Citadel.',
      'Travel to Five Pebbles, complete the encounter, and wait for the companion device interaction to finish. The special gate cannot be reached directly from the start.',
    ],
    completion: 'I completed the encounter above and the companion device is guiding me again.',
  },
  'artificer-city': {
    title: 'Pass through the door opened for you',
    hints: [
      'After the encounter, an entrance that was previously unusable has a purpose.',
      'Return to the outer passages above and look for the special gate that requires your companion device.',
      'Enter Metropolis from The Exterior and continue upward and deeper into the city. You decide how to handle its important encounter and final action.',
    ],
    completion: 'I completed this journey’s ending in the city.',
  },
  'artificer-choice': {
    title: 'Preserve an alternative before the final action',
    hints: [
      'This journey has an alternative outcome. To preserve that option, confirm its requirements before taking the final action.',
      'Special encounters can raise the Karma cap. This character starts with a different cap from others, and one encounter has an additional condition at a low cap.',
      'The alternate outcome is deep underground. Check the appearance requirements for Artificer’s Echo. If the Karma cap is below 5, enter the relevant region at the current cap while protected by a Karma Flower. The final action in the city affects the options that remain.',
    ],
    completion: 'I understand the alternate choice and have decided whether to pursue it.',
  },
  'rivulet-coast': {
    title: 'Visit the east first',
    hints: [
      'The item you carry may offer a clue to your journey. Avoid discarding it casually.',
      'Travel east from Drainage System through Garbage Wastes toward the water.',
      'Meet the inhabitant in Shoreline’s easternmost structure. You can bring the starting pearl. This visit is recommended for context, but is not a gate requirement.',
    ],
    completion: 'I completed the eastern encounter and noted its guidance.',
  },
  'rivulet-high': {
    title: 'Check what comes next above',
    hints: [
      'The next leg leads to an elevated structure. Prioritize nearby shelters along the way.',
      'From Shoreline, climb toward The Exterior through Shaded Citadel, or take the route through Industrial Complex and Chimney Canopy.',
      'The Exterior → The Rot. Find the inhabitant you can communicate with and complete the encounter. Do not copy another character’s Five Pebbles room route.',
    ],
    completion: 'I completed the encounter above and learned what to bring next.',
  },
  'rivulet-carry': {
    title: 'Carry what this journey requires',
    hints: [
      'Wait for the current encounter to finish, then confirm that the quest item is actually in your hands. Reaching a region entrance does not complete the task.',
      'Follow the guidance and continue exploring the same structure to find the item you were asked to retrieve.',
      'Still in The Rot: find and carry the Rarefaction Cell, then prepare to return. If it is lost, check the key-item tracker if enabled. Do not set out for the next deep-water structure empty-handed.',
    ],
    completion: 'I am carrying the item this task requires.',
  },
  'rivulet-deep': {
    title: 'Bring it to its destination',
    hints: [
      'Follow the original direction back to the water. This time, go farther than you did on your first visit.',
      'Carry the quest item to Shoreline and look for the entrance to the underwater structure.',
      'Shoreline → Submerged Superstructure. Reach its Heart and place the quest item using the local interaction. Crossing the regional gate alone does not complete the task.',
    ],
    completion: 'I placed the quest item in the depths of the structure.',
  },
  'rivulet-return': {
    title: 'Afterward, make one more visit',
    hints: [
      'Once the task is done, there is one more encounter worth stopping for.',
      'Follow the later passages through the deep structure back toward the place you visited in the east.',
      'Return to Shoreline’s easternmost structure and complete the encounter after placing the quest item. Do not mark this complete before the item is placed.',
    ],
    completion: 'I completed the return visit after the task.',
  },
  'spear-high': {
    title: 'Follow your guide and complete the first errand',
    hints: [
      'Watch for directions from the red Overseer. Secure your supplies before traveling upward.',
      'Travel from Outskirts through Industrial Complex and Chimney Canopy into The Exterior. Visiting the other inhabitant first is optional.',
      'Complete the encounter in Five Pebbles. Before leaving, look for the important pearl left at the scene and take it with you.',
    ],
    completion: 'I completed the encounter above and took the important item with me.',
  },
  'spear-deliver': {
    title: 'Deliver what was left for you',
    hints: [
      'The next step is a delivery. Do not lose the item you just received to free a hand.',
      'From The Exterior, cross the intact bridge route into Waterfront Facility and look for a way up to another structure.',
      'Waterfront Facility → Looks to the Moon. Complete the encounter with the important pearl. Wait for all item-related interactions to finish before taking it and leaving.',
    ],
    completion: 'I completed the second encounter while carrying the important item.',
  },
  'spear-final': {
    title: 'Carry the new guidance farther',
    hints: [
      'The final leg requires the item you just handled. Check that you have it before leaving.',
      'The destination is high in the west. You can reach Sky Islands through The Exterior and Chimney Canopy.',
      'Take the processed pearl to the communications array in Sky Islands, reach the top, and complete the local interaction. It must be this quest item, not an arbitrary pearl.',
    ],
    completion: 'I brought the correct quest item to its final destination.',
  },
  'spear-early': {
    title: 'You can listen to another visitor first',
    hints: [
      'If you want more context for this journey, visit another inhabitant before completing the errand above.',
      'Travel from Outskirts through Industrial Complex and Garbage Wastes to Waterfront Facility, then look for a way upward.',
      'Visiting Looks to the Moon before your first trip to Five Pebbles can provide useful context. The main journey still requires you to obtain the item in Five Pebbles and return here afterward.',
    ],
    completion: 'I chose to make this early visit.',
  },
  'saint-one': {
    title: 'Begin with the first stop',
    hints: [
      'This journey is guided by special stops along the way. Get through the opening safely and watch for changes in the environment.',
      'In the starting region, look for higher ground near the western connection.',
      'In SI, look high in Sky Islands for the first growth encounter. It does not appear during cycle zero; hibernate normally once first. You do not need to fill your current Karma to trigger it.',
    ],
    completion: 'I completed a growth encounter in the starting region.',
  },
  'saint-two': {
    title: 'Continue the high-ground visits',
    hints: [
      'When a special signal appears along the way, stop and look for its source.',
      'Travel to the tower region east of your start and explore its highest areas.',
      'In CC, complete a growth encounter at the highest point of Chimney Canopy, near the connection to SI.',
    ],
    completion: 'I completed the growth encounter in the tower region.',
  },
  'saint-three': {
    title: 'Visit another structure',
    hints: [
      'This character’s terrain differs from earlier journeys. Follow the current regional layout.',
      'Travel east by way of Industrial Complex and look for high ground on the right side of the large structure.',
      'A growth encounter lies at the far right of Silent Construct, above the former Exterior supports. Use this character’s terrain to find the passage.',
    ],
    completion: 'I completed the growth encounter high in the structure.',
  },
  'saint-four': {
    title: 'Continue exploring by the water',
    hints: [
      'After visiting the familiar place by the water, continue exploring the region.',
      'Follow the eastern coast and look for an upward passage above the easternmost structure.',
      'In SL, a growth encounter is on the wall above the eastern end of Shoreline. The change in gravity can help you enter the upper passage.',
    ],
    completion: 'I completed the growth encounter above the eastern coast.',
  },
  'saint-five': {
    title: 'Look for a warmer stop',
    hints: [
      'In severe cold, a change of environment can also be a chance to regroup.',
      'Travel west into the warmer underground vegetation and look near its connection to the depths.',
      'A growth encounter is at the far western end of Undergrowth, near the entrance to Subterranean.',
    ],
    completion: 'I completed the growth encounter in a warmer region.',
  },
  'saint-six': {
    title: 'Return to the western fields',
    hints: [
      'You can complete any remaining encounters in any order; there is no single required route.',
      'Enter the western fields through Outskirts and look for high ground near the entrance.',
      'In LF, a growth encounter is high in Farm Arrays near the SU entrance.',
    ],
    completion: 'I completed the growth encounter in the western fields.',
  },
  'saint-seven': {
    title: 'Stop once more before entering the depths',
    hints: [
      'You can combine the final visit with your journey underground.',
      'Enter Subterranean from the western fields and look for a cave to the right of the entrance.',
      'In SB, a growth encounter lies in a cave to the right of the LF entrance. Completing seven distinct encounters will usually raise the cap from 2 to 10.',
    ],
    completion: 'I completed the required growth and confirmed the cap is high enough.',
  },
  'saint-close': {
    title: 'When ready, continue into the depths',
    hints: [
      'Make any return visits you still want before continuing.',
      'Confirm the growth requirements are met, then travel deeper from Subterranean.',
      'Reach maximum Karma 10, enter the depths of Subterranean, and continue to Rubicon. Return visits to other inhabitants are optional, not required prerequisites.',
    ],
    completion: 'I completed the journey into the depths.',
  },
  'saint-extra': {
    title: 'An extra visit with a difficult approach',
    hints: [
      'There is another stop, but it does not need to block the main journey.',
      'A higher area lies inside the underwater structure to the east. Go only when your abilities are ready.',
      'An extra encounter is near Bitter Aerie and the auxiliary communications array in Submerged Superstructure. The regular seven encounters are enough to raise the cap; do not dive here just to finish the main route.',
    ],
    completion: 'I chose to complete this extra visit.',
  },
  'watcher-prologue': {
    title: 'Complete the three stops in the prologue',
    hints: [
      'Look for unusual environmental signals in reachable regions. There is no need to force your way through a closed passage.',
      'The prologue’s three stops are in a tower, a castle in shadow, and the western fields. You can visit them in any order.',
      'Find the encounter at the top of Chimney Canopy, in the cave below the eastern entrance of Shaded Citadel, and in eastern Farm Arrays. Complete all three before following the later route; visiting only one is not enough.',
    ],
    completion: 'I completed all three prologue encounters and entered the new phase of the journey.',
  },
  'watcher-explore': {
    title: 'Keep meeting others in the new regions',
    hints: [
      'This new way of traveling has no fixed route. Watch for familiar environmental signals in each region.',
      'Explore different regions using the warp map in your save. Encounters bring growth; rest after repeated warps.',
      'Complete eight valid growth encounters in different new regions to raise the Ripple cap to 9. Possible regions include Aether Ridge, Desolate Tract, Badlands, Turbulent Pump, Torrid Desert, Heat Ducts, Stormy Coast, Verdant Waterways, Signal Spires, Fetid Glen, Salination, and Fractured Gateways. No fixed order is required.',
    ],
    completion: 'My new ability cap has reached 9.',
  },
  'watcher-old-friend': {
    title: 'Keep your promise and complete an encounter',
    hints: [
      'An earlier encounter has more to it once your new ability is stable.',
      'Use your full ability to find an encounter that is normally hidden. Afterward, follow the newly opened route.',
      'At Ripple level 9, enter the Ripple Space in Shattered Terrace and complete the encounter. Follow the new path to Ancient Urban. After the sequence of local encounters, wake up and return to your original room to finish this branch.',
    ],
    completion: 'I completed this branch and made the return visit after waking.',
  },
  'watcher-outer': {
    title: 'Watch another place that changes over time',
    hints: [
      'Some places need another visit after your abilities grow. Finding no further progress on the first visit does not mean you took a wrong route.',
      'Once you reach the region this clue points to, watch for dialogue above the central structure and newly opened side rooms.',
      'Complete the first visit at the upper structure in Outer Rim. Return at cap levels 3, 5, and 7, and complete the upper dialogue each time. After all four exit rooms open, complete at least one encounter with the inhabitant who appears.',
    ],
    completion: 'I opened all four exits and completed an encounter afterward.',
  },
  'watcher-feathers': {
    title: 'Follow the golden traces',
    hints: [
      'New traces may appear beside routes you have already traveled after they change. Review the optional branch below before the fourth encounter.',
      'Look for golden feathers beside region icons on the hibernation map. Return to those regions and investigate the closed, player-built routes.',
      'Let the camera see a closed dynamic warp point where an encounter can still trigger, then follow the threads and lights in Ripple Space. After four encounters, follow the new guidance and handle every warp point that must be closed. Outer Rim and Ripple-only connections are excluded from the ordinary list. This branch returns you to Daemon.',
    ],
    completion: 'I completed the golden-trace branch.',
  },
  'watcher-final': {
    title: 'Check that the clues have come together',
    hints: [
      'This step depends on progress from more than one earlier journey. If it does not trigger, check for an unfinished encounter.',
      'Confirm that both the earlier promised encounter and the golden-trace branch are complete, and that you visited the inhabitant after the other structure changed.',
      'Go to Daemon and check the three obelisks. Requirements: complete the Ancient Urban branch, complete the golden-trace branch, and speak at least once with the Outer Rim inhabitant after they appear. The optional spread branch is not required.',
    ],
    completion: 'I completed the final journey after meeting its requirements.',
  },
  'watcher-other': {
    title: 'Keep another choice open in the same save',
    hints: [
      'If you want to see every route in one save, check this reminder before the fourth golden encounter.',
      'The two later objectives affect each other. Complete the optional spread objective before the fourth golden encounter to preserve more choices.',
      'The optional branch requires spreading the special infection to every region it can reach, then completing an encounter with the Outer Rim inhabitant. After the fourth encounter with the inhabitant tied to the golden traces, your ability will prevent further spread. This branch is not required for the final main route.',
    ],
    completion: 'I decided whether to pursue the optional branch and planned the order.',
  },
};

const regionNameById = Object.fromEntries(Object.entries(EN_REGIONS).map(([id, region]) => [id, region.name]));
const campaignRegionNames = {
  saint: {
    SU: 'Suburban Wastelands', HI: 'Frozen Monument', CC: 'Lonely Towers',
    GW: 'Glacial Wasteland', VS: 'Desolate Pipeline', SL: 'Cold Coast',
    SI: 'Windblown Spires', LF: 'Barren Fields', SB: 'Primordial Underground',
  },
};

export const EN_CAMPAIGNS = CAMPAIGNS.map(campaign => ({
  ...campaign,
  name: campaignNames[campaign.id],
  dlc: dlcNames[campaign.dlc] || campaign.dlc,
  scope: campaign.id === 'survivor' || campaign.id === 'monk' || campaign.id === 'hunter'
    ? baseScope
    : ({
        gourmand: 'Downpour main route, regional connections, food quest, and return-visit branch. The food quest is not required for the ordinary ending.',
        artificer: 'Downpour main story route and conditions for an alternate ending. No instructions are given for defeating a key character.',
        rivulet: 'Downpour story route with staged guidance for encounters, quest items, destination structures, and return visits.',
        spearmaster: 'Downpour delivery route, with an optional context visit before the main round trip. Important carried items are called out separately.',
        saint: 'Seven growth encounters and the main destination in Downpour. This is one workable visit order; adjust it to account for encounters already completed.',
        watcher: 'Organized around the four ending requirements in Watcher 1.5 and later. Covers prologue connections, growth encounters, dynamic waypoints, and branch reminders without treating random or closing warp routes as fixed.',
      })[campaign.id],
  graphNote: campaign.id === 'watcher'
    ? 'The prologue connections are a guide. After warping begins, follow the warp map in your save. Dashed lines may be one-way or dynamic. The 30 new regions are waypoints; cross-region shortest paths are not calculated.'
    : campaign.id === 'gourmand'
      ? `${baseGraphNote} The entrance to Outer Expanse requires the encounter above; Outer Expanse → Outskirts is one-way.`
      : campaign.id === 'artificer'
        ? `${baseGraphNote} The Metropolis entrance requires the encounter above; Waterfront Facility does not lead to the other available encounter.`
        : campaign.id === 'saint'
          ? `${baseGraphNote} Subterranean → Rubicon is a one-way destination available only after its requirements are met. Region names and connections are adjusted for this character.`
          : baseGraphNote,
  warning: ({
    survivor: 'Recommended for a first playthrough. Ordinary deaths do not erase the entire save; begin by learning to hibernate safely.',
    monk: 'A gentler journey. A Karma Gate you have unlocked will no longer require its Karma threshold, but it still cannot be used repeatedly in the same cycle.',
    hunter: 'The default limit is 20 cycles; Remix can change it. Failure at or below zero cycles can end the run. Keep the starting quest item. Hunter has no Passage token.',
    gourmand: 'Repeated jumps and spear throws cause fatigue; allow it to subside before continuing. The food quest can be completed during the journey; it need not be finished before setting out.',
    artificer: 'This character interacts with Karma Gates differently; carrying a Scavenger corpse can satisfy the gate requirement. Explosive actions build heat, and even a short dive is risky.',
    rivulet: 'The starting cycle is considerably shorter. Underwater movement is strong, but breath remains limited; repeated underwater boosts use air faster.',
    spearmaster: 'You can eat only living prey struck by a newly created needle-spear that remains attached to your body. Carry the late-game quest item yourself; Passage may not bring it along.',
    saint: 'Plants are your main food, and spear use differs from other characters. Watch your body temperature outdoors; lanterns and other heat sources help. Saint has no Passage token.',
    watcher: 'Warp fatigue does not disappear when the rain timer resets; you still need to hibernate. Later branches affect one another. Read the current branch reminder if you want to preserve every route in one save.',
  })[campaign.id],
  food: campaign.food.replace(/^(\d+) 格休眠 \/ 最多 (\d+) 格$/, '$1 needed to hibernate / $2 maximum food pips'),
  ...(campaign.regionNames
    ? { regionNames: Object.fromEntries(Object.keys(campaign.regionNames).map(id => [id, campaignRegionNames[campaign.id]?.[id] || regionNameById[id]])) }
    : {}),
  stages: campaign.stages.map(stage => ({
    ...stage,
    ...story[stage.id],
  })),
}));

const tips = {
  shelter: ['Survival', 'Find a safe shelter', 'A safe shelter is a worthwhile exploration goal.', 'Once you meet the food requirement, enter an available shelter and remain quiet to hibernate. Hibernation saves progress; entering a new region alone does not save the current cycle. When food is sufficient, you can rest before the cycle ends.'],
  food: ['Survival', 'Eat what you need for hibernation', 'The food required for hibernation varies by character.', 'The divider on the food bar marks the amount needed for a normal hibernation; food to its right can usually be saved for the next cycle. Survivor needs 4 pips, Monk 3, Hunter 6, Gourmand 7, Artificer 6, Rivulet 5, Spearmaster 5, Saint 4, and Watcher 4. Each character also has a different diet.'],
  rain: ['Survival', 'Reserve time to return before the cycle ends', 'Leave time to reach shelter and avoid creatures.', 'Watch the cycle timer when checking the map, and reserve time for the return trip and for avoiding creatures. Some regions have different end-of-cycle rules, so do not treat another character’s cycle length as a standard. Rivulet needs to plan shelters earlier; Saint must also watch body temperature.'],
  karma: ['Progress stalled', 'Check the Karma levels on both sides of a gate', 'Current Karma and the Karma cap are separate values.', 'Usually, meeting the food requirement and hibernating successfully raises current Karma, while death lowers it. A Karma Gate requires the level shown on your side; the two sides may have different requirements. Stand still and wait for it to open. Each gate can usually be crossed only once per cycle, including by Monk after it is unlocked.'],
  death: ['Accessibility', 'Death and save progress', 'Death usually returns you to your last successful hibernation.', 'Most characters return to the progress from their last successful hibernation after death, and explored regions usually remain on the map. Use a cycle to practice a route without advancing the story each time. Hunter’s cycle limit is an important exception; this rule does not apply to Hunter at negative cycles.'],
  starving: ['Survival', 'Starving hibernation is not a normal save', 'Trying to hibernate without enough food carries extra risk.', 'With at least one food pip, you can hold down at a shelter to attempt starving hibernation. Progress is not saved normally, and the next cycle leaves you weakened and requiring a full food bar. A failure rolls back to the previous normal save. New players should look for food rather than treating this as a free save.'],
  swim: ['Controls', 'Underwater boosts use air faster', 'Check the exit before entering a long waterway.', 'Swim steadily and plan places to surface. Repeatedly pressing jump to boost underwater uses air quickly. Rivulet has greater lung capacity, not unlimited breath. Turning back the way you came can be safer than forcing an uncertain exit.'],
  guide: ['Exploration', 'Continue exploring when the Overseer gives no directions', 'The Overseer may also point out food, shelters, and danger.', 'Look for another reachable region, or replenish food and hibernate. The Overseer does not provide directions in every room. When you encounter a quiet inhabitant, observe first; avoid attacking, grabbing, or eating nearby objects.'],
  visitors: ['Exploration', 'Avoid hostile actions during encounters', 'Observe and wait for the interaction to finish.', 'Not every creature is an enemy or food. When you encounter a distinctive room or inhabitant, stop and observe. It may be normal not to understand the interaction yet. If an inhabitant clearly resists being grabbed, release it immediately.'],
  scavs: ['Survival', 'Negotiate with Scavengers', 'Stay low and observe their response.', 'Some crossings have Scavenger tolls, and pearls are usually valuable trade items. Set an item down and wait for the Scavengers to accept it and signal you through. One successful crossing does not mean other crossings are free; Artificer has different relationship rules.'],
  light: ['Exploration', 'Solve the visibility problem before entering the dark', 'Lighting is part of route preparation.', 'If you see an inhabitant carrying a lantern, you may be able to trade for it. The game does not require you to enter every dark area without light. Find a light source or take another reachable route; you do not need to harm a special inhabitant to get light.'],
  movement: ['Controls', 'Learn the basic movement controls', 'Charged jumps, wall jumps, and throwing are useful actions.', 'On safe ground, practice crouching to charge a jump; beside a wall, practice jumping away from it. A rock can also create a brief opportunity to escape. Characters differ in speed, fatigue, and throwing ability, so a failed jump does not necessarily indicate a wrong route.'],
  hands: ['Controls', 'Check carried items before using a Passage', 'Important items may not travel with you automatically.', 'Ordinary characters can store some small objects in their stomach, but available items vary by character. Keep Spearmaster’s quest item safe during the later part of the journey. Before using a Passage, check Remix’s key-item tracking and carry settings; do not assume every item in your hands will travel with you.'],
  passage: ['Exploration', 'Use Passage to return to a shelter', 'An earned Passage can return you to a shelter you have reached.', 'Characters with an available token can use Passage from the hibernation menu to choose a shelter reached during the current campaign. The token is consumed, so confirm the destination first. Hunter, Saint, and Watcher cannot obtain this token. Whether key items travel with you depends on settings.'],
  remix: ['Accessibility', 'Review Remix accessibility settings', 'Adjust assistance options as needed.', 'Remix settings provide additional tutorials, breathing displays, and other assistance; names may vary by language and version. Hunter’s cycle count and bonus cycles can also be adjusted. Record any changes so they can be restored later.'],
  'wrong-route': ['Progress stalled', 'A regional connection may not be passable now', 'A regional map cannot replace room terrain.', 'At a special locked gate, a large drop, or a blocked passage, check your character, DLC, and story stage. Some connections are one-way; others lead only to isolated branches. This tool provides regional guidance, not a guarantee that the route with the fewest edges is easiest to traverse.'],
  'watcher-rest': ['Watcher', 'Watch for ability fatigue after warping', 'A reset rain timer does not clear warp fatigue.', 'Repeated warps in one cycle build fatigue, shorten the time your ability remains available, and may send you off course. Follow the warp map in your current save. Solid lines usually indicate fixed two-way connections; dashed lines may be one-way or dynamic.'],
  'spoiler-controls': ['Accessibility', 'Reveal route hints gradually', 'Region names and story details may contain spoilers.', 'Hints reveal information in stages, from general clues to specific locations. Full external maps, the Wiki, and linked references may reveal later regions, creatures, or story details. Keeping exploration notes can reduce repeated searches.'],
};

export const EN_SURVIVAL_TIPS = SURVIVAL_TIPS.map(tip => {
  const [category, title, summary, body] = tips[tip.id];
  return { ...tip, category, title, summary, body };
});
