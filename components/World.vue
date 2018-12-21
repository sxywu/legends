<template>
  <div id='world'>
  <div id='texts'>
    <canvas class='hidden' v-for='(d, i) in legends' :ref='`canvas${i}`'
      :width='2 * textWidth' :height='2 * textHeight'
      :style='{width: `${textWidth}px`, height: `${textHeight}px`}' />
  </div>
    <div ref='container' :width='width' :height='height'></div>
  </div>
</template>

<script>
import _ from 'lodash'
import {extent, scaleLinear, scaleOrdinal, scaleQuantize} from 'd3'
import * as THREE from 'three'
const OrbitControls = require('three-orbit-controls')(THREE)
const vertexShader = require('../assets/crystal.vert')
const fragmentShader = require('../assets/crystal.frag')
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
      textWidth: 205,
      textHeight: 50,
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
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.maxDistance = 40
    this.controls.maxPolarAngle = Math.PI / 2
    this.controls.addEventListener('change', this.updateCamera)

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
    // directional
    this.light = new THREE.DirectionalLight( colors.yellow, 0.8 )
    this.light.position.set(0, 350, 350)
    this.light.rotateOnAxis(new THREE.Vector3(0, 0, 0), -Math.PI)
    this.light.castShadow = true
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    //Set up shadow properties for the this.light
    this.light.shadow.mapSize.width = 1028  // default
    this.light.shadow.mapSize.height = 1028 // default
    this.light.shadow.camera.near = 1       // default
    this.light.shadow.camera.far = 1000     // default
    this.light.shadow.camera.left = -100
    this.light.shadow.camera.right = 100
    this.light.shadow.camera.top = 100
    this.light.shadow.camera.bottom = -100
    this.scene.add( this.light )

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
      _.each(this.legends, (d, i) => {
        const faces = this.facesScale(d.references)
        const size = this.sizeScale(d.backlinks)
        const x = this.xScale(d.year - d.decade)
        const z = this.zScale(d.decade)
        const color = this.colors[d.category]

        const crystal = this.createCrystal(faces, color)
        crystal.scale.set(size * 0.5, size, size * 0.5)
        // crystal.scale.set(size, size, size)
        crystal.position.set(x, 0, z)
        crystal.castShadow = true

        this.scene.add(crystal)

        const text = this.createText(d.name, d.categoryLabel || d.category, i)

        text.position.set(x, -size - this.textHeight / 200 - 0.1, z)
        this.scene.add(text)
      })

      const starGeometry = new THREE.SphereGeometry(0.05, 20, 20)
      const starMaterial = new THREE.MeshBasicMaterial( {
        color: colors.yellow,
        side: THREE.DoubleSide,
      })
      _.times(853, i => {
        // small white dot
        const star = new THREE.Mesh(starGeometry, starMaterial)

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
    createText: function(name, category, index) {
      const color = '#50306c'
      const canvas = this.$refs[`canvas${index}`][0]
      const ctx = canvas.getContext('2d')
      ctx.scale(2, 2)
      // ctx.fillStyle = '#ffffff'
      // ctx.fillRect(0, 0, this.textWidth, this.textHeight)
      ctx.fillStyle = color
      ctx.strokeStyle = color
      ctx.font = '14px Libre Baskerville'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(name, this.textWidth / 2, this.textHeight / 3)
      ctx.strokeText(name, this.textWidth / 2, this.textHeight / 3)
      ctx.font = '11px Libre Baskerville'
      ctx.fillText(category, this.textWidth / 2, 2 * this.textHeight / 3)
      ctx.strokeText(category, this.textWidth / 2, 2 * this.textHeight / 3)

      const texture = new THREE.Texture(canvas)

      const geometry = new THREE.PlaneGeometry(this.textWidth / 100, this.textHeight / 100, 1, 1)
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
      })
      material.map.needsUpdate = true

      return new THREE.Mesh(geometry, material)
    },
    createBackground: function() {
      // textured floor inspiration from
      // https://tympanus.net/codrops/2016/04/26/the-aviator-animating-basic-3d-scene-threejs/
      const planeSize = 100
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(planeSize, planeSize, 30, 30),
        new THREE.MeshStandardMaterial( {
          color: colors.pink,
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
      plane.translateZ(-2.5)
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
    updateCamera: function() {
      let angle = this.controls.getAzimuthalAngle()
      const x = 350 * Math.sin(angle)
      const z = 350 * Math.cos(angle)
      this.light.position.set(x, 350, z)

      this.renderer.render(this.scene, this.camera)
    }
  }
}
</script>

<style scoped>
.hidden {
  position: absolute;
  top: 0;
  left: 0;
  display: none;
}
</style>
