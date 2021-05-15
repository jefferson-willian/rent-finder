const { Database } = require('./database.js');
const { promises: { readFile } } = require('fs');

const db = new Database();
const csv = require('neat-csv')
const md5 = require('md5');

function getMd5(str) {
  const md5NoDash = md5(str);
  return md5NoDash.substring(0, 8) + "-" + md5NoDash.substring(8, 12) + "-" + md5NoDash.substring(12, 16) + "-" + md5NoDash.substring(16, 20) + "-" + md5NoDash.substring(20, 32);
}

const parseCsv = async (filename) => {
  const records = []
  const parser = fs.createReadStream(filename).pipe(csv(['href', 'name']));
  parser.on('readable', function() {
    var record;
    while (record = parser.read()) {
      records.push(record);
    }
  });
  await finished(parser);
  return records;
}

function initialize() {
  return Promise.all([db.connect()]);
}

function close() {
  return Promise.all([db.close()]);
}

function saveToCsv(content, filename) {
  fs.writeFile(filename, content, (err) => {});
}

function getEntriesFromCsv(filename) {
  return readFile(filename)
    .then(content => csv(content, ['href', 'name']))
    .then(entries => entries.map(entry => {
      entry['id'] = getMd5(entry.name);
      return entry;
    }));
}

const args = process.argv.slice(2);

if (args.length != 1) {
  throw "Expected exactly one argument that indicates the CSV filename output."
}

initialize()
  .then(() => Promise.all([db.getQueries(), getEntriesFromCsv(args[0])]))
  .then(result => {
    const queries = result[0];
    const entries = result[1];

    const queryIds = queries.map(query => query.id);
    const entryIds = entries.map(entry => entry.id);

    return {
      'new': entries.filter(entry => !queryIds.includes(entry.id)),
      // TODO
      'update': entries.filter(entry => queryIds.includes(entry.id)),
      'delete': queryIds.filter(id => !entryIds.includes(id))
    }
  })
  .then(opt => {
    console.log(opt);

    return Promise.all([
      opt.new.length == 0 ? Promise.resolve() : db.addQueries(opt.new),
      opt.update.length == 0 ? Promise.resolve() : Promise.resolve(),
      opt.delete.length == 0 ? Promise.resolve() : db.deleteQueries(opt.delete)
    ]);
  })
  .catch(err => console.log(err))
  .finally(() => close());
