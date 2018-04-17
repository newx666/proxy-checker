'use strict';

const {expect} = require('chai');
const ConnectProxyChecker = require('../../lib/ConnectProxyChecker');
const conf = require('../_config/config');

const {host: proxyHost, port: proxyPort} = conf.proxies.connect;

describe('lib/ConnectProxyChecker', function() {
  this.timeout(conf.timeout);
  it('check', async () => {
    let checker = new ConnectProxyChecker(proxyHost, proxyPort, {
      requestCheckUrl: conf.requestCheckerUrl,
    });
    let res = await checker.check();
    expect(res).to.be.true;
  });
});