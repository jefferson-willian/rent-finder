const cheerio = require('cheerio');
const playwright = require('playwright');
const fs = require('fs');

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

var myBrowser;

playwright['chromium'].launch()
  .then(browser => {
    myBrowser = browser;
    return browser.newContext();
  })
  .then(context => context.newPage())
  .then(page => page.goto(URL))
  .then(response => response.text())
  .then(html => {
    console.log("Total: " + getResults(html).length);
  })
  .catch(err => console.log(err))
  .finally(() => myBrowser.close());
