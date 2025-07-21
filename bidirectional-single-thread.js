'use strict'

const individualTrack = require('music-routes-data/data/individual_track.json')

const startTracksBfsResults = []
const targetTracksBfsResults = []
const startIndividualsBfsResults = []
const targetIndividualsBfsResults = []

const allIndividuals = require('music-routes-data/data/individuals.json')
const allTracks = require('music-routes-data/data/tracks.json')

const id1 = process.argv[2] || 'Aretha Franklin'
const id2 = process.argv[3] || 'Carrie Brownstein'

console.time('search duration')

// The index in these arrays represent how many steps away from the start
// individual. Initialize at zero steps.
startTracksBfsResults[0] = getTracksForIndividual(id1)
startIndividualsBfsResults[0] = new Set([id1])

// The index here is how many steps away from the target individual.
targetTracksBfsResults[0] = getTracksForIndividual(id2)
targetIndividualsBfsResults[0] = new Set([id2])

// Check if the two individuals have any tracks in common.
let matches = matchFound(startTracksBfsResults, targetTracksBfsResults)

// Keep getting more individuals/tracks until there is a match.
while (!matches.length) {
  getNextBfsStepResults(startTracksBfsResults, startIndividualsBfsResults)
  matches = matchFound(startTracksBfsResults, targetTracksBfsResults)

  if (matches.length) {
    continue
  }
  getNextBfsStepResults(targetTracksBfsResults, targetIndividualsBfsResults)
  matches = matchFound(startTracksBfsResults, targetTracksBfsResults)
}

console.timeEnd('search duration')

const index1 = startTracksBfsResults.length - 1
const index2 = targetTracksBfsResults.length - 1
// Select a random track from the list of tracks that connect the two individuals
let track = sample(matches)
let fromIndividual = sample(Array.from(startIndividualsBfsResults[index1]).filter((ind) => individualTrack.some((it) => it.individual_id === ind && it.track_id === track)))
let toIndividual = sample(Array.from(targetIndividualsBfsResults[index2]).filter((ind) => individualTrack.some((it) => it.individual_id === ind && it.track_id === track)))

const origToIndividual = toIndividual

const path = [{ track, fromIndividual, toIndividual }]

for (let i = index1 - 1; i >= 0; i--) {
  track = sample(Array.from(startTracksBfsResults[i]).filter((trk) => individualTrack.some((it) => it.track_id === trk && it.individual_id === fromIndividual)))
  toIndividual = fromIndividual
  fromIndividual = sample(Array.from(startIndividualsBfsResults[i]).filter((ind) => ind._id !== toIndividual && individualTrack.some((it) => it.individual_id === ind && it.track_id === track)))
  path.unshift({ track, fromIndividual, toIndividual })
}

toIndividual = origToIndividual

for (let i = index2 - 1; i >= 0; i--) {
  track = sample(Array.from(targetTracksBfsResults[i]).filter((trk) => individualTrack.some((it) => it.track_id === trk && it.individual_id === toIndividual)))
  fromIndividual = toIndividual
  toIndividual = sample(Array.from(targetIndividualsBfsResults[i]).filter((ind) => ind._id !== fromIndividual && individualTrack.some((it) => it.individual_id === ind && it.track_id === track)))
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

function getNextBfsStepResults (tracks, individuals) {
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

function matchFound (startTracksBfsResults, targetTracksBfsResults) {
  return Array.from(startTracksBfsResults[startTracksBfsResults.length - 1]).filter(val => targetTracksBfsResults[targetTracksBfsResults.length - 1].has(val))
}
