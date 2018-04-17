'use strict';
const BaseProxyChecker = require('./BaseProxyChecker');
const {URL} = require('url');

class ConnectProxyChecker extends BaseProxyChecker {
  async _runCheck() {
    let parseCheckUrl = new URL(this._requestCheckUrl);
    let checkHost = parseCheckUrl.hostname;
    let checkPort = parseCheckUrl.port || 80;
    let checkPath = parseCheckUrl.pathname;
    let request = `CONNECT ${checkHost}:${checkPort} HTTP/1.0\r\n`;
    request += '\r\n';

    // подключаемся
    await this.socketConnect();

    await this.socketWrite(request);
    let rawResponse = await this.socketRead({countBytes: 35, isSocketEnd: false});
    let re = /^HTTP\/\d\.\d 200 connection established/i;
    if (!re.test(rawResponse.toString())) {
      throw new Error('Not connection established');
    }
    request = `GET ${checkPath} HTTP/1.0\r\n`;
    request += `Host: ${checkHost}\r\n`;
    request += `User-Agent: ${this._userAgent}\r\n`;
    request += '\r\n';
    await this.socketWrite(request);
    rawResponse = await this.socketRead();
    return await this._checkResponseFn(this._host, this._port, this._requestCheckUrl, rawResponse, await this.getRealIp());
  }
}

module.exports = ConnectProxyChecker;