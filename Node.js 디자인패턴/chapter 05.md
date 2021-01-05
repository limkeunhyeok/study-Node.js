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

## 2. 스트림 시작하기

### 2-1 스트림의 구조

- 네 가지 추상 클래스
  - stream.Readable
  - stream.Writeable
  - stream.Duplex
  - stream.Transform

<p>
    각 스트림 클래스는 EventEmitter의 인스턴스이기도 하다. 실제로 end나 error와 같은 여러 가지 유형의 이벤트를 제공한다. 스트림이 매우 유연한 이유 중 하나는 바이너리 데이터를 처리할 뿐만 아니라 거의 모든 자바스크립트의 값을 처리할 수 있다는 것이다 . 실제로 두 가지 동작 모드를 지원할 수 있다.
</p>

- 바이너리 모드: 데이터가 버퍼 또는 문자열과 같은 덩어리(chunk) 형태로 스트리밍되는 모드
- 객체 모드: 스트리밍 데이터가 일련의 별도 객체들로 취급

### 2-2 Readable 스트림

<p>
    Readable 스트림은 데이터 소스를 나타내며, Node.js에서는 스트림 모듈에서 사용할 수 있는 Readableabstract 클래스를 사용하여 구현된다.
</p>

#### non-flowing 모드

<p>
    Readable 스트림에서 읽기의 기본 패턴은 새로운 데이터를 읽을 준비가 되었다는 신호인 readable 이벤트에 대하여 리스너를 등록하는 것이다. 그후에 다음 루프에서 내부의 버퍼가 비워질 때까지 모든 데이터를 읽는다. 이것은 내부 버퍼에서 동기식으로 데이터 덩어리를 읽고 Buffer 또는 String 객체를 반환하는 `read()` 메소드를 사용하여 수행할 수 있다.
</p>

<p>
    `read()` 메소드는 Readable 스트림의 내부 버퍼에서 데이터를 읽어들이는 동기 작업이다. 스트림이 바이너리 모드로 동작하고 있는 경우, 기본적으로 반환되는 데이터는 Buffer 객체이다.
</p>

<p>
    데이터는 readable 리스너에서 독점적으로 읽을 수 있다. 리스너는 새로운 데이터가 읽기 가능하게 되는 즉시 호출된다. `read()` 메소드는 내부 버퍼에 더 이상 사용할 수 있는 데이터가 없을 때 null을 반환한다. 이 경우 다시 읽을 수 있다는 이벤트 또는 스트림의 끝을 알리는 end 이벤트가 발생할 때까지 기다려야 한다. 스트림이 바이너리 모드에서 동작할 때는 size 값을 `read()` 메소드에 전달하여 특정 양의 데이터를 읽어들일 것이라고 지정할 수 있다. 특히 특정 형식의 네트워크 프로토콜이나 특정 데이터 형식으로 분석하는 구현에 유용하다.
</p>

#### Flowing 모드

<p>
    스트림으로부터 데이터를 읽는 또 다른 방법은 data 이벤트에 리스너를 등록하는 것이다. 이것은 스트림을 Flowing 모드로 전환한다. 여기서 데이터는 `read()`를 사용하여 거내지 않고 데이터가 도착하자마자 해당 리스너에 전달된다.
</p>

<p>
    Flowing 모드는 이전 버전의 스트림 인터페이스(Stream1)의 상속이며, 데이터 흐름 제어를 위한 유연성이 떨어진다. Stream2 인터페이스의 도입으로 Flowing 모드는 기본 작동 모드가 아니다. 이를 사용하려면 data 이벤트에 리스너를 등록하거나 `resume()` 메소드를 명시적으로 호출해야 한다. 스트림에서 data 이벤트 발생을 일시적으로 중지시키기 위해서는 `pause()` 메소드를 호출하는데, 이 경우 들어오는 데이터는 내부 버퍼에 캐시된다.
</p>

#### Readable 스트림 구현하기

```javascript
const stream = require('stream');
const Chance = require('chance');
const chance = new Chance();

class RandomStream extends stream.Readable {
    constructor(options) {
        super(options);
    }

    _read(size) {
        const chunk = chance.string(); // 1.
        console.log(`Pushing chunk of size: ${chunk.length}`);
        this.push(chunk, 'utf8'); // 2.
        if (chance.bool({likelihood: 5})) { // 3.
            this.push(null);
        }
    }
}

module.exports = RandomStream;
```

<p>
    위의 코드는 문자열 생성기의 코드를 포함하는 randomStream 모듈이다. `stream.Readable`을 부모로 지정하고, 부모 클래스의 생성자를 호출하여 내부 상태를 초기화하는데 option 인자를 전달한다. option 객체를 통해 전달할 수 있는 변수들은 다음과 같다.
</p>

- 버퍼를 문자열로 변환하는데 사용되는 encoding 변수(기본값은 null)
- 객체 모드를 정하는 플래그(기본값은 false)
- 내부 버퍼에 저장되는 데이터의 상한선, 이후 소스로부터 더 이상 데이터를 읽지 않는다.

<p>
    `_read()` 메소드
</p>

