const playwright = require('playwright');

class Browser {
  constructor() {
    this.browser_ = null;
    this.page_ = null;
    this.engine_ = 'chromium';
  }

  launch() {
    return playwright[this.engine_].launch()
      .then(browser => this.browser_ = browser)
      .then(() => this.browser_.newContext())
      .then(context => context.newPage())
      .then(page => this.page_ = page)
      .then(() => true);
  }

  gotoAndWaitForRequest(url, request) {
    return this.page_.goto(url)
      .then(() => this.page_.waitForRequest(request))
      .then(() => this.page_.content());
  }

  close() {
    return this.browser_.close();
  }
}

exports.newBrowser = function () {
  return new Browser();
}
