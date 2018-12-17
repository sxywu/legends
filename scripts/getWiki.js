const _ = require('lodash')
const fs = require('fs')
const wiki = require('wikijs').default

let raw = fs.readFileSync('./scripts/legends_raw.json', {encoding: 'utf8'})
raw = JSON.parse(raw)
let complete = fs.readFileSync('./assets/legends.json', {encoding: 'utf8'})
complete = JSON.parse(complete)
const toGet = _.difference(raw, complete)

// get info for each laureate:
// birth year, death year
// number of links in
// number of sources at bottom
// wikipedia url
let index = 0
function getInfo(legend) {
  console.log(toGet.length)
  
  wiki().page(legend.alternate || legend.name)
    .then(page => {
      Promise.all([
        page.backlinks(),
        page.references(),
        page.fullInfo(),
      ]).then(([backlinks, references, info]) => {
        Object.assign(legend, {
          url: page.fullurl,
          backlinks: backlinks.length,
          references: references.length,
          birthday: info.general && info.general.birthDate && info.general.birthDate.date,
          deathday: info.general && info.general.deathDate && info.general.deathDate.date,
        })
        complete.push(legend)

        console.log(`${index}: ${JSON.stringify(legend)}\n\n\n`)

        fs.writeFileSync('./assets/legends.json', JSON.stringify(complete), {encoding: 'utf8'})
        if (toGet.length) {
          index += 1
          legend = toGet.shift()
          getInfo(legend)
        }
      })
    })
}

const legend = toGet.shift()
getInfo(legend)
