using System.Collections.Generic;
using UnityEngine;

namespace WhereShouldIGo
{
    // Owns only the temporary colours and shaders changed during one HUD draw.
    internal sealed class HudRouteTint
    {
        private readonly Dictionary<FSprite, Original> changed = new Dictionary<FSprite, Original>();

        internal void Apply(FSprite sprite, FShader lineShader, Color color)
        {
            if (sprite == null || changed.ContainsKey(sprite)) return;
            if (sprite is TriangleMesh mesh)
            {
                if (lineShader == null || mesh.verticeColors == null) return;
                changed.Add(sprite, new Original(sprite, mesh));
                // MapShortcut uses RGB as animation parameters, not a tint.
                // Basic renders the existing geometry using actual vertex RGB.
                mesh.shader = lineShader;
                for (var i = 0; i < mesh.verticeColors.Length; i++)
                    mesh.verticeColors[i] = new Color(color.r, color.g, color.b, mesh.verticeColors[i].a);
            }
            else
            {
                changed.Add(sprite, new Original(sprite, null));
                sprite.color = new Color(color.r, color.g, color.b, sprite.color.a);
            }
        }

        internal void Restore()
        {
            foreach (var pair in changed) pair.Value.Restore(pair.Key);
            changed.Clear();
        }

        private sealed class Original
        {
            private readonly FShader shader;
            private readonly Color color;
            private readonly Color[] vertices;

            internal Original(FSprite sprite, TriangleMesh mesh)
            {
                shader = sprite.shader;
                color = sprite.color;
                vertices = mesh == null ? null : (Color[])mesh.verticeColors.Clone();
            }

            internal void Restore(FSprite sprite)
            {
                sprite.shader = shader;
                sprite.color = color;
                if (sprite is TriangleMesh mesh && vertices != null && mesh.verticeColors != null)
                    System.Array.Copy(vertices, mesh.verticeColors, System.Math.Min(vertices.Length, mesh.verticeColors.Length));
            }
        }
    }
}
