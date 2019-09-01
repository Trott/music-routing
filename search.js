'use strict'

const { search } = require('music-routes-search')

const results = search(process.argv.slice(2).join(' '), 'individual')
const data = require('music-routes-data/data/individuals.json')
results.forEach((val) => {
  const { names } = data.find((individual) => individual._id === val.ref)
  console.log(`${val.ref}: ${names.join('; ')}`)
})
