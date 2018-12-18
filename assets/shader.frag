uniform float colorType;
varying vec2 vUv;
// for noise
#pragma glslify: noise = require('glsl-noise/simplex/3d');
#pragma glslify: hsl2rgb = require('glsl-hsl2rgb');

#define PI 3.14159265359
vec3 colorA = vec3(0.149,0.141,0.912);
vec3 colorB = vec3(1.000,0.833,0.224);

void main() {
  vec3 color = vec3(0.0);

  vec3 pct = vec3(vUv, 1.0);
  
  pct.r = 1.0;
  pct.g = sin(vUv.y) * 1.5;
  pct.b = sin(vUv.y * 1.0);

  color = mix(colorA, colorB, pct);
  gl_FragColor = vec4(color, 1.0);
}
