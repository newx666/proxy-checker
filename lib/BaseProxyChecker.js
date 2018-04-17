'use strict';
const {URL} = require('url');
const {Socket} = require('net');
const http = require('http');

/**
 * Базовый класс для облегчения работы с проверкой прокси
 */
class BaseProxyChecker {

  /**
   * BaseProxyChecker
   * @param host
   * @param port
   * @param options
   */
  constructor(host, port, options) {
    options = Object.assign({
      requestCheckUrl: 'http://request-debug.newx.online/ip',
      checkResponse: this.constructor._defaultCheckResponse,
      timeout: 10000,
      userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0',
      isDebug: false,
      realIp: null,
    }, options);
    this._host = host;
    this._port = port;
    this._checkResponseFn = options.checkResponse;
    this._requestCheckUrl = options.requestCheckUrl;
    this._timeout = options.timeout;
    this._userAgent = options.userAgent;
    this._isDebug = !!options.isDebug;
    this._realIp = options.realIp;

    this._timerId = null;

    this._socket = null;
  }

  _log(level, data) {
    if (this._isDebug) {
      console[level](data);
    }
  }

  _logError(data) {
    this._log('error', data);
  }

  _logInfo(data) {
    this._log('log', data);
  }

  /**
   * Дефолтная проверка работоспособности прокси на основе ответа
   * @param proxyHost
   * @param proxyPort
   * @param requestUrl
   * @param rawResponse
   * @returns {boolean}
   * @private
   */
  static _defaultCheckResponse(proxyHost, proxyPort, requestUrl, rawResponse, realIp) {
    let response = this.constructor.parseHttpResponse(rawResponse);
    let reIp = /^(\d{1,3}\.){3}\d{1,3}$/;
    let ip = response.body.trim();
    return reIp.test(ip) && ip !== realIp;
  }

  /**
   * Очищает слушателей сокета и закрывает его, если isDestroy - true
   * @param isDestroy
   * @private
   */
  clearSocket(isDestroy = true) {
    if (this._timerId) {
      clearTimeout(this._timerId);
      this._timerId = null;
    }
    if (!this._socket) {
      return;
    }
    this._socket.removeAllListeners();
    if (isDestroy) {
      this._socket.destroy();
    }
  }

  /**
   * Вешает обработчики на несколько событий, которые будут считаться ошибками. Так же бонусом вешает таймаут по истечении которого считается что произошла ошибка
   * @param events
   * @param cb
   * @private
   */
  _onSocketErrors(events = [], cb) {
    if (this._timerId) {
      clearTimeout(this._timerId);
    }
    this._timerId = setTimeout(() => {
      this.clearSocket();
      cb(new Error('Timeout'));
    }, this._timeout);

    for (let event of events) {
      this._socket.once(event, err => {
        if (err) {
          return cb(err);
        }
        cb(new Error(event));
      });
    }
  }

  /**
   * Пытается подключиться к сокету
   * @returns {Promise<BaseProxyChecker>}
   * @private
   */
  async socketConnect() {
    this._socket = new Socket;
    this._socket.setTimeout(this._timeout);
    return await new Promise((resolve, reject) => {
      this._socket.connect({
        host: this._host,
        port: this._port,
      });

      this._onSocketErrors(['error', 'timeout'], (err) => {
        this.clearSocket();
        reject(err);
      });

      this._socket.once('connect', () => {
        this.clearSocket(false);
        resolve(this);
      });
    });
  };

  /**
   * Пишет данные в сокет
   * @param data
   * @returns {Promise<any>}
   * @private
   */
  async socketWrite(data) {
    return new Promise((resolve, reject) => {
      this._onSocketErrors(['error', 'close'], err => {
        this.clearSocket();
        reject(err);
      });

      this._socket.write(data, () => {
        this.clearSocket(false);
        resolve(this);
      });
    });
  }

