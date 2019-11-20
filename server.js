'use strict'

const express = require('express')
const { search } = require('music-routes-search')
const escape = require('escape-html')
const app = express()
const fs = require('fs')
const path = require('path')
const { Worker } = require('worker_threads')

const individualTrack = require('music-routes-data/data/individual_track.json')
const allIndividuals = require('music-routes-data/data/individuals.json')
const allTracks = require('music-routes-data/data/tracks.json')

const indexHtml = fs.readFileSync(path.join(__dirname, 'views', '/index.html'))

app.get('/', function (req, res) {
  return res.send(indexHtml.toString())
})

app.get('/go', function (req, res) {
  if (!req.query.start || !req.query.end) {
    return res.send('Missing start or end. Please try again.')
  }

  // TODO: Put the search stuff in workers too.
  const start = searchForMusician(req.query.start)
  if (!start) {
    return res.send(`Could not find <b>${escape(req.query.start)}</b>. Sorry! The data set is limited.`)
  }

  const end = searchForMusician(req.query.end)
  if (!end) {
    return res.send(`Could not find <b>${escape(req.query.end)}</b>. Sorry! The data set is limited.`)
  }

  // TODO: Use worker pooling rather than creating two new workers for every request.
  const workers = []

  const tracks = [[], []]
  const individuals = [[], []]

  workers[0] = createWorker(start.ref, 0)
  workers[1] = createWorker(end.ref, 1)

  function createWorker (id, index) {
    const worker = new Worker('./worker.js', { workerData: { id } })
    worker.on('error', (err) => { res.end(`oh noes! ${err}`) })
    worker.on('message', callback.bind(this, index))
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
      workers[index].postMessage('next')
    }
  }

  function done () {
    workers[0].removeListener('message', callback)
    workers[1].removeListener('message', callback)
    workers[0].terminate()
    workers[1].terminate()
    printResults()
  }

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
      res.write(`${from} played on "${track}" with ${to}\n`)
    })
    res.end()
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
})

function searchForMusician (searchString) {
  const result = search(searchString, 'individual')
  return result[0]
}

const port = process.env.PORT || 8080
app.listen(port, (err) => {
  // TODO: offline right now, check that `err` is even a thing here
  if (err) {
    throw err
  }
  console.log(`Now serving at http://localhost:${port}/.`)
})
