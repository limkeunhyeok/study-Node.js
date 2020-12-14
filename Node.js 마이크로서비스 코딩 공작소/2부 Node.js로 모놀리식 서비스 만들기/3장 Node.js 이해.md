# 2부 Node.js로 모놀리식 서비스 만들기

## 3장 Node.js 이해

### 1. 비동기 프로그래밍

![1](https://user-images.githubusercontent.com/38815618/97133276-c8ffce00-178c-11eb-92a6-77874217f6c8.PNG)

<p>
    비동기 프로그래밍은 순차적으로 I/O를 처리하는 것이 아니라 I/O 처리 요청만 운영체제에 전달하고 CPU는 다른 연산을 수행한다. I/O 처리가 완료되면 운영체제에서 I/O 처리를 완료했다는 메시지를 전달받아 이후 작업을 처리하는 방식이다. I/O 처리 요청 순서와 별개로 처리를 완료하는 순서는 제각각이다. 따라서 개발자는 보장되지 않는 I/O 완료 처리를 고려해 프로그래밍 해야 한다. Node.js는 모든 함수와 모듈이 비동기 프로그래밍을 기본으로 한다.
</p>

```javascript
// nextTick을 사용한 비동기 프로그래밍
function func(callback) {
    // process.nextTick 함수는 특정 함수를 호출하기 전 CPU가 다른 높은 우선순위의 명령을 수행
    process.nextTick(callback, "callback!"); // nextTick을 사용해 인자 값으로 전달된 callback 함수 호출
}

try {
    func((param) => {
        a.a = 0; // 의도적으로 예외 발생
    });
} catch (e) {
    console.log("exception!"); // 같은 스레드일 경우 호출
}
```

<p>
    위의 코드의 목적은 'exception!'을 출력하는 것이다. 하지만 프로세스 실행 에러가 발생한다. `process.nextTick` 함수는 비동기 처리를 위해 Node.js 내부의 스레드 풀로 다른 스레드 위에서 콜백 함수로 동작한다. `try ... catch` 문은 같은 스레드 위에서만 동작하기 때문에 서로 다른 스레드 간의 예외 처리는 불가능하다.
</p>

### 2. 싱글 스레드 프로그래밍

<p>
    Node.js는 싱글 스레드 기반으로 동작한다. 단, 싱글 스레드라고 해서 모두 같은 스레드 위에서 동작하지 않는다.
</p>

```javascript
function func(callback) {
    process.nextTick(callback, "callback!");
}

try {
    func((param) => {
        a.a = 0;
    });
} catch (e) {
    console.log("exception!");
}

process.on("uncaughtException", (error) => {
    console.log("uncaughtException!!");
});
```

<p>
    위의 코드처럼 비동기 호출을 할 경우 함수를 호출한 영역과 콜백을 처리하는 영역이 각기 다른 스레드 위에서 동작한다. Node.js는 모든 스레드에서 예외 처리를 할 수 있도록 uncaughtException 이벤트를 제공한다. 따라서 위의 실행 결과 'uncaughtException!!'를 출력한다.
</p>

### 3. Node.js로 서버와 클라이언트 만들기

![2](https://user-images.githubusercontent.com/38815618/97133279-ca30fb00-178c-11eb-8c23-4ef40bea434b.PNG)

<p>
    네트워크 시스템에서 데이터를 요청하는 쪽을 클라이언트, 응답하는 쪽을 서버라고 한다. 일반적으로 사용자 영역에 가까울수록 클라이언트, 서비스를 제공하는 시스템 영역에 가까울수록 서버라고 할 수 있다. 하지만 사용자 영역 안에서도 서버와 클라이언트가 존재할 수 있고, 시스템 영역 안에서도 서버와 클라이언트 역활이 구분될 수 있다. 마이크로서비스는 기본적으로 서버이지만, 상황에 따라 클라이언트가 되기도 한다.
</p>

#### 3-1 HTTP 서버 만들기

```javascript
const http = require("http"); // http 모듈 로드

var server = http.createServer((req, res) => { // createServer 함수를 이용해 HTTP 서버 인스턴스 생성
    res.end("hello world!"); // hello world! 응답
});

server.listen(8000); // 8000번 포트 할당
```

#### 3-2 HTTP 클라이언트 만들기

```javascript
var http = require("http");

var options = { // 호출 페이지 정보 설정
    host: "127.0.0.1",
    port: 8000,
    path: "/"
};

var req = http.request(options, (res) => { // 페이지 호출
    var data = "";
    res.on('data', (chunk) => { // 서버가 보내는 데이터 수신
        data += chunk;
    });

    res.on('end', () => { // 수신 완료하면 화면에 출력
        console.log(data);
    });
});

req.end(); // 명시적 완료
```

#### 3-3 TCP 서버 만들기

<p>
    TCP는 연결 과정이 필요한 신뢰할 수 있는 통신에 사용되는 프로토콜로 HTTP도 TCP 기반으로 만든 프로토콜이다. Node.js는 net이라는 모듈을 제공하며, 네트워크에서 IPv6를 사용한다.
</p>

```javascript
var net = require("net"); // net 모듈 로드
var server = net.createServer((socket) => { // TCP 서버 생성
    socket.end("hello world!"); // 접속하면 hello world 응답
});

server.on('error', (err) => { // 네트워크 에러 처리
    console.log(err);
});

server.listen(9000, () => { // 9000번 포트 할당
    console.log('listen', server.address()); // 리슨이 가능해지면 화면에 출력
});
// 출력 결과
// listen { address: '::', family: 'IPv6', port: 9000 }
```

#### 3-4 TCP 클라이언트 만들기

<p>
    TCP 서버에 접속해 테스트하려면 HTTP와는 다르게 클라이언트를 직접 구현해서 테스트해야 한다.
</p>

```javascript
var net = require("net");
var options = { // 접속 정보 설정
    port: 9000,
    host: "127.0.0.1"
};
var client = net.connect(options, () => { // 서버 접속
    console.log("connected");
});

client.on('data', (data) => { // 데이터 수신 이벤트
    console.log(data.toString());
});

client.on('end', () => { // 접속 종료 이벤트
    console.log("disconnected");
});
// 출력 결과
// connected
// hello world!
// disconnected
```

### 4. 정리

#### 비동기 프로그래밍

- Node.js가 싱글 스레드 기반이라고 해서 모두 동일한 스레드 위에서 동작하지 않는다.
- process.nextTick 함수를 이용하면 CPU가 비동기적으로 동작한다.

#### HTTP 서버와 HTTP 클라이언트 만들기

- http 모듈을 이용해 손쉽게 HTTP 서버와 HTTP 클라이언트를 구현할 수 있다.
- http 모듈은 HTTP 프로토콜에서 이벤트 기반의 비동기 네트워크 통신을 지원한다.

#### TCP 서버와 TCP 클라이언트 만들기

- net 모듈을 이용해 손쉽게 TCP 서버와 TCP 클라이언트를 개발할 수 있다.
- net 모듈은 이벤트 기반의 비동기 소켓 통신을 지원한다.
