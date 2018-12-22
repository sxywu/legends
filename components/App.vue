<template>
  <div id="app">
    <World v-bind='{legends}'></World>
    <Intro v-bind='{toggleIntro, opacity: introOpacity}' v-if='introOpacity'></Intro>
    <div id='showIntro' :style='{opacity: 1 - introOpacity}' @click='toggleIntro(1)'>i</div>
  </div>
</template>

<script>
import _ from 'lodash'
import {TweenLite} from 'gsap'

import Intro from './Intro.vue'
import World from './World.vue'
import legends from '../assets/legends.json'

export default {
  name: 'app',
  components: {
    World, Intro,
  },
  data() {
    return {
      legends: _.chain(legends)
        .uniqBy('name')
        .map(d => Object.assign(d, {
          birthday: new Date(d.birthday),
          deathday: new Date(d.deathday),
          decade: _.floor(d.year, -1),
        })).value(),
      introOpacity: 1,
    }
  },
  methods: {
    toggleIntro: function(introOpacity) {
      TweenLite.to(this.$data, 0.5, {introOpacity})
    }
  }
}
</script>

<style>
#showIntro {
  color: #fff;
  position: fixed;
  top: 0;
  right: 0;
  margin: 10px;
  font-size: 18px;
  line-height: 24px;
  width: 24px;
  height: 24px;
  border-radius: 24px;
  border: 2px solid;
  text-align: center;
  cursor: pointer;
}
</style>
