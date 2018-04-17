'use strict';
const BaseProxyChecker = require('./BaseProxyChecker');
const ConnectProxyChecker = require('./ConnectProxyChecker');
const HttpProxyChecker = require('./HttpProxyChecker');
const Socks4ProxyChecker = require('./Socks4ProxyChecker');
const Socks5ProxyChecker = require('./Socks5ProxyChecker');

const PROXY_TYPE = {
  http: HttpProxyChecker,
  connect: ConnectProxyChecker,
  socks4: Socks4ProxyChecker,
  socks5: Socks5ProxyChecker,
};

class ProxyChecker extends BaseProxyChecker {
  constructor(host, port, options = {}) {
    options = Object.assign({
      checkProxyTypes: ['socks5', 'socks4', 'connect', 'http'], // На какие типы прокси надо проверить
    }, options);
    super(host, port, options);
    this._options = options;
    this._checkProxyTypes = options.checkProxyTypes;
  }

  async check() {
    let promises = [];
    for (let proxyType of this._checkProxyTypes) {
      let proxyChecker = new PROXY_TYPE[proxyType](this._host, this._port, this._options);
      promises.push(proxyChecker.check());
    }
    let checkResult = await Promise.all(promises);
    let resultMap = {};
    for (let idx = 0; idx < checkResult.length; idx++) {
      resultMap[this._checkProxyTypes[idx]] = checkResult[idx];
    }
    return resultMap;
  }
}

module.exports = ProxyChecker;