const cheerio = require('cheerio');
const md5 = require('md5');

function getMd5(str) {
  const md5NoDash = md5(str);
  return md5NoDash.substring(0, 8) + "-" + md5NoDash.substring(8, 12) + "-" + md5NoDash.substring(12, 16) + "-" + md5NoDash.substring(16, 20) + "-" + md5NoDash.substring(20, 32);
}

class VivaRealScrapper {
  constructor(browser) {
    this.domain_ = 'https://www.vivareal.com.br';
    this.browser_ = browser;
  }

  extractFrom(url) {
    return this.browser_.gotoAndWaitForRequest(url, /.*latest\.json/)
      .then(html => this.getResults_(html));
  }

  getResults_(html) {
    const $ = cheerio.load(html);
    var keepGettingResults = true;

    return $('.results-list').children().filter((i, node) => {
      const dataType = node.attribs['data-type'];
      if (dataType == null || (dataType != 'property' && dataType != 'nearby')) {
        return false;
      }
      keepGettingResults = keepGettingResults
        ? dataType != 'nearby' : false;
      return keepGettingResults;
    })
    .map((i, node) => {
      const href = this.domain_ + $(node).find('.property-card__content-link').attr('href');
      return {
        'href': href,
        'id': getMd5(href)
      };
    })
    .toArray();
  }
}

module.exports = {
  VivaRealScrapper
}
