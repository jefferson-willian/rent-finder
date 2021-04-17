const cheerio = require('cheerio');


class VivaRealScrapper {
  constructor(browser) {
    this.browser_ = browser;
  }

  extractFrom(url) {
    return this.browser_.gotoAndWaitForRequest(url, /.*property\-detail\.js/)
      .then(html => this.getResults_(html));
  }

  getResults_(html) {
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
}

exports.newVivaRealScrapper = function (browser) {
  return new VivaRealScrapper(browser);
}
