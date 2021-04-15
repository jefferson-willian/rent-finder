const cheerio = require('cheerio');
const playwright = require('playwright');

let myBrowser = null;

playwright['chromium'].launch()
  .then(browser => {
    myBrowser = browser;
    return browser.newContext();
  })
  .then(context => context.newPage())
  .then(page => page.goto('http://whatsmyuseragent.org/'))
  .then(response => response.text())
  .then(html => {
    const $ = cheerio.load(html);
    console.log($('.ip-address').text().trim());
  })
  .catch(err => console.log(err))
  .finally(() => myBrowser.close());
