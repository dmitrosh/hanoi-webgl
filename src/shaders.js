// GLSL source strings for the two shader programs.

// ─── Main program (lit geometry: floor, disks, pegs) ────────────────────────

export const MAIN_VERT = /* glsl */`#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aColor;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat4 uNormalMatrix;

out vec3 vWorldPos;
out vec3 vNormal;
out vec3 vVertexColor;

void main() {
  vec4 worldPos = uModel * vec4(aPosition, 1.0);
  vWorldPos     = worldPos.xyz;
  vNormal       = normalize(mat3(uNormalMatrix) * aNormal);
  vVertexColor  = aColor;
  gl_Position   = uProjection * uView * worldPos;
}
`;

export const MAIN_FRAG = /* glsl */`#version 300 es
precision mediump float;

in vec3 vWorldPos;
in vec3 vNormal;
in vec3 vVertexColor;

uniform vec3  uLightDir;      // world-space directional light (normalized)
uniform vec3  uCameraPos;     // world-space eye position
uniform vec3  uDiffuseColor;  // uniform color for disks/pegs
uniform bool  uUseVertexColor;// true for floor
uniform vec3  uAmbient;
uniform vec3  uSpecular;
uniform float uShininess;

out vec4 fragColor;

void main() {
  vec3 baseColor = uUseVertexColor ? vVertexColor : uDiffuseColor;
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDir);
  vec3 V = normalize(uCameraPos - vWorldPos);
  vec3 R = reflect(-L, N);

  float diff = max(dot(N, L), 0.0);
  float spec = pow(max(dot(R, V), 0.0), uShininess);

  vec3 color = uAmbient * baseColor
             + diff * baseColor
             + spec * uSpecular;
  fragColor = vec4(color, 1.0);
}
`;

// ─── Text program (unlit, alpha-blended canvas texture) ──────────────────────

export const TEXT_VERT = /* glsl */`#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;

uniform mat4 uMVP;
out vec2 vTexCoord;

void main() {
  vTexCoord   = aTexCoord;
  gl_Position = uMVP * vec4(aPosition, 1.0);
}
`;

export const TEXT_FRAG = /* glsl */`#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uTexture;
out vec4 fragColor;

void main() {
  vec4 texel = texture(uTexture, vTexCoord);
  if (texel.a < 0.01) discard;
  fragColor = texel;
}
`;
