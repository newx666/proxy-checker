'use strict';
const BaseProxyChecker = require('./BaseProxyChecker');
const {URL} = require('url');

class HttpProxyChecker extends BaseProxyChecker {
  async _runCheck() {
    let parseCheckUrl = new URL(this._requestCheckUrl);
    let request = `GET ${this._requestCheckUrl} HTTP/1.0\r\n`;
    request += `Host: ${parseCheckUrl}\r\n`;
    request += `User-Agent: ${this._userAgent}\r\n`;
    request += '\r\n';

    // подключаемся
    await this.socketConnect();

    await this.socketWrite(request);
    let rawResponse = await this.socketRead();
    return await this._checkResponseFn(this._host, this._port, this._requestCheckUrl, rawResponse, await this.getRealIp());
  }
}

module.exports = HttpProxyChecker;