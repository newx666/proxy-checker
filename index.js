'use strict';
const BaseProxyChecker = require('./lib/BaseProxyChecker');
const ConnectProxyChecker = require('./lib/ConnectProxyChecker');
const HttpProxyChecker = require('./lib/HttpProxyChecker');
const Socks4ProxyChecker = require('./lib/Socks4ProxyChecker');
const Socks5ProxyChecker = require('./lib/Socks5ProxyChecker');
const ProxyChecker = require('./lib/ProxyChecker');

module.exports = {
  BaseProxyChecker,
  ConnectProxyChecker,
  HttpProxyChecker,
  Socks4ProxyChecker,
  Socks5ProxyChecker,
  ProxyChecker,
};