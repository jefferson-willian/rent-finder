const browser = require('./browser.js');
const cheerio = require('cheerio');

const URL = 'https://www.vivareal.com.br/aluguel/minas-gerais/belo-horizonte/bairros/grajau/apartamento_residencial/#ordenar-por=preco-total:DESC&preco-ate=3500&preco-desde=2000&preco-total=sim&tipos=apartamento_residencial,cobertura_residencial';

function getResults(html) {
  const $ = cheerio.load(html);
  var keepGettingResults = true;

  return $('.results-list').children().filter((i, node) => {
    keepGettingResults = keepGettingResults
      ? node.attribs['data-type'] == 'property' : false;
    return keepGettingResults;
  })
  .map((i, node) => $(node).find('.property-card__content-link').attr('href'))
  .toArray();
}

const myBrowser = browser.newBrowser();

myBrowser.launch()
  .then(() => myBrowser.gotoAndWaitForRequest(URL, /.*property\-detail\.js/))
  .then(result => myPage.content())
  .then(html => {
    console.log("Total: " + getResults(html).length);
  })
  .then(() => myBrowser.close())
  .catch(err => console.log(err));
