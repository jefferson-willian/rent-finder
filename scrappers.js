const cheerio = require('cheerio');
const md5 = require('md5');
const parse = require('url-parse');

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
    return this.extractFrom_(url, /* totalRequests */ 0);
  }

  extractFrom_(url, totalRequests) {
    // Maximum pagination.
    if (totalRequests == 10) {
      return Promise.resolve([]);
    }
    return this.browser_.gotoAndWaitForRequest(url, /.*latest\.json/)
      .then(html => this.getResults_(url, html, totalRequests));
  }

  getNextPage_(url) {
    var parsed = parse(url, true);
    var query = parsed.query;
    query.pagina = (parseInt(query.pagina) || 1) + 1;
    parsed.set('query', query);

    return parsed.href;
  }

  getCurrentPage_(url) {
    return parse(url, true).query.pagina || 0;
  }

  getResults_(url, html, totalRequests) {
    const $ = cheerio.load(html);

    var maxPage = 0;
    $('.js-change-page').each(function() {
      maxPage = Math.max(maxPage, parseInt($(this).attr('data-page')) || 0);
    });

    var keepGettingResults = true;
    const results = $('.results-list').children().filter((i, node) => {
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

    if (results.length == 0 || keepGettingResults == false || this.getCurrentPage_(url) >= maxPage) {
      return results;
    }

    return this.extractFrom_(this.getNextPage_(url), totalRequests + 1)
      .then(nextResults => results.concat(nextResults));
  }
}

module.exports = {
  VivaRealScrapper
}
