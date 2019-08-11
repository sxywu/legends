<template>
  <div id='world'>
    <div id='texts'>
      <canvas class='hidden' v-for='(d, i) in decades' :ref='`decade${i}`'
        :width='2 * textWidth' :height='2 * textHeight'
        :style='{width: `${textWidth}px`, height: `${textHeight}px`}'></canvas>
    </div>
    <div ref='container' :width='width' :height='height'></div>
  </div>
</template>

<script>
import _ from 'lodash'
import {max, extent, scaleLinear, scaleOrdinal, scaleQuantize, timer} from 'd3'
import * as THREE from 'three'
const vertexShader = require('../assets/crystal.vert')
const fragmentShader = require('../assets/crystal.frag')
import textureImage from '../assets/texture1.jpg'
const colors = {
  blue: 0x7BB2D9,
  pink: 0xFFC6D9,
  yellow: 0xFFF7AE,
  purple: 0xCFBAE1,
}

const innerRadius = 30
const outerRadius = 2 * innerRadius

export default {
  name: 'world',
  props: ['legends'],
  data() {
    return {
      width: 1050,
      height: 1500,
      textWidth: 820,
      textHeight: 420,
      decades: _.range(10), // hard code how many canvas to draw
    }
  },
  created() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000)
    this.renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true })

    // WebGL background color
    this.renderer.setClearColor(0xffffff, 1)

    // fog
    this.scene.fog = new THREE.FogExp2( colors.yellow, 0.01 )

    // set renderer size
    this.renderer.setSize(this.width, this.height)

    // texture map, adapted from
    // https://gist.github.com/mattdesl/d74525cf21a9755383651289c799ac56
    this.textureMap = new THREE.TextureLoader().load(textureImage, texture => {
      this.moveCamera(0)
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
    // speed: age at award
    const facesDomain = extent(this.legends, d => d.references)
    const sizeDomain = extent(this.legends, d => d.backlinks)
    const zDomain = extent(this.legends, d => d.decade)
    const speedDomain = extent(this.legends, d => d.year - d.birthday.getFullYear())
    this.facesScale = scaleQuantize().domain(facesDomain).range(_.range(5, 12))
    this.sizeScale = scaleLinear().domain(sizeDomain).range([0.5, 2])
    this.zScale = scaleLinear().domain(zDomain).range([-innerRadius / 2, innerRadius / 2])
    this.speedScale = scaleLinear().domain(speedDomain).range([1000, 2000])

    this.colors = {
      "Physics": 0, "Chemistry": 0, "Physiology or Medicine": 0,
      "Peace": 1, "Literature": 1, "Economics": 1,
    }
  },
  mounted() {
    this.$refs.container.appendChild(this.renderer.domElement)
    this.renderData()
    this.createBackground()
  },
  methods: {
    renderData() {
      this.decades = _.chain(this.legends)
        .countBy(d => d.decade)
        .map((count, decade) => {
          return {count, decade: +decade}
        }).value()

      // CRYSTALS
      const perWidth = innerRadius / (max(this.decades, d => d.count))
      this.crystals = _.chain(this.legends)
        .groupBy(d => d.decade)
        .map(data => {
          const offset = data.length * perWidth / 2
          const z = this.zScale(data[0].decade)

          const decade = _.find(this.decades, d => data[0].decade === d.decade)
          Object.assign(decade, {x: offset, z})

          return _.map(data, (d, i) => {
            const faces = this.facesScale(d.references)
            const size = this.sizeScale(d.backlinks)
            const x = (i + 0.5) * perWidth - offset + _.random(-0.25, 0.25)
            const color = this.colors[d.category]
            const speed = this.speedScale(d.year - d.birthday.getFullYear())

            const crystal = this.createCrystal(faces, color)
            crystal.scale.set(size * 0.5, size, size * 0.5)
            // crystal.scale.set(size, size, size)
            crystal.position.set(x, 0, z)
            crystal.castShadow = true

            this.scene.add(crystal)

            return {data: d, mesh: crystal, size, x, z, speed}
          })
        }).flatten().value()

      // DECADES
      _.each(this.decades, (d, i) => {
        const {decade, x, z} = d
        const text = this.createDecade(decade, i)
        text.position.set(-x - 1, 0, z)
        text.rotateX(-Math.PI / 2)

        this.scene.add(text)
      })

      // STARS
      const starGeometry = new THREE.SphereGeometry(0.05, 20, 20)
      const starMaterial = new THREE.MeshBasicMaterial( {
        color: colors.yellow,
        side: THREE.DoubleSide,
      })
      this.stars = _.times(853, i => {
        // small white dot
        const star = new THREE.Mesh(starGeometry, starMaterial)
        const angle = _.random(0, 2 * Math.PI)
        const radius = _.random(outerRadius / 10, outerRadius / 2)
        const y = _.random(-1, outerRadius / 2)
        this.calculateStarPosition(star, angle, radius, y)
        this.scene.add( star )

        return {mesh: star, angle, radius, y}
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
        uniforms: {
          colorType: {value: color},
          textureMap: {value: this.textureMap},
        },
      })

      return new THREE.Mesh(geometry, material)
    },
    createDecade: function(decade, index) {
      const color = '#50306c'
      const canvas = this.$refs[`decade${index}`][0]
      const ctx = canvas.getContext('2d')
      ctx.scale(2, 2)

      // configs
      const x = this.textWidth / 2
      const y = this.textHeight / 2

      // text1
      ctx.fillStyle = color
      ctx.strokeStyle = color
      ctx.font = '200px Libre Baskerville'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(decade, x, y)
      ctx.strokeText(decade, x, y)

      const texture = new THREE.Texture(canvas)

      const geometry = new THREE.PlaneGeometry(this.textWidth / 400, this.textHeight / 400, 1, 1)
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
      const planeSize = 2 * outerRadius
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(planeSize, planeSize, planeSize / 3, planeSize / 3),
        new THREE.MeshStandardMaterial( {
          color: colors.pink,
          side: THREE.DoubleSide,
      		flatShading: true,
          roughness: 1.0,
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
        new THREE.SphereGeometry(outerRadius / 2 + 10, 20, 20),
        new THREE.MeshStandardMaterial( {
          color: colors.pink,
          side: THREE.BackSide,
        } )
      )
      this.scene.add( sky )
    },
    calculateStarPosition: function(mesh, angle, radius, y) {
      const x = radius * Math.cos(angle)
      const z = radius * Math.sin(angle)
      mesh.position.set(x, y, z)
    },
    moveCamera(index) {
      const x1 = 0
      const y1 = 0
      const z1 = innerRadius / 2 + 30
      const x2 = -22
      const y2 = 15
      const z2 = innerRadius / 2 + 15
      const lookAt1 = 5
      const lookAt2 = 0
      setTimeout(() => {
        // move camera
        const progress = (index / 9)
        const x = (x2 - x1) * progress + x1
        const y = (y2 - y1) * progress + y1
        const z = (z2 - z1) * progress + z1
        const lookAt = (lookAt2 - lookAt1) * progress + lookAt1
        this.camera.position.set( x, y, z )
        this.camera.lookAt( 0, lookAt, 0 )
        this.renderer.render(this.scene, this.camera)

        // take screenshot
        window.open( this.renderer.domElement.toDataURL( 'image/png' ), index )

        index += 1
        if (index < 10) this.moveCamera(index)
      }, 150)
    },
  }
}
</script>

<style scoped>
.hidden {
  position: absolute;
  top: 0;
  left: 0;
  /* border: 1px solid; */
  display: none;
}
</style>
