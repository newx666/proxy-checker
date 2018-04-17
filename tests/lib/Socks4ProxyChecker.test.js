'use strict';

const {expect} = require('chai');
const Socks4ProxyChecker = require('../../lib/Socks4ProxyChecker');
const conf = require('../_config/config');

const {host: proxyHost, port: proxyPort} = conf.proxies.socks4;

describe('lib/Socks4ProxyChecker', function() {
  this.timeout(conf.timeout);
  it('check', async () => {
    let checker = new Socks4ProxyChecker(proxyHost, proxyPort, {
      requestCheckUrl: conf.requestCheckerUrl,
    });
    let res = await checker.check();
    expect(res).to.be.true;
  });
});