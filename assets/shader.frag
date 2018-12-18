uniform float color;
varying vec2 vUv;
// for noise
#pragma glslify: noise = require('glsl-noise/simplex/3d');
#pragma glslify: hsl2rgb = require('glsl-hsl2rgb');

void main() {
  float n = noise(vec3(vUv, 0.25));
  vec3 rgb = hsl2rgb(
    color,
    0.75 - n * 0.1,
    0.75 - n * 0.25
  );
  gl_FragColor = vec4(rgb, 1.0);
}
