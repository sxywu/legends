<template>
  <div id="intro">
    <div class='container'>
      <h1>Legends</h1>
      <p>
        Since its inception in 1901, <strong>51 women</strong> have been awarded the Nobel Prize.  These legendary women are represented as <strong>crystals</strong>, encoded by data from their Wikipedia pages.  They are colored by the category of their award, sized by their "influence" (mentions in other Wikipedia pages), and positioned by the decade they received their prize.
      </p>
      <h2 class='explore'>Explore</h2>
      <p>
        Each <strong>star</strong> represents the <strong>853 men</strong> that have won the award.
      </p>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'

export default {
  name: 'intro',
  props: ['toggleIntro'],
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
</style>