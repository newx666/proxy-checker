'use strict';

const {expect} = require('chai');
const HttpProxyChecker = require('../../lib/HttpProxyChecker');
const conf = require('../_config/config');

const {host: proxyHost, port: proxyPort} = conf.proxies.http;

describe('lib/HttpProxyChecker', function() {
  this.timeout(conf.timeout);
  it('check', async () => {
    let checker = new HttpProxyChecker(proxyHost, proxyPort, {
      requestCheckUrl: conf.requestCheckerUrl,
    });
    let res = await checker.check();
    expect(res).to.be.true;
  });
});