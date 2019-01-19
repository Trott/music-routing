'use strict'

const { parentPort, workerData } = require('worker_threads')

const individualTrack = require('music-routes-data/data/individual_track.json')

const tracks = []
const individuals = []

const { id, index } = workerData

tracks[0] = getTracksForIndividual(id)
individuals[0] = new Set([id])

parentPort.postMessage({ tracks, individuals, index })
parentPort.on('message', (msg) => {
  if (msg === 'next') {
    getNextGeneration(tracks, individuals)
    parentPort.postMessage({ tracks, individuals, index })
    return
  }
  throw new Error(`Unknown message: ${msg}`)
})

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
