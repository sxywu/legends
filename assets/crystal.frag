uniform float colorType;
uniform sampler2D textureMap;
varying vec2 vUv;
varying vec3 vNormal;
#pragma glslify: blend = require(glsl-blend/linear-dodge)

#define PI 3.14159265359
vec3 colorA = vec3(0.149,0.141,0.912); // blue
vec3 colorB = vec3(1.000,0.833,0.224); // yellow
vec3 colorC = vec3(0.549,0.341,0.512); // pink

void main() {
  vec3 color = vec3(0.0);

  vec3 pct = vec3(vUv, 1.0);

  if (colorType == 1.0) {
    // humanities
    pct.r = 1.0;
    pct.g = sin(vUv.y) - 0.25;
    pct.b = sin(vUv.y) + 0.25;
    // gradient
    color = mix(colorA, colorC, pct);
    color = mix(color, colorB, sin(vUv.y * 0.75) * 0.75);
  } else {
    // sciences
    pct.r = 1.0 - sin(vUv.y * 1.5) + 0.5;
    pct.g = 1.0 - sin(vUv.y * 1.2);
    pct.b = 1.0 - sin(vUv.y * 1.2) + 0.35;
    // gradient
    color = mix(colorA, colorB, pct);
  }

  // face normals
  color += vNormal.x * 0.2 + vNormal.y * 0.2 + vNormal.z * 0.1;
  // texture
  color = blend(color, sin(texture2D(textureMap, vUv).rgb * 2.5) * 0.25);

  gl_FragColor = vec4(color, 1.0);
}
