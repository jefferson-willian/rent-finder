const browser = require('./browser.js');
const scrappers = require('./scrappers.js');

const URL = 'https://www.vivareal.com.br/aluguel/minas-gerais/belo-horizonte/bairros/grajau/apartamento_residencial/#ordenar-por=preco-total:DESC&preco-ate=3500&preco-desde=2000&preco-total=sim&tipos=apartamento_residencial,cobertura_residencial';

const myBrowser = browser.newBrowser();
const vivarealScrapper = scrappers.newVivaRealScrapper(myBrowser);

myBrowser.launch()
  .then(() => vivarealScrapper.extractFrom(URL))
  .then(result => console.log("Result: " + result))
  .then(() => myBrowser.close())
  .catch(err => console.log(err));
