'use strict';
module.exports = {
  requestCheckerUrl: 'http://request-debug.newx.online',// Сервер для проыверки запросов от прокси
  proxies: {
    http: {
      host: '127.0.0.1',
      port: 8080,
    },
    connect: {
      host: '127.0.0.1',
      port: 8080,
    },
    socks4: {
      host: '127.0.0.1',
      port: 9050,
    },
    socks5: {
      host: '127.0.0.1',
      port: 9050,
    },
  },
  timeout: 10000,
};