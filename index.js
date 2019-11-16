'use strict'

console.log('For a super-slow single-threaded experience, try:')
console.log('\tnode bfs-single-thread.js 8876 8992\n')
console.log('For a slow single-threaded experience, try:')
console.log('\tnode bidirectional-single-thread.js 8876 8992\n')
console.log('Then, try it with worker threads:')
console.log('\tnode bidirectional-with-workers.js 8876 8992\n')
console.log('To start a web server that is more user-friendly:')
console.log('\tnpm ci && npm run start\n')
