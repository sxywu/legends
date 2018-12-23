<template>
  <div id='world'>
    <div id='texts'>
      <canvas class='hidden' v-for='(d, i) in decades' :ref='`decade${i}`'
        :width='2 * textWidth' :height='2 * textHeight'
        :style='{width: `${textWidth}px`, height: `${textHeight}px`}'></canvas>
      <canvas class='hidden' v-for='(d, i) in legends' :ref='`name${i}`'
        :width='2 * textWidth' :height='2 * textHeight'
        :style='{width: `${textWidth}px`, height: `${textHeight}px`}'></canvas>
    </div>
    <div ref='container' :width='width' :height='height'></div>
  </div>
</template>

<script>
import _ from 'lodash'
import {max, extent, scaleLinear, scaleOrdinal, scaleQuantize} from 'd3'
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

const innerRadius = 30
const outerRadius = 2 * innerRadius
export default {
  name: 'world',
  props: ['legends'],
  data() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      textWidth: 820,
      textHeight: 240,
      decades: _.range(10), // hard code how many canvas to draw
    }
  },
  created() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000)
    this.renderer = new THREE.WebGLRenderer({antialias: true})

    // WebGL background color
    this.renderer.setClearColor(0xffffff, 1)

    // fog
    this.scene.fog = new THREE.FogExp2( colors.yellow, 0.0075 )

    // set renderer size
    this.renderer.setSize(this.width, this.height)

    // set camera position
    this.camera.position.set( 0, 0, innerRadius / 2 + 10 )
    this.camera.lookAt( 0, 0, -outerRadius )

    // orbital controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.maxDistance = outerRadius - 5
    this.controls.maxPolarAngle = Math.PI / 2
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.25
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
    // speed: age at award
    const facesDomain = extent(this.legends, d => d.references)
    const sizeDomain = extent(this.legends, d => d.backlinks)
    const zDomain = extent(this.legends, d => d.decade)
    const speedDomain = extent(this.legends, d => d.year - d.birthday.getFullYear())
    this.facesScale = scaleQuantize().domain(facesDomain).range(_.range(5, 12))
    this.sizeScale = scaleLinear().domain(sizeDomain).range([0.5, 2])
    this.zScale = scaleLinear().domain(zDomain).range([-innerRadius / 2, innerRadius / 2])
    this.speedScale = scaleLinear().domain(speedDomain).range([0.01, 0.005])

    this.colors = {
      "Physics": 0, "Chemistry": 0, "Physiology or Medicine": 0,
      "Peace": 1, "Literature": 1, "Economics": 1,
    }
  },
  mounted() {
    // handle window resize
    window.addEventListener('resize', this.handleWindowResize)

    this.$refs.container.appendChild(this.renderer.domElement)
    this.renderData()
    this.createBackground()

    this.animate()
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

            return {data: d, mesh: crystal, size, x, z, speed, rotation: 0}
          })
        }).flatten().value()

      // NAMES
      const cameraPosition = this.camera.getWorldPosition()
      this.names = _.map(this.crystals, (d, i) => {
        const {x, size, z} = d
        const {name, category, categoryLabel, year} = d.data
        const text = this.createText(name, categoryLabel || category, year, i)

        const obj = {mesh: text, x, z}
        this.calculateTextOpacity(obj, cameraPosition)
        text.position.set(x, size + this.textHeight / 400, z)
        this.scene.add(text)

        return obj
      })

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
        side: THREE.DoubleSide,
        uniforms: {
          colorType: {value: color},
          textureMap: {value: this.textureMap},
        },
      })

      return new THREE.Mesh(geometry, material)
    },
    createText: function(name, category, year, index) {
      const color = '#50306c'
      const canvas = this.$refs[`name${index}`][0]
      const ctx = canvas.getContext('2d')
      ctx.scale(2, 2)

      // configs
      const x = this.textWidth / 2
      const y1 = this.textHeight / 3
      const y2 = 2 * this.textHeight / 3
      const text2 = `${category}, ${year}`

      // text1
      ctx.fillStyle = color
      ctx.strokeStyle = color
      ctx.font = '56px Libre Baskerville'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(name, x, y1)
      ctx.strokeText(name, x, y1)
      ctx.font = '44px Libre Baskerville'
      ctx.fillText(text2, x, y2)
      ctx.strokeText(text2, x, y2)

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
    animate: function() {
      // requestAnimationFrame( this.animate )

      // // rotate crystals
      // _.each(this.crystals, d => {
      //   d.rotation += d.speed
      //   d.mesh.rotation.y = d.rotation
      // })
      _.each(this.stars, d => {
        d.angle += 0.0001
        this.calculateStarPosition(d.mesh, d.angle, d.radius, d.y)
      })

    	this.controls.update()
	    this.renderer.render(this.scene, this.camera)
    },
    updateCamera: function() {
      // light position
      let angle = this.controls.getAzimuthalAngle()
      const x = 350 * Math.sin(angle)
      const z = 350 * Math.cos(angle)
      this.light.position.set(x, 350, z)

      // fade text
      const cameraPosition = this.camera.getWorldPosition()
      _.each(this.names, d => {
        this.calculateTextOpacity(d, cameraPosition)
      })

      this.renderer.render(this.scene, this.camera)
    },
    calculateTextOpacity: function(d, p) {
      // calculate dist
      const dist = Math.sqrt(Math.pow(d.x - p.x, 2) + Math.pow(d.z - p.z, 2))
      // if less than 12, 100% opacity, after that fade
      const opacity = dist < 12 ? 1 : Math.max(1 - dist / (innerRadius / 2), 0)
      d.mesh.material.opacity = opacity
    },
    calculateStarPosition: function(mesh, angle, radius, y) {
      const x = radius * Math.cos(angle)
      const z = radius * Math.sin(angle)
      mesh.position.set(x, y, z)
    },
    handleWindowResize: function() {
      this.width = window.innerWidth
      this.height = window.innerHeight

      this.renderer.setSize(this.width, this.height)
      this.camera.aspect = this.width / this.height
      this.camera.updateProjectionMatarix()
    },
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
