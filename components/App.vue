<template>
  <div id="app">
    <World v-bind='{legends}'></World>
    <Intro v-bind='{toggleIntro}' v-show='showIntro'></Intro>
  </div>
</template>

<script>
import _ from 'lodash'
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
      showIntro: true,
    }
  },
  methods: {
    toggleIntro: function(toggle) {
      this.showIntro = toggle
    }
  }
}
</script>

<style>
#app {
}
</style>
