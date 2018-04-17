'use strict';
/**
 * Этот скрипт примитивного сервера служит для проверки работоспособности прокси - он должен быть запущен на сервере доступном извне.
 * Именно к этому серверу и будут производиться попытки подключения, чтобы проверять работоспособность прокси
 */
const http = require('http');

let HOST = process.env.HOST || '0.0.0.0';
let PORT = process.env.PORT || 3000;
PORT = parseInt(PORT);
if (isNaN(PORT)) {
  PORT = 3000;
}

//Если сервер находится, скажем, за клоудфлером, то реальный IP клиента будет лежать в заголовке cf-connecting-ip
let IP_HEADERS = process.env.IP_HEADER || null;

if (IP_HEADERS) {
  IP_HEADERS = IP_HEADERS.split(',').map(item => item.trim());
}

const server = http.createServer((req, res) => {
  let headers = req.headers;
  let method = req.method;
  let ip = req.client.remoteAddress;
  let url = req.url;
  let reIp = /^(\d{1,3}\.){3}\d{1,3}$/;

  if (IP_HEADERS) {
    for (let header of IP_HEADERS) {
      if (req.headers[header] && reIp.test(req.headers[header])) {
        ip = req.headers[header];
        break;
      }
    }
  }

  if (['/ip', '/ip/', '/', ''].indexOf(url) === -1) {
    res.writeHead(400, 'Bad Request');
    return res.end();
  }

  let responseData = null;
  if (url === '/ip' || url === '/ip/') {
    res.setHeader('Content-Type', 'text/plain');
    responseData = ip;
  } else {
    res.setHeader('Content-Type', 'application/json');
    responseData = JSON.stringify({
      ip,
      headers,
      method,
    });
  }
  res.writeHead(200, {'Content-Length': responseData.length});
  return res.end(responseData);
});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(PORT, HOST, () => {
  console.log(`http://${HOST}:${PORT}`);
});