1. chance를 사용하여 임의의 문자열을 생성한다.
2. 생성된 문자열을 내부 읽기 버퍼에 푸시한다. String을 푸시하기 때문에 인코딩을 지정한다.
3. 이 함수는 5%의 학률로 내부 버퍼에 EOF 상황, 스트림의 끝을 나타내는 null을 내부 버퍼에 푸시하여 스트림을 무작위적으로 종료시킨다.

### 2-3 Writeable 스트림

<p>
    Writeable 스트림은 데이터의 목적지를 나타내며, Node.js에서는 스트림 모듈에서 사용할 수 있는 Writeable 클래스를 사용하여 구현된다.
</p>

#### 스트림에 쓰기

```javascript
writeable.write(chunk, [encoding], [callback])
```

<p>
    인코딩 인자는 선택 사항이며, chunk가 String일 경우 지정할 수 있다. 대신 콜백 함수는 chunk가 하위 리소스로 flush되면 호출되는데 이 역시 선택 사항이다.
</p>

```javascript
writeable.end([chunk], [encoding], [callback])
```

<p>
    더 이상 스트림에 기록할 데이터가 없다는 신호를 보내기 위해서는 `end()` 메소드를 사용해야 한다. `end()` 메소드를 사용하여 마지막 데이터를 전달할 수 있는데, 이 경우 콜백 함수는 스트림에 쓴 모든 데이터가 하위 리소스로 flush 되었을 때 발생하는 finish 이벤트에 리스너를 등록하는 것과 같다.
</p>

```javascript
const Chance = require('chance');
const chance = new Chance();

require('http').createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'}); // 1.
    while(chance.bool({likelihood: 95})) { // 2.
        res.write(chance.string() + '\n'); // 3.
    }
    res.end('\nThe end...\n'); // 4.
    res.on('finish', () => console.log('All data was sent')); // 5.
}).listen(8080, () => console.log('Listening on http://localhost:8080'));
```

1. HTTP 응답 헤더를 작성한다. `writeHead()` Writeable 인터페이스의 일부가 아닌, `http.ServerResponse` 클래스에 의해 노출된 보조 메소드이다.
2. 5%의 확률로 종료되는 루프를 시작한다(전체 루프의 95%는 `chance.bool()`에서 true를 반환).
3. 루프 내에서 임의의 문자열을 스트림에 쓴다.
4. 루프가 끝나면 스트림에서 `end()`를 호출하여 더 이상 쓸 데이터가 없음을 알린다. 또한, 스트림을 끝내기 전에 스트림에 쓸 최종 문자열을 전달한다.
5. 마지막으로 finish 이벤트에 대한 리스너를 등록하는데, 이 이벤트는 모든 데이터가 하위 소켓에 flush 될 때 발생한다.

#### 백 프레셔(Back-pressure)

<p>
    실제 파이프 시스템에서 스트림이 소비하는 것보다 더 빠르게 데이터를 쓸 경우 병목 현상이 발생할 수 있다. 이를 해결하기 위한 메커니즘은 들어오는 데이터를 버퍼링하는 것이다. 그러나 스트림이 writer에 피드백을 주지 않는다면, 내부 버퍼에 점점 더 많은 데이터가 축적되어 원치 않은 수준의 메모리 사용을 초래하게 된다.
</p>

<p>
    이런 일이 발생하지 않도록 내부 버퍼가 highWatermark 제한을 초과하면 `writeable.write()`는 false를 반환한다. Writeable 스트림은 highWaterMark라는 속성을 가지고 있다. 이것은 내부 버퍼의 크기 제한을 나타내는데, `write()` 메소드가 false를 반환하면 어플리케이션에서는 더 이상의 데이터를 쓰지 말아야 한다. 버퍼가 비워지면 drain 이벤트가 발생하여 다시 쓰기 시작해도 좋다는 것을 알린다. 이 메커니즘을 백프레셔라고 한다.
</p>

```javascript
const Chance = require('chance');
const chance = new Chance();

require('http').createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});

    function generateMore() { // 1.
        while(chance.bool({likelihood: 95})) {
            let shouldContinue = res.write(
                chance.string({length: (16 * 1024) - 1}) // 2.
            );
            if (!shouldContinue) { // 3.
                console.log('Backpressure');
                return res.once('drain', generateMore);
            }
        }
        res.end('\nThe end...\n', () => console.log('All data was sent'));
    }
    generateMore();
}).listen(8080, () => console.log('Listening on http://localhost:8080'));
```

1. `generateMore()`라는 함수로 메인 로직을 감쌌다.
2. 백프레셔를 받을 가능성을 높이기 위해 데이터 덩어리의 크기를 16KB-1Byte 늘렸다. 이는 highWaterMark의 기본값에 매우 가까운 값이다.
3. 데이터 덩어리를 작성한 후 `res.write()`의 리턴 값을 확인한다. false를 받으면 내부 버퍼가 가득 차서 더 이상 데이터를 쓸 수 없음을 의미한다. 이 경우 함수에서 빠져 나가고 drain 이벤트가 발생할 때마다 쓰기 작업을 다시 등록한다.

#### Writeable 스트림 구현

