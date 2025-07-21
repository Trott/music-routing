// Use Node.js 11.7.0 or newer to avoid having to use --experimental-workers flag

'use strict'

const { Worker } = require('worker_threads')

const individualTrack = require('music-routes-data/data/individual_track.json')

const tracks = [[], []]
const individuals = [[], []]

const allIndividuals = require('music-routes-data/data/individuals.json')
const allTracks = require('music-routes-data/data/tracks.json')

const startId = process.argv[2] || 'Aretha Franklin'
const targetId = process.argv[3] || 'Carrie Brownstein'

function createWorker (id, index) {
  const worker = new Worker('./worker.js', { workerData: { id } })
  worker.on('error', (err) => { throw err })
  worker.on('message', callback.bind(worker, index))
  return worker
}

let matches

function callback (index, data) {
  tracks[index] = data.tracks
  individuals[index] = data.individuals
  matches = matchFound(tracks[0], tracks[1])
  if (matches.length) {
    done()
  } else {
    this.postMessage('next')
  }
}

function done () {
  console.timeEnd('search duration')
  workerForStart.removeListener('message', callback)
  workerForTarget.removeListener('message', callback)
  workerForStart.terminate()
  workerForTarget.terminate()
  printResults()
}

console.time('search duration')

const workerForStart = createWorker(startId, 0)
const workerForTarget = createWorker(targetId, 1)

function printResults () {
  let track = sample(matches)
  const index0 = tracks[0].length - 1
  const index1 = tracks[1].length - 1
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
