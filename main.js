const { Browser } = require('./browser.js');
const { Database } = require('./database.js');
const { VivaRealScrapper } = require('./scrappers.js');

const browser = new Browser();
const scrapper = new VivaRealScrapper(browser);
const db = new Database();

function processQuery(query) {
  const rentsDbPromise = db.getRents(query.id);
  const rentsWebPromise = scrapper.extractFrom(query.href);

  // Skip sending email with results if the query is running for the first time.
  const skipEmail = query.last_update == null;

  return Promise.all([rentsDbPromise, rentsWebPromise])
    .then(results => {
      // Get current rent IDs already in database.
      const currentRentIds = results[0].map(rent => rent.id);
      // Get rents result from scrapper.
      const rentsFromWeb = results[1];
      const rentIdsFromWeb = rentsFromWeb.map(rent => rent.id);

      return {
        'existentRentIdsRefresh': currentRentIds
            .filter(id => rentIdsFromWeb.includes(id)),
        'newRents': rentsFromWeb
            .filter(rent => !currentRentIds.includes(rent.id))
      };
    })
    .then(result => skipEmail
          ? Promise.resolve(result)
          // TODO: send email.
          : Promise.resolve().then(() => result))
    .then(result => {
      const updateStateCurrentRents = result.existentRentIdsRefresh.length == 0
          ? Promise.resolve()
          : db.refreshRentState(result.existentRentIdsRefresh);

      const addNewRents = result.newRents.length == 0
          ? Promise.resolve()
          : db.addNewRents(result.newRents, query.id);

      result.newRents.forEach(rent => console.log("Adding: " + rent.href));

      return Promise.all([updateStateCurrentRents, addNewRents]);
    })
    .then(() => db.refreshQueryState(query.id))
    .catch(err => console.log(err));
}

function initialize() {
  return Promise.all([db.connect(), browser.launch()]);
}

function close() {
  return Promise.all([db.close(), browser.close()]);
}

initialize()
  // Get every rent query that should be processed.
  .then(() => db.getQueries())
  // Process each query
  .then(rows => Promise.all(rows.map((row, i) => processQuery(row))))
  .catch(err => console.log(err))
  .finally(() => close());
