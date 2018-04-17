'use strict';

const {expect} = require('chai');
const BaseProxyChecker = require('../../lib/BaseProxyChecker');
const DNS = require('dns');
const Q = require('q');
const conf = require('../_config/config');
const {URL} = require('url');

const debugServerUrl = new URL(conf.requestCheckerUrl);
let debugServerHost = debugServerUrl.hostname;
let debugServerPort = debugServerUrl.port || 80;
let debugServerIp;

before(async () => {
  [debugServerIp] = await Q.nfcall(DNS.lookup, debugServerHost);
});

let requestData = 'GET / HTTP/1.0\r\n';
requestData += `Host: ${debugServerHost}\r\n`;
requestData += '\r\n';

let requestDataIp = requestData.replace('GET / HTTP', 'GET /ip HTTP');

describe('lib/BaseProxyChecker', function() {
  this.timeout(conf.timeout);
  it('socketConnect', async () => {
    let bpc = new BaseProxyChecker(debugServerHost, debugServerPort);
    expect(bpc._socket).to.be.null;
    await bpc.socketConnect();
    expect(bpc._socket).to.not.be.null;
    bpc.clearSocket();
  });

  it('socketWrite', async () => {
    let bpc = new BaseProxyChecker(debugServerHost, debugServerPort);
    await bpc.socketConnect();
    await bpc.socketWrite(requestData);
    bpc.clearSocket();
  });

  it('socketRead', async function() {
    this.timeout(5000);
    let bpc = new BaseProxyChecker(debugServerHost, debugServerPort);
    await bpc.socketConnect();
    await bpc.socketWrite(requestData);
    let response = await bpc.socketRead();
    bpc.clearSocket();
    let re = /^HTTP\/\d+\.\d+ \d{3}/;
    expect(response.toString()).to.match(re);

    await bpc.socketConnect();
    await bpc.socketWrite(requestData);
    response = await bpc.socketRead({
      countBytes: 15,
      isSocketEnd: false,
    });
    bpc.clearSocket();
    expect(response.toString()).to.match(re);

    await bpc.socketConnect();
    await bpc.socketWrite(requestData);
    response = await bpc.socketRead({
      pattern: re,
      isSocketEnd: false,
    });
    bpc.clearSocket();
    expect(response.toString()).to.match(re);

    await bpc.socketConnect();
    await bpc.socketWrite(requestData);
    response = await bpc.socketRead({
      customFn: rawRequest => re.test(rawRequest.toString()),
      isSocketEnd: false,
    });
    bpc.clearSocket();
    expect(response.toString()).to.match(re);

  });

  it('parseHttpResponse', async () => {
    let bpc = new BaseProxyChecker(debugServerHost, debugServerPort);
    await bpc.socketConnect();
    await bpc.socketWrite(requestDataIp);
    let rawResponse = await bpc.socketRead();
    let response = BaseProxyChecker.parseHttpResponse(rawResponse);
    expect(response).to.not.false;
    expect(response.status).to.be.a('number');
    expect(response.body.trim()).to.match(/^(\d{1,3}\.){3}\d{1,3}$/);
  });
});