# Chapter 05 - 스트림 코딩

## 1. 스트림의 중요성

### 1-1 버퍼링 대 스트리밍

![1](https://user-images.githubusercontent.com/38815618/103359600-81ceea00-4afb-11eb-89a0-fdaa7a5a085d.PNG)

<p>
    입력 조작에서 버퍼 모드는 리소스로부터 오는 모든 데이터를 버퍼에 수집하고, 자원을 모두 읽어들인 후 콜백을 전달한다.
</p>

![2](https://user-images.githubusercontent.com/38815618/103359605-82678080-4afb-11eb-80c5-509791e38617.PNG)

<p>
    스트림은 리소스에서 도착하자마자 데이터를 처리할 수 있다.
</p>

### 1-2 공간 효율성

<p>
    스트림은 버퍼링하여 모든 데이터를 한꺼번에 처리하는 방식으로 불가능한 작업을 처리할 수 있다. 크기가 큰 파일을 읽는다고 했을 때, 파일을 모두 읽은 후 커다란 버퍼를 반환하는 것은 좋지 않으며, 기본적으로 버퍼는 1GB보다 클 수 없다.
</p>

```javascript
// 버퍼링된 API를 사용한 Gzipping(압축)
const fs = require('fs');
const zlib = require('zlib');

const file = process.argv[2];

fs.readFile(file, (err, buffer) => {
    zlib.gzip(buffer, (err, buffer) => {
        fs.writeFile(file + '.gz', buffer, err => {
            console.log('File successfully compressed');
        });
    });
});

// 명령어: node gzip.js <파일 경로>
// 1GB보다 큰 파일인 경우:
// RangeError: File size is greater than possible Buffer: 0x3fffffff bytes
```

```javascript
// 스트림을 사용한 Gzipping
const fs = require('fs');
const zlib = require('zlib');

const file = process.argv[2];

fs.createReadStream(file)
    .pipe(zlib.createGzip())
    .pipe(fs.createWriteStream(file + '.gz'))
    .on('finish', () => console.log('File successfully compressed'));
```

### 1-3 시간 효율성

<p>
    파일을 압축하고 원격의 HTTP 서버에 업로드하는 어플리케이션에서 원격 HTTP 서버는 압축을 풀어 파일 시스템에 저장한다. 클라이언트가 버퍼링되는 API를 사용하여 구현한다면, 업로드는 전체 파일을 읽어 압축한 경우에만 시작할 수 있다. 또한 압축 해제는 모든 데이터가 서버에 수신된 경우에만 시작할 수 있다. 클라이언트 시스템에서 스트림을 사용하면 파일 시스템에서 데이터 덩어리를 읽는 즉시 압축하고 보낼 수 있으며, 서버에서는 원격 피어에서 수신된 즉시 모든 덩어리를 압축 해제할 수 있다.
</p>

```javascript
const http = require('http');
const fs = require('fs');
const zlib = require('zlib');

const server = http.createServer((req, res) => {
    const filename = req.headers.filename;
    console.log('File request received: ' + filename);
    req
        .pipe(zlib.createGunzip())
        .pipe(fs.createWriteStream(filename))
        .on('finish', () => {
            res.writeHead(201, {'Content-Type': 'text/plain'});
            res.end("That's it\n");
            console.log(`File saved: ${filename}`);
        });
});

server.listen(3000, () => console.log('Listening'));
```

<p>
    위의 코드는 서버로 Node.js 스트림 때문에 네트워크에서 데이터 덩어리를 수신하고 압축을 풀어 수신 즉시 이를 저장한다.
</p>

```javascript
const fs = require('fs');
const zlib = require('zlib');
const http = require('http');
const path = require('path');
const file = require('path');
const file = process.argv[2];
const server = process.argv[3];

const options = {
    hostname: server,
    port: 3000,
    path: '/',
    method: 'PUT',
    headers: {
        filename: path.basename(file),
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'gzip'
    }
};

const req = http.request(options, res => {
    console.log('Server response: ' + res.statusCode);
});

fs.createReadStream(file)
    .pipe(zlib.createGzip())
    .pipe(req)
    .on('finish', () => {
        console.log('File successfully sent');
    });
```

<p>
    위의 코드는 클라이언트로 파일에서 데이터를 읽기 위해 스트림을 사용하여 파일 시스템에서 읽어들이자마자 각 데이터를 덩어리를 압축하여 보낸다.
</p>

![3](https://user-images.githubusercontent.com/38815618/103359607-83001700-4afb-11eb-85f0-abe149745070.PNG)

1. [Client] 파일 시스템에서 데이터를 읽는다.
2. [Client] 데이터를 압축한다.
3. [Client] 서버로 전송한다.
4. [Server] 클라이언트로부터 수신한다.
5. [Server] 데이터의 압축을 푼다.
6. [Server] 디스크에 데이터를 쓴다.

<p>
    처리를 완료하려면 조립 라인과 같이 순서대로 각 단계를 끝까지 완료해야 한다. 위의 그림에서 버퍼링되는 API를 보면 프로세스가 완전히 순차적이다. 스트림은 전체 파일을 읽을 때까지 기다리지 않고 첫 번째 데이터 덩어리를 수신하자마자 조립 라인이 시작되며, 병렬로 실행된다. 따라서, 스트림을 사용하면 모든 데이터를 한꺼번에 읽고 처리하기 위해 시간을 낭비하지 않으므로 전체 프로세스의 시간이 단축된다.
</p>

### 1-4 결합성

> 여기서 말하는 결합성은 스트림에 기능 추가 또는 계층 추가를 의미하는 듯

<p>
    앞선 코드는 단일 기능을 담당하는 서로 다른 프로세스 유닛들을 연결할 수 있는 `pipe()` 메소드를 사용하여 어떻게 스트림을 구성할 수 있는지에 대한 개요를 보여주었다. 이는 스트림이 균일한 인터페이스를 가지며 API 측면에서 서로를 이해할 수 있기 때문에 가능하다. 유일한 전체 조건은 파이프라인의 다음 스트림이 이전 스트림에 의해 생성되어 전달된 데이터 타입을 지원해야 한다는 것이다.
</p>

<p>
    `pipe()` 메소드는 스트림 계층 구성이 쉽다. 이 접근법의 주요 장점은 재사용성이며, 스트림을 깨끗하고 모듈화된 코드를 만들 수 있다. 이러한 이유로 스트림은 순수한 I/O를 다루는 것뿐만 아니라 코드를 단순화하고 모듈화하는 수단으로 사용되기도 한다.
</p>
