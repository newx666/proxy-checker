'use strict';
const BaseProxyChecker = require('./BaseProxyChecker');
const DNS = require('dns');
const {URL} = require('url');
const Q = require('q');
const ipInt = require('ip-to-int');

class Socks5ProxyChecker extends BaseProxyChecker {
  async _runCheck() {
    let parseCheckUrl = new URL(this._requestCheckUrl);
    let checkHost = parseCheckUrl.hostname;
    let checkPort = parseInt(parseCheckUrl.port) || 80;
    let checkPath = parseCheckUrl.pathname;
    let [checkIp] = await Q.nfcall(DNS.lookup, checkHost);

    let request = new Buffer(3);
    request.writeInt8(0x05, 0); // Версия 5
    request.writeInt8(0x01, 1); // Количество поддерживаемых методов аутентификации
    request.writeInt8(0x00, 2); // Аутентификация не требуется

    await this.socketConnect();

    await this.socketWrite(request);
    let rawResponse = await this.socketRead({countBytes: 2, isSocketEnd: false});
    if (rawResponse[0] !== 0x05 || rawResponse[1] !== 0x00) {
      throw new Error('Fail socks auth method');
    }

    request = new Buffer(10);
    request.writeInt8(0x05, 0); // Версия 5
    request.writeInt8(0x01, 1); // установка TCP/IP соединения
    request.writeInt8(0x00, 2); // зарезервировано
    request.writeInt8(0x01, 3); // IPv4 адрес
    request.writeUInt32BE(ipInt(checkIp).toInt(), 4); // IP
    request.writeUInt16BE(checkPort, 8); // Порт

    await this.socketWrite(request);
    rawResponse = await this.socketRead({countBytes: 10, isSocketEnd: false});
    if (rawResponse[0] !== 0x05 || rawResponse[1] !== 0x00) {
      throw new Error('Fail socks connect');
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

module.exports = Socks5ProxyChecker;