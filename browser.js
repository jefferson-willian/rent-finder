const playwright = require('playwright');

class Browser {
  constructor() {
    this.browser_ = null;
    this.context_ = null;
    this.engine_ = 'chromium';
  }

  launch() {
    return playwright[this.engine_].launch()
      .then(browser => this.browser_ = browser)
      .then(() => this.browser_.newContext())
      .then(context => this.context_ = context);
  }

  gotoAndWaitForRequest(url, request) {
    var page = null;

    return this.context_.newPage()
      .then(p => page = p)
      .then(() => page.goto(url))
      .then(() => page.waitForRequest(request))
      .then(() => page.content())
      .then(content => Promise.all([Promise.resolve(content), page.close()]))
      .then(result => result[0]);
  }

  close() {
    return this.browser_.close();
  }
}

module.exports = {
  Browser
}
