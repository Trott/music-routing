// Use Node.js 11.7.0 or newer to avoid having to use --experimental-workers flag

'use strict'

const { Worker } = require('worker_threads')

const individualTrack = require('music-routes-data/data/individual_track.json')

const tracks = [[], []]
const individuals = [[], []]
const workers = []

const allIndividuals = require('music-routes-data/data/individuals.json')
const allTracks = require('music-routes-data/data/tracks.json')

const id0 = process.argv[2] || '12' // Rich Trott
const id1 = process.argv[3] || '8992' // Rob Fioretti

function createWorker (id, index) {
  const worker = new Worker('./worker.js', { workerData: { id, index } })
  worker.on('error', (err) => { throw err })
  worker.on('message', callback)
  return worker
}

let matches

function callback (data) {
  tracks[data.index] = data.tracks
  individuals[data.index] = data.individuals
  matches = matchFound(tracks[0], tracks[1])
  if (matches.length) {
    done()
  } else {
    workers[data.index].postMessage('next')
  }
}

function done () {
  console.timeEnd('search duration')
  workers[0].removeListener('message', callback)
  workers[1].removeListener('message', callback)
  workers[0].unref()
  workers[1].unref()
  printResults()
}

console.time('search duration')

workers[0] = createWorker(id0, 0)
workers[1] = createWorker(id1, 1)

function printResults () {
  let track = sample(matches)
  let index0 = tracks[0].length - 1
  let index1 = tracks[1].length - 1
  let fromIndividual = sample(Array.from(individuals[0][index0]).filter((ind) => individualTrack.some((it) => it.individual_id === ind && it.track_id === track)))
  let toIndividual = sample(Array.from(individuals[1][index1]).filter((ind) => individualTrack.some((it) => it.individual_id === ind && it.track_id === track)))

  const origToIndividual = toIndividual

  const path = [{ track, fromIndividual, toIndividual }]

  for (let i = index0 - 1; i >= 0; i--) {
    track = sample(Array.from(tracks[0][i]).filter((trk) => individualTrack.some((it) => it.track_id === trk && it.individual_id === fromIndividual)))
    toIndividual = fromIndividual
    fromIndividual = sample(Array.from(individuals[0][i]).filter((ind) => ind._id !== toIndividual && individualTrack.some((it) => it.individual_id === ind && it.track_id === track)))
    path.unshift({ track, fromIndividual, toIndividual })
  }

  toIndividual = origToIndividual

  for (let i = index1 - 1; i >= 0; i--) {
    track = sample(Array.from(tracks[1][i]).filter((trk) => individualTrack.some((it) => it.track_id === trk && it.individual_id === toIndividual)))
    fromIndividual = toIndividual
    toIndividual = sample(Array.from(individuals[1][i]).filter((ind) => ind._id !== fromIndividual && individualTrack.some((it) => it.individual_id === ind && it.track_id === track)))
    path.push({ track, fromIndividual, toIndividual })
  }

  // Print the list of track names and individuals
  path.forEach((node) => {
    const from = allIndividuals.find((ind) => ind._id === node.fromIndividual).names[0]
    const track = allTracks.find((trk) => trk._id === node.track).names[0]
    const to = allIndividuals.find((ind) => ind._id === node.toIndividual).names[0]
    console.log(`${from} played on "${track}" with ${to}`)
  })
}

function sample (set) {
  const arr = Array.from(set)
  return arr[Math.floor(Math.random() * arr.length)]
}

function matchFound (tracks1, tracks2) {
  if (!tracks1.length || !tracks2.length) {
    return []
  }
  return Array.from(tracks1[tracks1.length - 1]).filter(val => tracks2[tracks2.length - 1].has(val))
}
