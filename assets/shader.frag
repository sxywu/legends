varying vec2 vUv;
// for noise
#pragma glslify: noise = require('glsl-noise/simplex/3d');

void main() {
  gl_FragColor = vec4(vUv.y, 0.0, 0.0, 1.0);
}