```javascript
const stream = require('stream');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

class ToFileStream extends stream.Writable {
    constructor() {
        super({objectMode: true});
    }

    _write(chunk, encoding, callback) {
        mkdirp(path.dirname(chunk.path), err => {
            if (err) {
                return callback(err);
            }
            fs.writeFile(chunk.path, chunk.content, callback);
        });
    }
}

module.exports = ToFileStream;
```

<p>
    위의 코드는 객체를 받는 Writeable 스트림이다. `stream.Writeable`을 부모로 지정하고, 부모 클래스의 생성자를 호출하여 내부 상태를 초기화하는데 option 인자를 전달한다. option 객체를 통해 전달할 수 있는 변수들은 다음과 같다.
</p>

- highWaterMark: 백프레셔의 한도를 제어한다(기본값은 16K).
- decodeStrings: `_write()` 메소드에 전달되기 전에 바이너리 버퍼 내 문자열에 대한 디코딩을 자동으로 활성화시킨다. 이 옵션은 object 모드에서는 무시된다(기본값은 true).

<p>
    `_write()` 메소드는 데이터 덩어리, 인코딩(바이너리 모드면서 스트림 옵션 decodeStrings가 false로 설정된 경우에만 의미가 있음)을 인자로 받는다. 이 메소드는 작업이 완료될 때 호출해야 하는 콜백 함수를 허용하고 있다. 작업 결과를 전달할 필요는 없지만, 필요한 경우 스트림에서 error 이벤트를 발생시키는 오류를 전달할 수 있다.
</p>

### 2-4 양방향(Duplex) 스트림

<p>
    양방향 스트림은 Readable과 Writeable 모두가 가능한 스트림이다. 이것은 소켓처럼 데이터 소스와 데이터 목적지를 모두 가지는 항목을 다룰 때 유용하다. 양방향 스트림은 stream.Readable 및 stream.Writeable의 메소드를 상속하기 때문에, 데이터를 `read()` 또는 `write()` 하거나 readable이나 drain 이벤트를 모두 수신할 수 있다.
</p>

<p>
    사용자 정의 이중 스트림을 생성하려면 `_read()` 및 `_write()` 메소드를 구현해야 한다. `Duplex()` 생성자에 전달되는 options 객체는 내부적으로 Readable 및 Writeable 모두의 생성자에 전달된다. options는 객체는 내부적으로 Readable 및 Writeable 모두의 생성자에 전달된다. allowHalfOpen(기본값은 true)이라는 새로운 매개 변수를 추가하면 이전의 코드들과 동일하며, false로 설정시 스트림의 한 쪽이 종료되면 두 쪽 모두 종료된다.
</p>

### 2-5 Transform 스트림

