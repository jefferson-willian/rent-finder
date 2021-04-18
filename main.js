const browser = require('./browser.js');
const { Database } = require('./database.js');
const scrappers = require('./scrappers.js');

const URL = 'https://www.vivareal.com.br/aluguel/minas-gerais/belo-horizonte/bairros/grajau/apartamento_residencial/#ordenar-por=preco-total:DESC&preco-ate=3500&preco-desde=2000&preco-total=sim&tipos=apartamento_residencial,cobertura_residencial';

const myBrowser = browser.newBrowser();
const vivarealScrapper = scrappers.newVivaRealScrapper(myBrowser);
const db = new Database();

function processQuery(queryId) {
  const rentsPromise = db.getRents(queryId);
  const updatedRentsPromise = db.getRents(queryId);

  return Promise.all([rentsPromise, updatedRentsPromise])
    .then(results => {
      const rents = results[0];
      // TODO: get results from web.
      const updatedRents = results[1];

      console.log(rents);
      console.log(updatedRents);

      return null;
    })
    // TODO: add new results to db.
    .then(() => null)
    // TODO: update current results in db.
    .then(() => null)
    // TODO: update query status in db.
    .then(() => null)
    .catch(err => console.log(err));
}

function initialize() {
  return Promise.all([db.connect(), myBrowser.launch()]);
}

function close() {
  return Promise.all([db.close(), myBrowser.close()]);
}

initialize()
  // Get every rent query that should be processed.
  .then(() => db.getQueries())
  // Process each query
  .then(rows => Promise.all(rows.map((row, i) => processQuery(row.id))))
  .catch(err => console.log(err))
  .finally(() => close());

/*
myBrowser.launch()
  .then(() => vivarealScrapper.extractFrom(URL))
  .then(result => console.log("Total results: " + result.length))
  .then(() => myBrowser.close())
  .catch(err => console.log(err));
*/
