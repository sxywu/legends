<template>
  <div id="intro">
    <div class='container'>
      <h1>Legends</h1>
      <p>
        Since its inception in 1901, <strong>51 women</strong> have been awarded the Nobel Prize.  These legendary women are represented as <strong>crystals</strong>, encoded by data from their Wikipedia pages.  They are colored by the category of their award, sized by their "influence" (mentions in other Wikipedia pages), and positioned by the decade they received their prize.
      </p>

      <!-- legend -->
      <div class='grid legend'>
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
        <div class='size'>
          <Crystal v-bind='{data: sizes, crystalWidth: 70, crystalHeight: 150}'></Crystal>
          <div class='label'>
            <span style='float: left'>← Less "influence"</span>
            <span style='float: right'>More "influence" →</span>
          </div>
        </div>
      </div>

      <h2 class='explore' @click='toggleIntro(false)'>Explore</h2>
      <p>
        Each <strong>star</strong> represents one of the <strong>853 men</strong> that have won the award.
      </p>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import Crystal from './Crystal.vue'

export default {
  name: 'intro',
  props: ['toggleIntro'],
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

<style>
#intro {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.85);
}

.container {
  width: calc(100% - 100px);
  max-width: 800px;
  height: calc(100% - 100px);
  position: absolute;
  top: 50vh;
  left: 50vw;
  transform: translate(-50%, -50%);
}

.explore {
  padding: 10px 40px;
  border: 2px solid;
  display: inline-block;
  cursor: pointer;
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
  padding: 10px 20px 0 20px;
  font-weight: bold;
}
</style>
