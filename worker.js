'use strict'

const { parentPort, workerData } = require('worker_threads')
const { id } = workerData

const individualTrack = require('music-routes-data/data/individual_track.json')

const tracks = []
const individuals = []

tracks[0] = getTracksForIndividual(id)
individuals[0] = new Set([id])

parentPort.postMessage({ tracks, individuals })
parentPort.on('message', (msg) => {
  if (msg === 'next') {
    getNextBfsStepResults(tracks, individuals)
    parentPort.postMessage({ tracks, individuals })
    return
  }
  throw new Error(`Unknown message: ${msg}`)
})

function getNextBfsStepResults (tracks, individuals) {
  const currTracks = tracks[tracks.length - 1]
  const currIndividuals = individuals[individuals.length - 1]
  const resultTracks = new Set(currTracks)
  const resultIndividuals = new Set(currIndividuals)
  currTracks.forEach((trackId) => {
    const individuals = getIndividualsForTrack(trackId)
    individuals.forEach((individualId) => {
      if (currIndividuals.has(individualId)) {
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
