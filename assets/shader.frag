varying vec2 vUv;
// for noise
#pragma glslify: noise = require('glsl-noise/simplex/3d');
#pragma glslify: hsl2rgb = require('glsl-hsl2rgb');

void main() {
  float n = noise(vec3(vUv, 0.25));
  vec3 color = hsl2rgb(
    0.25 + n * 0.3,
    0.65 - n * 0.1,
    0.8 - n * 0.25
  );
  gl_FragColor = vec4(color, 1.0);
}
