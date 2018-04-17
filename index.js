'use strict';

const checkHttpProxy = require('./lib/checkHttpProxy');
const checkConnectProxy = require('./lib/checkConnectProxy');
const checkSocks4Proxy = require('./lib/checkSocks4Proxy');

(async () => {
  // console.log(await checkConnectProxy('61.91.235.226', 8080));
  // console.log(await checkHttpProxy('61.91.235.226', 8080));
  console.log(await checkSocks4Proxy('61.91.235.226', 8080));
})();