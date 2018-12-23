<template>
  <div id="intro" :style='{opacity}'>
    <div class='container'>
      <h1>Legends</h1>
      <p>
        Since its inception in 1901, <strong><a href='https://en.wikipedia.org/wiki/List_of_female_Nobel_laureates' target='_new'>51 women</a></strong> have been awarded the <strong><a href='https://en.wikipedia.org/wiki/Nobel_Prize' target='_new'>Nobel Prize</a></strong>.  These legendary women are represented as <strong>crystals</strong>, encoded by data from their Wikipedia pages.  They are colored by the category of their award, sized by their "influence" (mentions in other Wikipedia pages), and positioned by the decade they received their prize.
      </p>

      <!-- legend -->
      <div class='grid legend'>
        <div class='size'>
          <Crystal v-bind='{data: sizes, crystalWidth: 70, crystalHeight: 150}'></Crystal>
          <div class='label'>
            <span style='float: left'>← Less "influence"</span>
            <span style='float: right'>More "influence" →</span>
          </div>
        </div>
        <div class='grid color'>
          <Crystal v-bind='{data: science, crystalWidth: 70, crystalHeight: 100}'></Crystal>
          <div class='label'>
            <strong>Natural Sciences</strong><br>
            <sup>(Physics, Chemistry, and Medicine)</sup>
          </div>
          <Crystal v-bind='{data: humanities, crystalWidth: 70, crystalHeight: 100}'></Crystal>
          <div class='label'>
            <strong>Humanities & Social Sciences</strong><br>
            <sup>(Peace, Literature, and Economics)</sup>
          </div>
        </div>
      </div>

      <div class='grid explore'>
        <h3 @click='toggleIntro(0)'>Explore</h3>
        <div class='label'>
          <strong>Zoom & pan to navigate.</strong><br>
          <sup>Warning: sensitive controls.</sup>
        </div>
      </div>

      <p>
        Each <strong>star</strong> represents one of <strong>853 men</strong> that have won the award.
      </p>

      <p class='credits'>
        <sup>
        Made with 💖 by <a href='https://twitter.com/sxywu' target='_new'>Shirley Wu</a> for <a href='https://christmasexperiments.com' target='_new'>Christmas XP</a> and <a href='http://www.datasketch.es/' target='_new'>Datasketch|es</a>.<br>
        Many thanks to <a href='https://twitter.com/mattdesl' target='_new'>Matt DesLauriers</a> for his introductory <a href='https://frontendmasters.com/workshops/canvas-webgl/' target='_new'>creative coding workshop</a> and all subsequent feedback 🙏
        </sup>
      </p>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import Crystal from './Crystal.vue'

export default {
  name: 'intro',
  props: ['toggleIntro', 'opacity'],
  components: {Crystal},
  data() {
    return {
      science: [{color: 0, faces: 9, size: 1.5}],
      humanities: [{color: 1, faces: 9, size: 1.5}],
      sizes: _.times(6, i => {
        return {color: 0, faces: 9, size: i * 0.25 + 0.5}
      })
    }
  },
}
</script>

<style scoped>
#intro {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
}

.container {
  width: calc(100% - 100px);
  max-width: 800px;
  max-height: calc(100% - 100px);
  position: absolute;
  top: 50vh;
  left: 50vw;
  transform: translate(-50%, -50%);
}

h1 {
  font-size: 42px;
  margin-top: 0;
}

p {
  line-height: 1.6;
}

.grid.legend {
  display: grid;
  grid-template-columns: repeat(2, min-content);
  align-items: center;
  font-size: 12px;
}

.grid.color {
  display: grid;
  grid-template-columns: repeat(2, min-content);
  grid-template-rows: repeat(2, auto);
  align-items: center;
  line-height: 1.6;
}

.color .label {
  width: 200px;
}

.size .label {
  padding: 10px 40px 0 32px;
  font-weight: bold;
}

.grid.explore {
  display: grid;
  grid-template-columns: repeat(2, min-content);
  align-items: center;
  grid-gap: 20px;
}

.explore h3 {
  padding: 10px 40px;
  border: 2px solid;
  display: inline-block;
  cursor: pointer;
}

.explore .label {
  width: 200px;
  font-size: 12px;
  line-height: 1.6;
}

.credits {
  font-size: 12px;
  line-height: 1.6;
}
</style>
