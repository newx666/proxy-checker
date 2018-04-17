'use strict';

const {expect} = require('chai');
const ProxyChecker = require('../../lib/ProxyChecker');
const conf = require('../_config/config');

describe('lib/ProxyChecker', function() {
  this.timeout(conf.timeout * 16);
  it('check', async () => {

    let checker = new ProxyChecker(conf.proxies.http.host, conf.proxies.http.port, {
      requestCheckUrl: conf.requestCheckerUrl,
    });
    let res = await checker.check();
    expect(res.socks4).to.be.a('boolean');
    expect(res.http).to.be.a('boolean');
    expect(res.connect).to.be.a('boolean');
    expect(res.socks5).to.be.a('boolean');
    expect(res.http).to.be.true;

    checker = new ProxyChecker(conf.proxies.connect.host, conf.proxies.connect.port, {
      requestCheckUrl: conf.requestCheckerUrl,
    });
    res = await checker.check();
    expect(res.connect).to.be.true;

    checker = new ProxyChecker(conf.proxies.socks4.host, conf.proxies.socks4.port, {
      requestCheckUrl: conf.requestCheckerUrl,
    });
    res = await checker.check();
    expect(res.socks4).to.be.true;

    checker = new ProxyChecker(conf.proxies.socks5.host, conf.proxies.socks5.port, {
      requestCheckUrl: conf.requestCheckerUrl,
    });
    res = await checker.check();
    expect(res.socks5).to.be.true;

  });
});