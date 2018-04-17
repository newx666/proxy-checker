# proxy-checker
Простой proxy-checker на node.js

Данный пакет предназначен для проверки работоспособности различных видов прокси(http, connect(https), socks4, socks5)

#### Зависимости
* node.js v9+ или использовать babel

#### Быстрый старт

Установка
```bash
npm i --save https://github.com/newx666/proxy-checker
```

Использование
```js
'use strict';
const {ProxyChecker} = require('proxy-checker');

(async ()=>{
	let pc = new ProxyChecker('127.0.0.1', 9050);
	console.log(await pc.check());
})();
```
Результат:
```json
{ "socks5": true, "socks4": true, "connect": false, "http": false }
```

#### О проверочном сервере

Работоспособность каждого вида прокси, проверяется следующим образом:

1) Определяется реальный IP
2) Посредством прокси совершаем HTTP запрос на проверочный сервер (по умолчанию на http://ipinfo.io/ip )
3) Если в теле ответа найден IP отличный от реального, то предпологается что прокси работает

Требование к проверочному серверу(по умолчанию) всего одно - он должен возвращать в теле HTTP ответа чистый IP 
(без тегов и т.п.)

Если вы по каким-то причинам не доверяете сторонним серверам, то можете загрузить на свой сервер 
файл [request-checker.js](https://raw.githubusercontent.com/newx666/proxy-checker/master/request-checker.js) , и запустить
```bash
wget https://raw.githubusercontent.com/newx666/proxy-checker/master/request-checker.js
HOST=<ВАШ_ВНЕШНИЙ_IP> PORT=<ЖЕЛАЕМЫЙ_ПОРТ> node request-checker.js
```

Это реализация простейшего сервера отвечающего описанным выше требованиям. Вам останется только в опциях прописать 
requestCheckUrl равным _http://<ВАШ_ВНЕШНИЙ_IP>:<ЖЕЛАЕМЫЙ_ПОРТ>/ip_

#### Доступные классы

* [BaseProxyChecker](https://github.com/newx666/proxy-checker/blob/master/lib/BaseProxyChecker.js) - базовый класс, 
на нем базируются все остальные чекеры
* [HttpProxyChecker](https://github.com/newx666/proxy-checker/blob/master/lib/HttpProxyChecker.js) - класс для проверки HTTP прокси 
* [ConnectProxyChecker](https://github.com/newx666/proxy-checker/blob/master/lib/ConnectProxyChecker.js) - класс для проверки CONNECT(https) прокси 
* [Socks4ProxyChecker](https://github.com/newx666/proxy-checker/blob/master/lib/Socks4ProxyChecker.js) - класс для проверки SOCKS4 прокси 
* [Socks5ProxyChecker](https://github.com/newx666/proxy-checker/blob/master/lib/Socks5ProxyChecker.js) - класс для проверки SOCKS5 прокси 
* [ProxyChecker](https://github.com/newx666/proxy-checker/blob/master/lib/ProxyChecker.js) - класс-обертка для всех прочих классов. Умеет 
проверять прокси на принадлежность к любому из описанных выше видов 

#### Описание опций

Все описанные выше классы имеют одинаковый конструктор:

```js
new HttpProxyChecker(proxyHost, proxyPort, options);
```

**proxyHost** и **proxyPort** думаю не нуждаются в пояснениях, а вот опции могут содержать следующее

* **requestCheckUrl {string}** - Ссылка на тот самый, описанный выше проверочный сервер. По умолчанию: http://ipinfo.io/ip
* **checkResponse {function}** - функция посредством которой проверяется ответ прокси пущенного через проверочный сервер. По умолчанию 
применяется внутренняя ф-я которая просто проверяет ответ на наличие IP адреса отличающегося от реального
*  **timeout {int}** - время в милисекундах за которое надо произвести проверку одного типа прокси. По умолчанию 10000(10 секунд)
*  **userAgent {string}** - заголовок User-Agent посылаемый проверочному серверу. По умолчанию - один из UA от Firefox'a
*  **realIp {string}** - если задан, то чекер не будет пытаться выяснить реальный IP посредством запроса к проверочному серверу, 
а просто поверит на слово (по умолчанию не задан)

У класса **ProxyChecker** есть еще одна дополнительная опция:

* **checkProxyTypes {Array\<string\>}** - массив названий типов прокси, на которые надо проверить кандидата. Доступны следующие 
варианты: 'socks5', 'socks4', 'connect', 'http'. По умолчанию выставлены все доступные варианты.


```js
'use strict';
const {ProxyChecker} = require('proxy-checker');
let pc = new ProxyChecker(PROXY_HOST, PROXY_PORT, {
        requestCheckUrl: 'http://ipinfo.io/ip', // Тот самый описанный выше проверочный сервер
        checkResponse: this.constructor._defaultCheckResponse, //Метод проверяющий
        timeout: 10000,
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0',
        isDebug: process.env.DEBUG || false,
        realIp: null,
        checkProxyTypes: ['socks5', 'socks4', 'connect', 'http']
	});
```


#### TODO

* Реализовать проверку прокси из списка
* Реализовать CLI интерфейс для удобного запуска