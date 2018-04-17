'use strict';
const BaseProxyChecker = require('./BaseProxyChecker');
const DNS = require('dns');
const {URL} = require('url');
const Q = require('q');
const ipInt = require('ip-to-int');

class Socks4ProxyChecker extends BaseProxyChecker {
  async _runCheck() {
    let parseCheckUrl = new URL(this._requestCheckUrl);
    let checkHost = parseCheckUrl.hostname;
    let checkPort = parseInt(parseCheckUrl.port) || 80;
    let checkPath = parseCheckUrl.pathname;
    let [checkIp] = await Q.nfcall(DNS.lookup, checkHost);

    let request = new Buffer(9);
    request.writeInt8(0x04, 0); // Версия 4
    request.writeInt8(0x01, 1); // установка TCP/IP соединения
    request.writeUInt16BE(checkPort, 2); // Порт
    request.writeUInt32BE(ipInt(checkIp).toInt(), 4); // IP
    request.writeInt8(0x00, 8);

    await this.socketConnect();

    await this.socketWrite(request);
    let rawResponse = await this.socketRead({countBytes: 8, isSocketEnd: false});
    if (rawResponse[0] !== 0 || rawResponse[1] !== 0x5a) {
      throw new Error('Fail socks connect');
    }

    request = `GET ${checkPath} HTTP/1.0\r\n`;
    request += `Host: ${checkHost}\r\n`;
    request += `User-Agent: ${this._userAgent}\r\n`;
    request += '\r\n';
    // debugger;
    await this.socketWrite(request);
    rawResponse = await this.socketRead();
    return await this._checkResponseFn(this._host, this._port, this._requestCheckUrl, rawResponse, await this.getRealIp());
  }
}

module.exports = Socks4ProxyChecker;