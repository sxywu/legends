<template>
  <div ref='container' :width='width' :height='height' />
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
    this.renderer.setClearColor('#fff', 1)

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
    const hemisphere = new THREE.HemisphereLight( colors.yellow, colors.pink, 1.0 )
    this.scene.add(hemisphere)
    const ambient = new THREE.AmbientLight( colors.pink, 1.0 )
    this.scene.add(ambient)
    const light = new THREE.DirectionalLight( colors.yellow, 0.2 )
    light.position.set( 0, 50, 0 )
    light.castShadow = true
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    //Set up shadow properties for the light
    light.shadow.mapSize.width = 512;  // default
    light.shadow.mapSize.height = 10000; // default
    light.shadow.camera.near = 0.5;       // default
    light.shadow.camera.far = 500      // default
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

        const mesh = this.createMesh(faces, color)
        mesh.scale.set(size * 0.5, size, size * 0.5)
        // mesh.scale.set(size, size, size)
        mesh.position.set(x, 0, z)
        mesh.castShadow = true

        this.scene.add(mesh)
      })
    },
    createMesh: function(numFaces, color) {
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
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000),
        new THREE.MeshStandardMaterial( {color: colors.pink, side: THREE.DoubleSide} )
      )
      // plane.rotation.x += Math.PI / 2
      plane.rotateX(-Math.PI / 2)
      plane.translateZ(-2)
      plane.receiveShadow = true
      this.scene.add( plane )

      // and add "sky"
      const sky = new THREE.Mesh(
        new THREE.SphereGeometry(60, 10, 10),
        new THREE.MeshPhysicalMaterial( {color: colors.blue, side: THREE.BackSide } )
      )
      this.scene.add( sky )
    },
  }
}
</script>

<style>
</style>