![1](https://user-images.githubusercontent.com/38815618/103417567-7f899000-4bce-11eb-830e-28600f007ca1.PNG)

<p>
    간단한 양방향 스트림에서는 스트림에서 읽은 데이터와 스트림에 쓰는 데이터 사이에 직접적인 관계가 없다. TCP 소켓에서 입력과 출력 사이에 어떠한 관계도 인식하지 못한다.
</p>

![2](https://user-images.githubusercontent.com/38815618/103417568-80222680-4bce-11eb-9a2c-f6a1644dbe8a.PNG)

<p>
    Transform 스트림은 Writeable 쪽에서 받은 각 데이터를 적절히 처리한 후에 Readable 쪽에서 사용할 수 있게 한다. 외부에서 볼 때 Transform 스트림의 인터페이스는 양방향 스트림의 인터페이스와 동일하다. 하지만 양방향 스트림을 만들 때는 `_read()` 및 `_write()` 메소드를 구현해 제공해야 하지만, Transform 스트림을 구현할 때는 `transform()`과 `_flush()` 메소드를 추가로 작성해야 한다.
</p>

### 2-6 Transform 스트림 구현

```javascript
const stream = require('stream');
const util = require('util');

class ReplaceStream extends stream.Transform {
    constructor(searchString, replcaeString) {
        super();
        this.searchString = searchString;
        this.replcaeString = replcaeString;
        this.tailPiece = '';
    }

    _transform(chunk, encoding, callback) {
        const pieces = (this.tailPiece + chunk) // 1.
            .split(this.searchString);
        const lastPiece = pieces[pieces.length - 1];
        const tailPieceLen = this.searchString.length - 1;

        this.tailPiece = lastPiece.slice(-tailPieceLen); // 2.
        pieces[pieces.length - 1] = lastPiece.slice(0, -tailPieceLen);

        this.push(pieces.join(this.replcaeString)); // 3.
        callback();
    }

    _flush(callback) {
        this.push(this.tailPiece);
        callback();
    }
}

module.exports = ReplaceStream;
```

<p>
    stream.Transform 기본 클래스를 확장하여 새로운 클래스를 만든다. 클래스의 생성자는 searchString과 replaceString 두 개의 인자를 받으며, 찾을 문자열과 찾은 문자열을 교체할 문자열을 정의한다. `_transform()` 메소드에서 사용할 내부 변수 tailPiece를 초기화한다.
</p>

<p>
    `_transform()` 메소드는 Writeable 스트림의 `_write()` 메소드와 거의 동일한 형태를 가지고 있지만, 하위 리소스에 데이터를 쓰는 대신 Readable 스트림의 `_read()` 메소드에서 한 것과 마찬가지로 `this.push()`를 사용하여 내부 버퍼에 푸시한다.
</p>

1. 알고리즘은 searchString 함수를 분리자로 사용하여 데이터 덩어리를 분할한다.
2. 분할 연산에 의해 생성된 배열의 마지막 항목에서 `searchString.length - 1` 만큼의 문자열을 추출한다. 결과는 tailPiece에 저장되고 다음 데이터 덩어리의 앞에 덧붙여진다.
3. 마지막으로 `split()`에서 생성된 모든 항목들을 replaceString을 분리자로 결합되어 내부의 버퍼로 푸시된다.

<p>
    `_flush()` 메소드는 모든 작업이 완료되면 호출하여 스트림이 종료되는 콜백을 인자로 받는다.
</p>

#### 파이프를 통한 스트림 연결

<p>
    Node.js의 스트림은 Readable 스트림의 `pipe()` 메소드를 사용하여 서로 연결할 수 있다. `pipe()` 메소드는 readable 스트림에서 만들어진 데이터를 취하여 주어진 write 스트림으로 보내준다. 또한 readable 스트림이 end 이벤트를 전달하면 자동으로 writeable 스트림은 종료된다. `pipe()` 메소드는 인자로 전달된 writeable 스트림을 반환하므로 해당 스트림이 Readable까지 가능하다면 연결된 호출을 만들어 낼 수 있다.
</p>

<p>
    두 개의 스트림을 함께 pipe로 연결하면 흡착이 생성되어 데이터가 자동으로 writeable 스트림으로 흐르게 되어 read 또는 write 메소드를 호출할 필요가 없으며, 자동으로 처리되기 때문에 백프레셔를 제어할 필요가 없다.
</p>

#### 스트림 작업을 위한 Though와 from

<p>
    기본 스트림 클래스를 상속하게 되면, 최소 면적의 원칙을 위반하고 일부 복잡한 코드를 필요로 하게 된다. 이것은 스트림이 잘못 설계되었다는 것은 아니다. 실제로 Node.js 코어의 일부이므로 사용자 영역의 모듈들이 광범위한 용도로 확장할 수 있도록 가능한 유연해야 한다는 것도 사실이다.
</p>

<p>
    대부분의 경우 프로토타입 상속으로 제공되는 모든 기능을 확장할 필요없이, 새로운 스트림을 정의하고 빠르고 간단한 방법이 필요하다. Node.js에서 이를 위한 솔루션으로 through2 라이브러리가 있다. 이 라이브러리는 Transform 스트림의 생성을 단순화한다.
</p>

```javascript
const transform = through2([options], [_transform], [_flush])
```

<p>
    비슷한 방법으로 from2를 사용하면 쉽고 간결하게 Readable 스트림을 만들 수 있다.
</p>

```javascript
const readable = from2([options], _read)
```

## 3. 스트림을 사용한 비동기 제어 흐름

### 3-1 순차 실행

<p>
    기본적으로 스트림은 순차적으로 데이터를 처리한다. 예를 들어 Transform 스트림의 `_transform()` 함수는 이전 호출의 콜백이 실행되어 완료될 때까지 다음 데이터 덩어리와 함께 재호출되지 않는다. 이는 각 데이터 덩어리들을 올바른 순서로 처리하는데 있어 아주 중요한 특징이며, 스트림을 전통적인 제어 흐름 패턴의 세련된 대안으로 사용하는데 활용할 수도 있다.
</p>

```javascript
// concatFile.js
const fromArray = require('from2-array');
const through = require('through2');
const fs = require('fs');

function concatFiles(destination, files, callback) {
    const destStream = fs.createWriteStream(callback);
    fromArray.obj(files) // 1.
        .pipe(through.obj((file, enc, done) => { // 2.
            const src = fs.createReadStream(file);
            src.pipe(destStream, {end, false});
            src.on('end', done); // 3.
        }))
        .on('finish', () => { // 4.
            destStream.end();
            callback();
        });
}

module.exports = concatFiles;
```

1. from2-array를 사용하여 파일 배열에서 Readable 스트림을 만든다.
2. 순차적으로 각 파일을 처리하기 위해 through 스트림을 생성한다. 각 파일에 대해 Readable 스트림을 만들고, 이를 출력 파일을 나타내는 destStream으로 연결한다. pipe 옵션으로 `{end:false}`를 정의함으로써 소스 파일의 읽기를 완료한 후에도 destStream을 닫지 않도록 한다.
3. 소스 파일의 모든 내용이 destStream으로 전달되었을 때, through에 공개되어 있는 done 함수를 호출하여 현재 처리가 완료되었음을 알린다. 이 경우 다음 파일의 처리를 시작시켜야 한다.
4. 모든 파일이 처리되면 finish 이벤트가 시작된다. 마지막으로 destStream을 종료하고 `concatFiles()`의 `callback()` 함수를 호출하여 전체 작업이 완료되었음을 알릴 수 있다.

```javascript
// concat.js
const concatFiles = require('./concatFiles');
concatFiles(process.argv[2], process.argv.slice(3), () => {
    console.log('Files concatenated successfully');
});

// bash run
// node concat allTogether.txt part1.txt part2.txt part3.txt
```

<p>
    concat을 실행하면 part1, part2, part3의 내용을 포함하는 allTogether라는 새파일을 만들어 낸다.
</p>

### 3-2 비순차 병렬 실행

<p>
    순차 처리는 Node.js의 동시성을 최대한 활용하지 못하기 때문에 병목 현상이 있을 수 있다. 모든 데이터 덩어리들에 대해 느린 비동기 작업을 실행해야 하는 경우, 실행을 병렬화하고 전체 프로세스의 속도를 높이는 것이 유리할 수 있다. 단 이 패턴은 각각의 데이터 덩어리들이 서로 관계가 없는 경우에만 적용할 수 있다.
</p>

```javascript
// parallelStream.js
const stream = require('stream');

class ParallelStream extends stream.Transform {
    constructor(userTransform) {
        super({objectMode: true});
        this.userTransform = userTransform;
        this.running = 0;
        this.terminateCallback = null;
    }

    _transform(chunk, enc, done) {
        this.running++;
        this.userTransform(chunk, enc, this.push.bind(this), this._onComplete.bind(this));
        done();
    }

    _flush(done) {
        if (this.running > 0) {
            this.terminateCallback = done;
        } else {
            done();
        }
    }

    _onComplete(err) {
        this.running--;
        if (err) {
            return this.emit('error', err);
        }
        if (this.running === 0) {
            this.terminateCallback && this.terminateCallback();
        }
    }
}

module.exports = ParallelStream;
```

<p>
    생성자는 `userTransform()` 함수를 받아들여 내부 변수로 저장한다. 또 부모의 생성자를 호출하여 편의상 디폴트로 객체 모드를 활성화한다. `_transform()` 메소드는 실행 중인 작업의 수를 늘린 후 `userTransform()` 함수를 실행한다. 마지막에는 `done()`을 호출함으로써 현재 변환 과정이 완료되었음을 알린다. 이로 인해 `done()`을 호출하기 전에 `userTransform()` 함수가 완료되기를 기다리지 않고 바로 호출한다. 한편, `this._onComplete()` 메소드를 `userTransform()` 함수에 특별한 콜백으로 제공한다. 이로 인해 `userTransform()`이 완료되었을 때 알림을 받을 수 있다.
</p>

<p>
    `_flush()` 메소드는 스트림이 끝나기 직전에 호출된다. 따라서 실행 중인 작업이 있을 경우, 바로 `done()` 콜백을 호출하지 않도록 하여 finish 이벤트의 발생을 보류시킬 수 있다. 대신 `this.terminateCallback` 변수에 할당한다. `_onComplete()` 메소드는 비동기 작업이 완료될 때마다 호출된다. 실행 중인 작업이 있는지 확인하고, 없을 경우 `this.terminateCallback()` 함수를 호출하여 스트림을 종료시키고 `_flush()` 메소드에서 보류된 finish 이벤트를 발생시킨다.
</p>

#### URL 상태 모니터링 어플리케이션의 구현

```javascript
// checkUrls.js
const fs = require('fs');
const split = require('split');
const request = require('request');
const ParallelStream = require('./parallelStream');

fs.createReadStream(process.argv[2]) // 1.
    .pipe(split()) // 2.
    .pipe(new ParallelStream((url, enc, push, done) => { // 3.
        if (!url) return done();
        request.head(url, (err, response) => {
            push(url + ' is ' + (err ? 'down' : 'up') + '\n');
            done();
        });
    }))
    .pipe(fs.createWriteStream('results.txt')) // 4.
    .on('finish', () => console.log('All urls were checked'));
```

1. 입력으로 주어진 파일로부터 Readable 스트림을 생성한다.
2. 각각의 라인을 서로 다른 데이터 덩어리로 출력하는 Transform 스트림인 split을 통해 입력 파일의 내용을 연결한다.
3. 그후, ParallelStream을 사용하여 요청 헤더를 보내고 응답을 기다려 URL을 검사한다. 콜백이 호출될 때 작업 결과를 스트림으로 밀어낸다.
4. 마지막으로 모든 결과가 results.txt 파일에 연결된다.

### 3-3 제한된 비순차 병렬 실행

<p>
    수천 또는 수백만 개의 URL이 포함된 파일에 대해 checkUrls 어플리케이션을 실행하려 한다면 문제가 발생한다. 앞선 어플리케이션은 한 번에 감당할 수 없는 연결을 한꺼번에 생성하여 상당한 양의 데이터를 동시에 보냄으로써 잠재적으로 어플리케이션의 안정성을 해치고 전체 시스템의 가용성을 떨어뜨린다. 이에 부하와 리소스 사용을 제어하는 방법은 병렬 작업의 동시 실행을 제한하는 것이다.
</p>

<p>
    이를 구현하기 위해 앞선 코드에서 concurrency와 continueCallback 변수를 추가한다. running과 concurrency를 비교하여 작업을 제한하고, 최대 동시 실행 스트림의 수에 도달한 경우, `done()` 콜백을 continueCallback에 저장한다. `_onComplete()` 메소드에서 작업이 완료될 때마다 스트림의 차단을 해제할 저장된 continueCallback을 호출하여 다음 항목의 처리를 시작시킨다.
</p>

#### 순차 병렬 실행

<p>
    앞선 병렬 스트림은 발생한 데이터의 순서를 지키지 않지만, 이것이 허용되지 않는 상황이 있다. 실제로 각 데이터 덩어리가 수신된 것과 동일한 순서로 발생시키는 것이 필요하다. 이에 데이터가 수신된 것과 동일한 순서를 따르도록 각 작업에 의해 발생한 데이터들을 정렬해야 한다.
</p>

<p>
    이를 위해 데이터 덩어리들이 각 실행 작업에 의해 발생되는 동안 데이터 덩어리들을 재정렬하기 위한 버퍼를 사용한다. through2-parallel같은 패키지를 사용하여 구현할 수 있다. through2-parallel의 인터페이스는 through2의 인터페이스와 유사하며, 차이점은 Transform 함수에 대한 동시 실행 제한을 지정할 수 있다는 점이다.
</p>

## 4. 파이프 패턴

### 4-1 스트림 결합(combine)하기

![1](https://user-images.githubusercontent.com/38815618/103668629-a7a43500-4fba-11eb-90ae-e932644662fe.PNG)

- 결합된 스트림에 쓸 때는 파이프라인의 첫 번째 스트림에 쓴다.
- 결합된 스트림으로부터 읽을 대는 파이프라인의 마지막 스트림에서 읽는다.

<p>
    결합된 스트림은 보통 이중(Duplex) 스트림이며, 첫 번째 스트림을 Writable 쪽에 연결하고 마지막 스트림을 Readable 쪽에 연결하여 만들어진다. 결합된 스트림은 다음 두 가지 중요 이점을 가진다.
</p>

- 내부 파이프라인을 숨김으로써 블랙박스화 하여 재배포할 수 있다.
- 에러 리스너를 결합된 스트림 자체 외에 파이프라인의 각 스트림에 첨부하지 않도록 하여 에러 관리를 간소화한다.

#### 결합된 스트림 구현하기

- 예시를 위한 두 개의 변환 스트림
  - 데이터 압축 및 암호화
  - 데이터의 암호를 해독하고 압축을 해제

```javascript
// 결합된 스트림
const zlib = require('zlib');
const crypto = require('crypto');
const combine = require('multipipe');

module.exports.compressAndEncrypt = password => {
    return combine(
        zlib.createGzip(),
        crypto.createCipher('aes192', password)
    );
};

module.exports.decryptAndDecompress = password => {
    return combine(
        crypto.createDecipher('aes192', password),
        zlib.createGunzip()
    );
};
```

<p>
    위 코드에서 만든 결합된 스트림은 블랙박스처럼 사용할 수 있다. 예를 들어, 압축 및 암호화하여 파일을 보관하는 작은 어플리케이션을 만들 수 있다. 만들어진 파이프라인 밖으로 결합된 스트림을 만들어 코드를 더욱 향상시킬 수 있다.
</p>

### 4-2 스트림 포크(Fork)하기

![2](https://user-images.githubusercontent.com/38815618/103668634-a83ccb80-4fba-11eb-8392-ded6fe0acf5b.PNG)

<p>
    하나의 Readable 스트림을 여러 Writable 스트림을으로 연결함으로써 스트림을 포크할 수 있다. 이는 서로 다른 대상에 동일한 데이터를 보내려는 경우에 유용하다. 또한 동일한 데이터에 대해 여러 가지 변형을 수행하거나 어떤 기준에 따라 데이터를 분할하려는 경우에도 사용할 수 있다.
</p>

#### 다중 체크섬 생성기 구현

```javascript
const fs = require('fs');
const crypto = require('crypto');

const sha1Stream = crypto.createHash('sha1');
sha1Stream.setEncoding('base64');

const md5Stream = crypto.createHash('md5');
md5Stream.setEncoding('base64');

const inputFile = process.argv[2];
const inputStream = fs.createReadStream(inputFile);
inputStream
    .pipe(sha1Stream)
    .pipe(fs.createWriteStream(inputFile + '.sha1'));

inputStream
    .pipe(md5Stream)
    .pipe(fs.createWriteStream(inputFile + '.md5'));
```

<p>
    inputStream 변수는 한쪽은 sha1Stream으로, 한쪽은 md5Stream으로 연결된다. 하지만 내부적으로 발생하는 몇 가지 주의점이 있다.
</p>

- `pipe()`를 호출할 때 `{end: false}`를 옵션으로 지정하지 않으면 inputStream이 끝날 때 md5Stream과 sha1Stream 모두 자동으로 종료된다.
- 포크된 두 스트림은 동일한 데이터 덩어리를 수신하기 때문에 데이터에 대한 연산으로 부작용이 발생하지 않도록 주의해야 한다. 한곳에서 수정한 데이터는 포크된 다른 모든 스트림에 영향을 줄 수 있다.
- 백프레셔가 바로 발생할 것이다. inputStream으로부터의 흐름은 분기된 스트림들 중 가장 느린 속도에 맞춰질 것이다.

### 4-3 스트림 병합(merge)하기

![3](https://user-images.githubusercontent.com/38815618/103668637-a8d56200-4fba-11eb-8e3c-2392b7577a36.PNG)

<p>
    병합은 분기와 반대되는 작업이며, 일련의 Readable 스트림을 하나의 Writable 스트림으로 파이프하는 것으로 구성된다. auto end 옵션을 사용하는 연결은 소스 중 하나가 끝나는 즉시, 대상 스트림이 종료되도록 하므로 최종 이벤트를 처리하는 방식에 주의를 기울여야 한다. 동작 중인 소스에서 이미 종료된 스트림에 쓰기를 계속하므로 이로 인한 오류가 종종 발생할 수 있다. 이 문제에 대한 해결책은 여러 소스들을 하나의 대상에 연결할 때 `{end: false}` 옵션을 사용하고 모든 소스들이 읽기를 완료한 경우에만 대상에서 `end()`를 호출하는 것이다.
</p>

<p>
    스트림 병합 패턴에 대한 주의점은 대상 스트림으로 파이프된 데이터가 임의로 혼합된다는 점이다. 이 속성은 일부 유형의 객체 스트림에서 수용할 수 있는 속성이지만 바이너리 스트림을 처리할 때 종종 원치 않은 영향을 끼친다. 이에 순서대로 병합할 수 있는 변형 패턴들이 있으며 그 중 하나는 multistream 패키지가 있다.
</p>

### 4-4 멀티플렉싱과 디멀티플렉싱

![4](https://user-images.githubusercontent.com/38815618/103668640-a8d56200-4fba-11eb-9b3d-bbed2bb75a3a.PNG)

<p>
    위의 그림은 여러 스트림을 함께 결합하지 않고 대신 공유 채널을 사용하여 일련의 스트림 데이터를 전달한다. 이는 소스 스트림이 공유 채널 내에서 논리적으로 분리되어 있기 때문에 개념적으로 다른 작업이다. 데이터가 공유 채널의 다른 끝에 도달하면 스트림을 다시 분할할 수 있다.
</p>

<p>
    단일 스트림을 통한 전송을 가능하게 하기 위해 다중 스트림을 함께 결합하는 동작(이 경우 채널)이 멀티플렉싱(다중화)이고, 반대 동작, 즉 공유 스트림으로부터 수신된 데이터로부터 원본 스트림을 재구성하는 동작이 디멀티플렉싱(역다중화)이다. 이런 작업을 수행하는 장치를 멀티플렉서 그리고 디멀티플렉서라고 한다.
</p>

#### 원격 로거 만들기

<p>
    예시로 자식 프로세스를 시작하고 표준 출력과 표준 오류를 모두 원격 서버로 리다이렉션하는 작은 프로그램을 만든다. 이를 위해 원격 서버에서 두 스트림을 두 개의 개별 파일에 저장한다. 따라서 이 경우 공유된 매체는 TCP 연결이고 다중화될 두 개의 채널은 자식 프로세스의 stdout 및 stderr이다.
</p>

![5](https://user-images.githubusercontent.com/38815618/103668643-a96df880-4fba-11eb-98b6-dd7a993b2e39.PNG)

<p>
    예시를 위해 사용되는 기법은 패킷 스위칭이다. 이는 데이터 패킷으로 감싸 다양한 메타 정보를 지정할 수 있어 멀티플렉싱, 라우팅, 제어 흐름, 손상된 데이터 검사 등에 유용한 기술이다. 예시는 위의 그림과 같은 구조의 패킷으로 데이터를 감싼다.
</p>

##### 클라이언트 측 - 멀티플렉싱

```javascript
const child_process = require('child_process');
const net = require('net');

function multiplexChannels(sources, destination) {
    let totalChannels = sources.length;
    for(let i = 0; i < sources.length; i++) {
        sources[i]
            .on('readable', function() { // 1.
                let chunk;
                while((chunk = this.read()) !== null) {
                    const outBuff = new Buffer(1 + 4 + chunk.length); // 2.
                    outBuff.writeUInt8(i, 0);
                    outBuff.writeUInt32BE(chunk.length, 1);
                    chunk.copy(outBuff, 5);
                    console.log('Sending packet to channel: ' + i);
                    destination.write(outBuff); // 3.
                }
            })
            .on('end', () => { // 4.
                if (--totalChannels === 0) {
                    destination.end();
                }
            });
    }
}
```

- `multiplexChannels()` 함수는 다중화할 소스 스트림과 대상 채널을 입력으로 받은 후 다음 과정을 수행한다.
  1. 각 소스 스트림에 non-flowing 모드로 스트림에서 데이터를 읽을 수 있도록 readable 이벤트에 대한 리스너를 등록한다.
  2. 데이터를 읽을 때 일련의 순서가 있는 패킷으로 감싼다. 패킷은 채널 ID 1바이트(Uint8), 패킷 사이즈 4바이트(Uint32), 실제 데이터 순이다.
  3. 패킷이 준비되면 대상 스트림에 기록한다.
  4. 마지막으로 모든 소스 스트림이 끝날 대상 스트림을 종료할 수 있도록 end 이벤트에 대한 리스너를 등록한다.

```javascript
const socket = net.connect(3000, () => { // 1.
    const child = child_process.fork( // 2.
        process.argv[2],
        process.argv.slice(3),
        {silent: true}
    );
    multiplexChannels([child.stdout, child.stderr], socket); // 3.
});
```

1. 새로운 TCP 클라이언트 연결을 `localhost:3000`에 대해 생성한다.
2. 첫 번째 커맨드 라인 인자를 경로로 사용하여 자식 프로세스를 시작하고 나머지 process.argv 배열을 자식 프로세스의 인수로 제공한다. 자식 프로세스가 부목의 stdout과 stderr을 상속받지 않도록 `{silent: true}` 옵션을 지정한다.
3. 끝으로 자식 프로세스의 stdout과 stderr를 취하여 `multiplexChannels()` 함수를 사용하여 소켓으로 멀티플렉싱한다.

##### 서버 측 - 역다중화

```javascript
const net = require('net');
const fs = require('fs');

function demultiplexChannel(source, destinations) {
    let currentChannel = null;
    let currentLength = null;
    source
        .on('readable', () => { // 1.
            let chunk;
            if (currentChannel === null) { // 2.
                chunk = source.read(1);
                currentChannel = chunk && chunk.readUInt8(0);
            }
            
            if (currentLength === null) { // 3.
                chunk = source.read(4);
                currentLength = chunk && chunk.readUInt32BE(0);
                if (currentLength === null) {
                    return;
                }
            }
            
            chunk = source.read(currentLength); // 4.
            if (chunk === null) {
                return;
            }
            
            console.log('Received packet from: ' + currentChannel);
            destinations[currentChannel].write(chunk); // 5.
            currentChannel = null;
            currentLength = null;
        })
        .on('end', () => { // 6.
            destinations.forEach(destination => destination.end());
            console.log('Source channel closed');
        });
}
```

1. non-flowing 모드를 사용하여 스트림을 읽는다.
2. 먼저 기존의 채널에 채널 ID가 없으면 스트림에서 1바이트를 읽고 숫자로 변환한다.
3. 다음은 데이터의 길이를 읽는 것이다. 이를 위해 4바이트가 필요한데, 가능성이 희박하지만 내부 버퍼에 충분한 데이터가 다 도달하지 않았을 수 있다. 이 경우 `this.read()` 호출은 null을 반환할 것이다. 이 경우에 구문 분석을 중단하고 다음 번 readable 이벤트에서 다시 시도하면 된다.
4. 데이터의 크기를 읽을 수 있게 되면, 내부 버퍼에서 가져올 데이터의 양을 알게 되므로 이를 모두 읽으려 시도한다.
5. 모두 데이터를 읽으면 올바른 대상 채널에 데이터를 쓸 수 있으며, currentChannel과 currentLength 변수를 초기화해야 한다.
6. 끝으로 소스 채널이 끝나면 모든 대상 채널을 종료한다.

```javascript
net.createServer(socket => {
    const stdoutStream = fs.createWriteStream('stdout.log');
    const stderrStream = fs.createWriteStream('stderr.log');
    demultiplexChannel(socket, [stdoutStream, stderrStream]);
}).listen(3000, () => console.log('Server started'));
```

1. 3000번 포트에 TCP 서버를 시작한다.
2. 수신한 각 연결에 대해 두 개의 다른 파일을 가리키는 2개의 Writable 스트림을 생성한다. 하나는 표준 출력용, 하나는 표준 오류용인데, 대상 채널이 된다.
3. 마지막으로 `demultiplexChannel()`을 사용하여 소켓 스트림을 stdoutStream과 stderrStream으로 역다중화한다.

#### 객체 스트림 다중화 및 역다중화

<p>
    앞선 예제들은 바이너리/텍스트 스트림을 다중화 및 역다중화하는 방법이며, 동일한 규칙이 객체 스트림에도 적용된다. 큰 차이점은 객체를 사용하면 원자 메시지를 사용하여 데이터를 전송하는 방법을 이미 가지고 있으므로 다중화하는 것은 객체 내 channelID 속성을 설정하는 것으로 간단하며, 역다중화는 단순히 channelID 속성을 읽고 각 객체를 해당 대상 스트림으로 라우팅하면 된다.
</p>

![6](https://user-images.githubusercontent.com/38815618/103668646-a96df880-4fba-11eb-9bb9-1e37910c43fe.PNG)

<p>
    역다중화를 위한 또 다른 패턴은 일부 조건에 따라 소스에서 오는 데이터를 라우팅하는 것으로 구성된다. 위 그림에서 묘사하고 있는 시스템에서 사용되는 디멀티플렉서는 동물을 가리키는 객체의 스트림을 가져와서 동물의 클래스에 따라 파충류, 양서류, 그리고 포유류의 해당 대상 스트림으로 각각 라우팅한다.
</p>
