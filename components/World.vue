<template>
  <div ref='container' :width='width' :height='height' />
</template>

<script>
import _ from 'lodash'
import {extent, scaleLinear} from 'd3'
import * as THREE from 'three'
const OrbitControls = require('three-orbit-controls')(THREE)
const vertexShader = require('../assets/shader.vert')
const fragmentShader = require('../assets/shader.frag')

export default {
  name: 'world',
  props: ['legends'],
  data() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  },
  created() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 100)
    this.renderer = new THREE.WebGLRenderer()

    // WebGL background color
    this.renderer.setClearColor('#fff', 1)

    // set renderer size
    this.renderer.setSize(this.width, this.height)

    // set camera position
    this.camera.position.set( 0, 0, 10 )
    this.camera.lookAt( 0, 0, 0 )

    // orbital controls
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.addEventListener("change", () => this.renderer.render(this.scene, this.camera));

    // create scales:
    // z-index: decade of award
    // size: backlinks
    const sizeDomain = extent(this.legends, d => d.backlinks)
    const zDomain = extent(this.legends, d => d.decade)
    this.sizeScale = scaleLinear().domain(sizeDomain).range([0.25, 2])
    this.zScale = scaleLinear().domain(zDomain).range([-50, 0])
  },
  mounted() {
    this.$refs.container.appendChild(this.renderer.domElement)
    this.renderData()

    this.renderer.render(this.scene, this.camera)
  },
  methods: {
    renderData() {
      _.each(this.legends, d => {
        const mesh = this.createMesh()

        const size = this.sizeScale(d.backlinks)
        const z = this.zScale(d.decade)
        mesh.scale.set(size * 0.5, size, size * 0.5)
        mesh.position.set(0, 0, z)

        this.scene.add(mesh)
      })
    },
    createMesh: function() {
      // create just one triangle
      const vertices = [
        -1, 1, 1, // 0: left top front
        -1, -1, 1, // 1: left bottom front
        1, -1, 1, // 2: right bottom front
        1, 1, 1, // 3: right top front
        1, -1, -1, // 4: right bottom back
        1, 1, -1, // 5: right top back
        -1, -1, -1, // 6: left bottom back
        -1, 1, -1, // 7: left top back
        0, 1, 0, // 8: top middle
        0, -1, 0, // 9: bottom middle
      ]
      const faces = [
        0, 1, 2, // front 1
        0, 2, 3, // front 2
        3, 2, 4, // right 1
        3, 4, 5, // right 2
        5, 4, 6, // back 1
        5, 6, 7, // back 2
        7, 6, 1, // left 1
        7, 1, 0, // left 2
        8, 0, 3, // top front
        8, 3, 5, // top right
        8, 5, 7, // top back
        8, 7, 0, // top left
        9, 2, 1, // bottom front
        9, 4, 2, // bottom right
        9, 6, 4, // bottom back
        9, 1, 6, // bottom left
      ]

      const geometry = new THREE.PolyhedronGeometry(vertices, faces, 1, 0)
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
      })
      return new THREE.Mesh(geometry, material)
    }
  }
}
</script>

<style>
</style>
