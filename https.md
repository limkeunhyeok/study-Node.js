# HTTPS

## 1. 개요

> HTTPS(HyperText Transfer Protocol over Secure)이란 HTTP 프로토콜에서 보안이 강화된 것으로, 요청 및 응답 데이터가 네트워크에 보내기 전에 암호화된다.

- HTTP란 웹 환경에서 브라우저와 웹 서버가 통신하는 방법을 말한다.
- HTTP 통신은 데이터가 암호화되지 않으며, 중간에 해커가 탈취할 위험이 있다.
- HTTPS는 이러한 단점을 극복하고자 HTTP에 SSL 기술을 더한 것이다.

## 2. 암호화, 암호화 키(Key)

![1](https://user-images.githubusercontent.com/38815618/115750613-4d957700-a3d3-11eb-8a5e-f5a8613e6b61.png)

- 만약 똑같은 암호화 알고리즘을 사용한다면, 쉽게 답을 유추해낼 수 있다.
- 이에 암호화 키를 사용한다면, 결과 또한 달라져 유추하기 어려워진다.

![2](https://user-images.githubusercontent.com/38815618/115750621-4ff7d100-a3d3-11eb-826c-542e6114d5fe.png)

- 앞선 방식에서 암호화 키는 상대방이 복호화하는 과정에서 필요하기 때문에, 키를 분배하여 공유해야 한다.
- 하지만 이러한 방식은 또 중간에 해커에게 노출될 수 있다.

## 3. SSL

- SSL(Secure Socket Layer)이란 Netscape사에서 웹서버와 웹브라우저간의 보안을 위해 만들어진 것으로, 공개키/개인키 대칭키 기반으로 사용된다.
- SSL 사용 이점
  - 통신 내용이 공격자에게 노출되는 것을 막을 수 있다.
  - 클라이언트가 접속하려는 서버가 신뢰 할 수 있는 서버인지를 판단할 수 있다.
  - 통신 내용의 악의적인 변경을 방지할 수 있다.
- SSL 통신 과정
  1. 사이트에서 인증기관(CA: Certificate Authority)에 인증요청
  2. 인증기관에서 검증후에 사이트의 공개키와 정보를 인증기관의 개인키로 암호화, 인증기관의 공개키는 브라우저에 제공
  3. 사용자가 사이트로 접속 요청시 사이트는 인증서 전송
  4. 사용자는 브라우저에 내장된 공개키로 인증서를 복호화 -> 사이트의 공개키로 대칭키를 암호화하여 전송
  5. 사이트는 전송받은 암호화된 대칭키를 사이트의 개인키로 복호화 -> 사용자, 사이트 같은 대칭키 획득
  6. 전송시 해당 대칭키로 암호화하여 전송

## 4. Node.js에서 HTTPS

- SSL 인증서는 보통 유료로 구매해야 하나, 몇몇 무료로 제공하는 곳이 있다.
  - Let’s Encrypt : 유료기간이 90일
  - Comodo Free SSL : 코모도에서 출시한 무료 인증서
  - CloudFlare One-Click SSL : CloudFlare CDN과 함께 사용 가능함
  - AWS Certificate Manager 유효기간 자동 갱신

### Express에서 HTTPS 구현하기

```javascript
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');

const options = {
  key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
  cert: fs.readFileSync('test/fixtures/keys/agent2-cert.cert')
};

// Create a service (the app object is just a callback).
const app = express();

// Create an HTTP service.
http.createServer(app).listen(80);
// Create an HTTPS service identical to the HTTP service.
https.createServer(options, app).listen(443);
```