  /**
   * Ожидает ответа от сокета соответсвующему правилам описаным в endRules
   * @param endRules
   * @returns {Promise<any>}
   * @private
   */
  async socketRead(endRules = {}) {
    // Определяем, на основе чего будем считать что чтение завершено
    let {countBytes, pattern, isSocketEnd, customFn} = Object.assign({
      countBytes: null, // Получено опеределенное кол-во байт
      pattern: null, // Ответ в текстовом виде соответствует паттерну
      customFn: null, //Кастомная ф-я проверяющая завершенность ответа. На нее подается буфер с данными ответа, и она должна вернуть true, если распознала ответ как завершенный
      isSocketEnd: true, // Наступило событие end
    }, endRules);

    let errorEvents = ['error', 'close'];
    if (!isSocketEnd) {
      errorEvents.push('end');
    }

    return new Promise((resolve, reject) => {
      this._onSocketErrors(errorEvents, err => {
        this.clearSocket();
        reject(err);
      });

      let response = new Buffer(0);

      if (isSocketEnd) {
        this._socket.once('end', () => {
          this.clearSocket(false);
          resolve(response);
        });
      }

      this._socket.on('data', chunk => {
        response = Buffer.concat([response, chunk]);
        if (countBytes && response.length >= countBytes) {
          this.clearSocket(false);
          return resolve(response);
        }
        if (pattern && pattern.test(response.toString())) {
          this.clearSocket(false);
          return resolve(response);
        }
        if (customFn && customFn(response)) {
          this.clearSocket(false);
          return resolve(response);
        }

      });
    });
  }

  /**
   * Пытаемся интерпритировать сырой ответ, как HTTP
   * @param rawResponse
   * @returns {*}
   * @private
   */
  static parseHttpResponse(rawResponse) {
    rawResponse = rawResponse.toString();
    //Выгребаем статус
    let statusRegexp = /^HTTP\/\d+\.\d+ \d{3} /;
    if (!statusRegexp.test(rawResponse)) {
      return false;
    }
    //Выгребаем заголовки
    let headerDelimiterPosition = rawResponse.search('\r\n\r\n');
    if (headerDelimiterPosition === -1) {
      return false;
    }
    let rawHeaders = rawResponse.substr(0, headerDelimiterPosition).split('\r\n');

    //Выгребаем тело
    let body = rawResponse.substr(headerDelimiterPosition + 4);
    let rawStatus = rawHeaders[0];
    let status = parseInt(rawStatus.substr(9, 3));
    //remove http status from headers
    rawHeaders.splice(0, 1);
    let headers = {};
    for (let rawHeader of rawHeaders) {
      let delimiterPos = rawHeader.search(':');
      let name = rawHeader.substr(0, delimiterPos).toLowerCase().trim();
      headers[name] = rawHeader.substr(delimiterPos + 1).trim();
    }
    //Проверяем соответсвие размеру тела заголовку content-length
    let bodyLength = parseInt(headers['content-length']);
    if (body.length < bodyLength) {
      return false;
    }
    body = body.substr(0, bodyLength);
    return {
      rawResponse,
      status,
      headers,
      rawHeaders,
      body,
    };
  }

  async getRealIp() {
    if (this._realIp !== null) {
      return this._realIp;
    }

    let parseCheckUrl = new URL(this._requestCheckUrl);
    let checkHost = parseCheckUrl.hostname;
    let checkPort = parseCheckUrl.port || 80;
    let checkPath = parseCheckUrl.pathname;

    let bp = new this.constructor(checkHost, checkPort);
    await bp.socketConnect();
    let requestData = `GET ${checkPath} HTTP/1.0\r\n`;
    requestData += `Host: ${checkHost}\r\n`;
    requestData += '\r\n';
    await bp.socketWrite(requestData);
    this._realIp = this.constructor.parseHttpResponse(await bp.socketRead()).body.trim();
    return this._realIp;
  }

  async _runCheck() {
    throw new Error('Method not implements');
  }

  /**
   * Непосредственно проверка прокси
   * @returns {Promise<boolean>}
   */
  async check() {
    try {
      return await new Promise((resolve, reject) => {
        this._onSocketErrors([], err => {
          reject(err);
        });
        this._runCheck().then(res => resolve(!!res)).catch(err => reject(err));
      });
    } catch (e) {
      this._logError(e);
      return false;
    } finally {
      this.clearSocket();
    }
  }
}

module.exports = BaseProxyChecker;