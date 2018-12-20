<template>
  <div id='world' ref='container' :width='width' :height='height' />
</template>

<script>
import _ from 'lodash'
import {extent, scaleLinear, scaleOrdinal, scaleQuantize} from 'd3'
import * as THREE from 'three'
const OrbitControls = require('three-orbit-controls')(THREE)
const vertexShader = require('../assets/shader.vert')
const fragmentShader = require('../assets/shader.frag')
import textureImage from '../assets/texture1.jpg'
const colors = {
  blue: 0x7BB2D9,
  pink: 0xFFC6D9,
  yellow: 0xFFF7AE,
  purple: 0xCFBAE1,
}

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
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000)
    this.renderer = new THREE.WebGLRenderer({antialias: true})

    // WebGL background color
    this.renderer.setClearColor(0xffffff, 1)

    // set renderer size
    this.renderer.setSize(this.width, this.height)

    // set camera position
    this.camera.position.set( 0, 0, 10 )
    this.camera.lookAt( 0, 0, 0 )

    // orbital controls
    const controls = new OrbitControls(this.camera, this.renderer.domElement)
    controls.addEventListener("change", () => this.renderer.render(this.scene, this.camera))

    // texture map, adapted from
    // https://gist.github.com/mattdesl/d74525cf21a9755383651289c799ac56
    this.textureMap = new THREE.TextureLoader().load(textureImage, texture => {
      this.renderer.render(this.scene, this.camera)
    })

    // lights
    const hemisphere = new THREE.HemisphereLight( colors.purple, colors.yellow, 1.0 )
    this.scene.add(hemisphere)
    const ambient = new THREE.AmbientLight( colors.pink, 0.75 )
    this.scene.add(ambient)
    const light = new THREE.DirectionalLight( colors.yellow, 0.9 )
    light.position.set(0, 350, 350)
    light.castShadow = true
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    //Set up shadow properties for the light
    light.shadow.mapSize.width = 2048;  // default
    light.shadow.mapSize.height = 2048; // default
    light.shadow.camera.near = 1       // default
    light.shadow.camera.far = 1000     // default
    light.shadow.camera.left = -400
    light.shadow.camera.right = 400
    light.shadow.camera.top = 400
    light.shadow.camera.bottom = -400
    this.scene.add( light )

    // create scales:
    // faces: number of sources
    // z-index: decade of award
    // size: backlinks
    const facesDomain = extent(this.legends, d => d.references)
    const sizeDomain = extent(this.legends, d => d.backlinks)
    const zDomain = extent(this.legends, d => d.decade)
    this.facesScale = scaleQuantize().domain(facesDomain).range(_.range(4, 7))
    this.sizeScale = scaleLinear().domain(sizeDomain).range([0.5, 2])
    this.xScale = scaleLinear().domain([0, 9]).range([-5, 5])
    this.zScale = scaleLinear().domain(zDomain).range([-50, 0])

    this.colors = {
      "Physics": 0, "Chemistry": 0, "Physiology or Medicine": 0,
      "Peace": 1, "Literature": 1, "Economics": 1,
    }
  },
  mounted() {
    this.$refs.container.appendChild(this.renderer.domElement)
    this.renderData()
    this.createBackground()

    this.renderer.render(this.scene, this.camera)
  },
  methods: {
    renderData() {
      _.each(this.legends, d => {
        const faces = this.facesScale(d.references)
        const size = this.sizeScale(d.backlinks)
        const x = this.xScale(d.year - d.decade)
        const z = this.zScale(d.decade)
        const color = this.colors[d.category]

        const mesh = this.createCrystal(faces, color)
        mesh.scale.set(size * 0.5, size, size * 0.5)
        // mesh.scale.set(size, size, size)
        mesh.position.set(x, 0, z)
        mesh.castShadow = true

        this.scene.add(mesh)
      })

      _.times(853, i => {
        // small white dot
        const star = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 5, 5),
          new THREE.MeshBasicMaterial( {
            color: colors.yellow,
            side: THREE.DoubleSide,
          } )
        )

        star.position.set(_.random(-20, 20), _.random(0, 10), _.random(-50, 50))
        this.scene.add( star )
      })
    },
    createCrystal: function(numFaces, color) {
      const geometry = new THREE.SphereGeometry( 1, numFaces, 4 )
      // jitter vertices
      _.each(geometry.vertices, v => {
        v.x += _.random(-0.1, 0.1)
        v.y += _.random(-0.1, 0.1)
        v.z += _.random(-0.1, 0.1)
      })
      geometry.computeFlatVertexNormals()

      const material = new THREE.ShaderMaterial({
        flatShading: true,
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        uniforms: {
          colorType: {value: color},
          textureMap: {value: this.textureMap},
        },
      })

      return new THREE.Mesh(geometry, material)
    },
    createBackground: function() {
      // textured floor inspiration from
      // https://tympanus.net/codrops/2016/04/26/the-aviator-animating-basic-3d-scene-threejs/
      const planeSize = 200
      const plane = new THREE.Mesh(
        new THREE.CylinderGeometry(planeSize, planeSize, 150, planeSize, 40),
        new THREE.MeshStandardMaterial( {
          color: colors.pink,
      		transparent:true,
      		opacity: 1.0,
          side: THREE.DoubleSide,
      		shading:THREE.FlatShading,
        } )
      )
      _.each(plane.geometry.vertices, v => {
        v.x += _.random(-0.5, 0.5)
        v.y += _.random(-0.5, 0.5)
        v.z += _.random(-0.5, 0.5)
      })
      plane.receiveShadow = true
      plane.rotateX(-Math.PI / 2)
      plane.rotateZ(-Math.PI / 2)
      plane.translateZ(-planeSize - 2)
      this.scene.add( plane )

      // and add "sky"
      const sky = new THREE.Mesh(
        new THREE.SphereGeometry(60, 20, 20),
        new THREE.MeshStandardMaterial( {
          color: colors.pink,
          side: THREE.BackSide,
        } )
      )
      this.scene.add( sky )
    },
  }
}
</script>

<style>
</style>
