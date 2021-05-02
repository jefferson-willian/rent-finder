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
      .catch(err => {
        console.log("Browser: " + err);
        return page.close();
      })
      .then(() => {
        if (returnResult == null) {
          throw new Error();
        }
        return returnResult;
      });

  }

  close() {
    return this.browser_.close();
  }
}

module.exports = {
  Browser
}
