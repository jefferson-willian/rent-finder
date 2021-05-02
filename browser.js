const playwright = require('playwright');

class Browser {
  constructor() {
    this.browser_ = null;
    this.engine_ = 'chromium';
  }

  launch() {
    return playwright[this.engine_].launch()
      .then(browser => this.browser_ = browser);
  }

  gotoAndWaitForRequest(url, request) {
    var page = null;
    var returnResult = null;

    return this.browser_.newPage()
      .then(p => page = p)
      .then(() => page.goto(url))
      .then(() => page.waitForRequest(request))
      .then(() => page.content())
      .then(content => Promise.all([Promise.resolve(content), page.close()]))
      .then(result => returnResult = result[0])
      .catch(err => page.close())
      .then(() => returnResult == null ? throw new Error() : returnResult);

  }

  close() {
    return this.browser_.close();
  }
}

module.exports = {
  Browser
}
