const browser = require('./browser.js');
const database = require('./database.js');
const scrappers = require('./scrappers.js');

const URL = 'https://www.vivareal.com.br/aluguel/minas-gerais/belo-horizonte/bairros/grajau/apartamento_residencial/#ordenar-por=preco-total:DESC&preco-ate=3500&preco-desde=2000&preco-total=sim&tipos=apartamento_residencial,cobertura_residencial';

const myBrowser = browser.newBrowser();
const vivarealScrapper = scrappers.newVivaRealScrapper(myBrowser);
const db = database.newDatabase();

db.connect()
  .then(() => db.getQueries())
  .then(res => {
    res.forEach((row, i) => {
      console.log(row.href);
    });
    return null;
  })
  .then(() => db.close())
  .then(() => console.log("Closed!"))
  .catch(err => console.log(err));

/*
myBrowser.launch()
  .then(() => vivarealScrapper.extractFrom(URL))
  .then(result => console.log("Total results: " + result.length))
  .then(() => myBrowser.close())
  .catch(err => console.log(err));
*/
