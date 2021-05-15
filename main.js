const { Browser } = require('./browser.js');
const { Database } = require('./database.js');
const { EmailSender } = require('./email-sender.js');
const { VivaRealScrapper } = require('./scrappers.js');

const PromisePool = require('es6-promise-pool')

const browser = new Browser();
const scrapper = new VivaRealScrapper(browser);
const db = new Database();
const email = new EmailSender();

function processQuery(query, searchName) {
  const rentsDbPromise = db.getRents(query.id);
  const rentsWebPromise = scrapper.extractFrom(query.href);

  // Skip sending email with results if the query is running for the first time.
  const skipEmail = query.last_update == null;

  // Hold the links for every new rent found.
  var newRentsHref = [];

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
    .then(result => {
      const updateStateCurrentRents = result.existentRentIdsRefresh.length == 0
          ? Promise.resolve()
          : db.refreshRentState(result.existentRentIdsRefresh);

      const addNewRents = result.newRents.length == 0
          ? Promise.resolve()
          : db.addNewRents(result.newRents, query.id);

      newRentsHref = result.newRents.map(rent => rent.href);

      return Promise.all([updateStateCurrentRents, addNewRents]);
    })
    .then(() => db.refreshQueryState(query.id))
    .then(() => {
      return {
        'searchName': searchName,
        'skipEmail': skipEmail,
        'newRents': newRentsHref
      };
    })
    .catch(err => console.log("Failed to fetch '" + searchName + "'"));
}

function initialize() {
  return Promise.all([db.connect(), browser.launch()]);
}

function close() {
  return Promise.all([db.close(), browser.close()]);
}

var searches_ = {};
var results_ = [];
var startTimestamp = new Date().getTime();

initialize()
  // Get searches data
  .then(() => db.getSearches())
  .then(searchResults => {
    for (var i = 0; i < searchResults.length; ++i) {
      searches_[searchResults.id] = searchResults.name;
    }
  })
  // Get every rent query that should be processed.
  .then(() => db.getQueries())
  // Process each query
  .then(rows => {
    const generatePromises = function * () {
      for (let i = 0; i < rows.length; i++) {
        yield processQuery(rows[i], searches_[rows[i].search_id]).then(result => results_.push(result));
      }
    }
    return new PromisePool(generatePromises(), 1).start();
  })
  .then(() => {
    var emailResults = [];
    results_.forEach((result) => {
      if (result != undefined && result != null && result.newRents.length > 0) {
        console.log("Found " + result.newRents.length + " new rents for " + result.searchName);
        if (result.skipEmail) {
          console.log("Skip sending e-mail updates.");
        } else {
          emailResults.push(result);
        }
      }
    });

    console.log("Sending " + emailResults.length + " over e-mail.");

    return emailResults.length > 0 ? email.sendEmailResults(emailResults) : Promise.resolve();
  })
  .catch(err => console.log(err))
  .finally(() => close().then(() => {
    console.log("Execution time: " + (new Date().getTime() - startTimestamp) / 1000. + " seconds");
  }));
