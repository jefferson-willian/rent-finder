const { Database } = require('./database.js');

const db = new Database();
const fs = require('fs');
const stringify = require('csv-stringify');

function initialize() {
  return Promise.all([db.connect()]);
}

function close() {
  return Promise.all([db.close()]);
}

function saveToCsv(content, filename) {
  fs.writeFile(filename, content, (err) => {});
}

const args = process.argv.slice(2);

if (args.length != 1) {
  throw "Expected exactly one argument that indicates the CSV filename output."
}

initialize()
  .then(() => db.getQueries())
  .then(queries => queries.map(query => [query.href || '', query.name || '']))
  .then(results => stringify(results,
      (err, output) => saveToCsv(output, args[0])))
  .catch(err => console.log(err))
  .finally(() => close());
