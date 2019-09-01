'use strict'

const individualTrack = require('music-routes-data/data/individual_track.json')

const tracks1 = []
const tracks2 = []
const individuals1 = []
const individuals2 = []

const allIndividuals = require('music-routes-data/data/individuals.json')
const allTracks = require('music-routes-data/data/tracks.json')

const id1 = process.argv[2] || '27' // Carrie Brownstein
const id2 = process.argv[3] || '40' // Michael Jackson

console.time('search duration')

tracks1[0] = getTracksForIndividual(id1)
individuals1[0] = new Set([id1])

tracks2[0] = getTracksForIndividual(id2)
individuals2[0] = new Set([id2])

let matches = matchFound(tracks1, tracks2)

while (!matches.length) {
  getNextGeneration(tracks1, individuals1)
  matches = matchFound(tracks1, tracks2)
  if (matches.length) {
    continue
  }
  getNextGeneration(tracks2, individuals2)
  matches = matchFound(tracks1, tracks2)
}

console.timeEnd('search duration')

let index1 = tracks1.length - 1
let index2 = tracks2.length - 1
// Select a random track from the list of tracks that connect the two individuals
let track = sample(matches)
let fromIndividual = sample(Array.from(individuals1[index1]).filter((ind) => individualTrack.some((it) => it.individual_id === ind && it.track_id === track)))
let toIndividual = sample(Array.from(individuals2[index2]).filter((ind) => individualTrack.some((it) => it.individual_id === ind && it.track_id === track)))

const origToIndividual = toIndividual

const path = [{ track, fromIndividual, toIndividual }]

for (let i = index1 - 1; i >= 0; i--) {
  track = sample(Array.from(tracks1[i]).filter((trk) => individualTrack.some((it) => it.track_id === trk && it.individual_id === fromIndividual)))
  toIndividual = fromIndividual
  fromIndividual = sample(Array.from(individuals1[i]).filter((ind) => ind._id !== toIndividual && individualTrack.some((it) => it.individual_id === ind && it.track_id === track)))
  path.unshift({ track, fromIndividual, toIndividual })
}

toIndividual = origToIndividual

for (let i = index2 - 1; i >= 0; i--) {
  track = sample(Array.from(tracks2[i]).filter((trk) => individualTrack.some((it) => it.track_id === trk && it.individual_id === toIndividual)))
  fromIndividual = toIndividual
  toIndividual = sample(Array.from(individuals2[i]).filter((ind) => ind._id !== fromIndividual && individualTrack.some((it) => it.individual_id === ind && it.track_id === track)))
  path.push({ track, fromIndividual, toIndividual })
}

// Print the list of track names and individuals
path.forEach((node) => {
  const from = allIndividuals.find((ind) => ind._id === node.fromIndividual).names[0]
  const track = allTracks.find((trk) => trk._id === node.track).names[0]
  const to = allIndividuals.find((ind) => ind._id === node.toIndividual).names[0]
  console.log(`${from} played on "${track}" with ${to}`)
})

function sample (set) {
  const arr = Array.from(set)
  return arr[Math.floor(Math.random() * arr.length)]
}

function getNextGeneration (tracks, individuals) {
  const currGenTracks = tracks[tracks.length - 1]
  const currGenIndividuals = individuals[individuals.length - 1]
  const resultTracks = new Set(currGenTracks)
  const resultIndividuals = new Set(currGenIndividuals)
  currGenTracks.forEach((trackId) => {
    const individuals = getIndividualsForTrack(trackId)
    individuals.forEach((individualId) => {
      if (currGenIndividuals.has(individualId)) {
        return
      }
      resultIndividuals.add(individualId)
      getTracksForIndividual(individualId).forEach((val) => resultTracks.add(val))
    })
  })
  tracks.push(resultTracks)
  individuals.push(resultIndividuals)
}

function getTracksForIndividual (individualId) {
  return new Set(individualTrack.filter((val) => val.individual_id === individualId).map((val) => val.track_id))
}

function getIndividualsForTrack (trackId) {
  return new Set(individualTrack.filter((val) => val.track_id === trackId).map((val) => val.individual_id))
}

function matchFound (tracks1, tracks2) {
  return Array.from(tracks1[tracks1.length - 1]).filter(val => tracks2[tracks2.length - 1].has(val))
}
