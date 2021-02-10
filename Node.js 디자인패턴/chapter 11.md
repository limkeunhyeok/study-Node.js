# Chapter 11 - 메시징과 통합 패턴

<p>
    확장성이 분할에 관한 것이라면, 시스템 통합은 다시 결합에 관한 것이다. 분산 어플리케이션을 통합하는데는 두 가지 주요 기술이 있다. 하나는 공유 저장 장치를 중앙 조정자로 사용하고 모든 정보를 보관하는 것이며, 다른 하나는 메시지를 사용하여 시스템 노드 전체에 데이터, 이벤트 및 명령을 전파하는 것이다. 이 마지막 옵션은 분산 시스템을 확장할 때 실제로 차이를 만드는 부분이며, 복잡하게 만드는 원인이 되기도 한다.
</p>

<p>
    메시지는 소프트웨어 시스템의 모든 계층에서 사용된다. 인터넷 상에서 의사 소통을 하기 위해 메시지를 교환하고, 파이프를 사용하여 서로 다른 프로세스로 정보를 전송하기 위해 메시지를 사용할 수 있으며, 어플리케이션 내에서 직접적인 함수 호출의 대안으로 메시지를 사용할 수 있으며, 또한 장치 드라이버는 하드웨어와 통신하기 위해 메시지를 사용한다. 하지만 분산형 아키텍처를 다루는 경우 메시징 시스템이라는 용어는 네트워크를 통한 정보 교환을 용이하게 하기 위한 솔루션, 패턴 및 일련의 아키텍처를 말하는데 사용된다.
</p>

## 1. 메시징 시스템의 기본 사항

<p>
    메시지 및 메시징 시스템에 대해 이야기할 때 고려해야 할 4가지 기본요소는 다음과 같다.
</p>

- 단방향 또는 요청/응답 교환할 수 있는 통신의 방향
- 내용을 결정하는 메시지의 목적
- 즉시 또는 나중에(비동기식으로) 전송 및 수신할 수 있는 메시지 타이밍
- 직접 또는 브로커를 통해 발생할 수 있는 메시지의 전달

### 1-1 단방향 및 요청/응답 턴

![1](https://user-images.githubusercontent.com/38815618/106851182-1d560a80-66f9-11eb-879e-1fdcbe6bc970.PNG)

<p>
    단방향 통신의 일반적인 예로는 WebSocket을 사용하여 연결된 브라우저에 메시지를 보내는 이메일, 웹 서버 또는 일련의 작업자들에게 작업을 배포하는 시스템이 있다.
</p>

![2](https://user-images.githubusercontent.com/38815618/106851184-1deea100-66f9-11eb-9735-1a53527983cd.PNG)

<p>
    요청/응답 패턴의 일반적인 예로는 웹 서비스 호출이 있다. 구현하기 쉬운 패턴처럼 보일 수 있지만, 통신이 비동기이거나 여러 개의 노드가 포함되어 있으면 복잡해진다.
</p>

![3](https://user-images.githubusercontent.com/38815618/106851174-1b8c4700-66f9-11eb-987b-6a474c539b63.PNG)

<p>
    구성된 모든 노드 사이의 통신 방향을 관찰해보면 단방향이라고 볼 수 있지만, 전체 관점에서 볼 때 시작점에서 요청을 보내고 다른 노드로부터 응답을 받는다.
</p>

### 1-2 메시지 유형

<p>
    일반적으로 메시지의 목적에 따라 다음 세 가지 유형의 메시지를 식별할 수 있다.
</p>

- 명령 메시지
- 이벤트 메시지
- 도큐먼트 메시지

#### 명령 메시지(Command Message)

<p>
    이 메시지 유형의 목적은 수신 측에서 어떤 동작이나 작업을 수행하도록 하는 것이다. 이를 가능하게 하기 위해선 메시지에는 작업을 실행하는데 필요한 연산 명청, 실행에 주어지는 인자 값들과 같은 기본적인 정보를 가지고 있어야 한다. 명령 메시지는 원격 프로시저 호출(RPC) 시스템, 분산된 연산 수행, 간단하게는 데이터를 요청하는데 사용할 수 있다.
</p>

#### 이벤트 메시지(Event Message)

<p>
    이벤트 메시지는 다른 컴포넌트에 무엇인가가 발생했음을 알리는데 사용된다. 일반적으로 이벤트의 유형을 포함하며 컨텍스트, 주제 또는 관련된 수행자와 같은 세부적인 정보도 포함된다. 브라우저에서 롱 폴링(long polling)이나 WebSocket을 통하여 데이터가 변경되거나 일반적인 시스템의 상태가 변화되었을 때 서버로부터 알림을 받기 위해 이벤트 메시지를 사용한다. 이벤트의 사용은 시스템의 모든 노드를 동일한 페이지에서 유지할 수 있도록 하기 때문에 분산 어플리케이션에서 매우 중요한 통합 메커니즘이다.
</p>

#### 도큐먼트 메시지(Document Message)

<p>
    도큐먼트 메시지는 기본적으로 컴포넌트와 시스템 간의 데이터 전송을 의미한다. 도큐먼트가 명령과 구별되는 주요 특징은 수신자에게 데이터를 어떻게 처리할지 알려주는 정보가 메시지에 포함되어 있지 않다는 것이다. 다른 한편으로 이벤트 메시지와 주요한 차이는 주로 발생한 특정한 사건과 연관서잉 없다는 것이다. 일반적으로 명령 메시지에 대한 응답에는 요청된 데이터 또는 작업의 결과만 포함되므로 도큐먼트 메시지인 경우가 많다.
</p>

### 1-3 비동기 메시징 및 큐

<p>
    비동기 통신은 SMS와 비슷하다. 전송할 대 받는 사람을 네트워크에 연결할 필요가 없으며, 즉시 또는 일정 지연 후 응답을 받거나 전혀 응답을 받지 못할 경우도 있다. 여러 수신자에게 여러 개의 SMS를 차례로 보내고 응답하는 순서와 상관없이 응답을 받을 수 있다. 즉, 더 적은 리소스를 사용하고 더 나은 병렬 처리를 수행할 수 있다.
</p>

<p>
    비동기 통신의 또 다른 중요한 이점은 메시지를 저장한 후, 가능한 빨리 또는 일정 지연 후에 전달할 수 있다는 것이다. 이는 수신자가 새로운 메시지를 처리하기에 너무 바쁘거나 메시지 전달을 보장하고자 할 때 유용할 수 있다. 메시징 시스템에서는 다음 그림과 같이 보낸 사람과 받는 사람 간의 통신을 중재하고 메시지가 대상에 전달되기 전에 메시지를 저장하는 컴포넌트인 메시지 큐를 사용하여 이러한 작업을 수행할 수 있다.
</p>

![4](https://user-images.githubusercontent.com/38815618/106851176-1cbd7400-66f9-11eb-8dd6-3ab6f3604abc.PNG)

<p>
    어떠한 이유에서든 수신자가 충돌하거나 네트워크 연결이 끊어지거나 속도가 느려지는 경우, 메시지는 대기열에 쌓이고 수신자가 온라인 상태가 되어 정상화되는 즉시 발송된다. 대기열은 발신자에 위치하거나, 발신자와 수신자 간에 분리되어 위치하거나, 통신의 미들웨어 역활을 하는 외부의 전용 시스템에 존재할 수도 있다.
</p>

### 1-4 피어 투 피어 또는 브로커 기반 메시징

<p>
    메시지는 수신자에게 직접 P2P 방식으로 또는 메시지 브로커라는 중앙 중계 시스템을 통해 수신자에게 직접 전달될 수 있다. 브로커의 주된 역활은 메시지 수신자를 발신자로부터 분리하는 것이다.
</p>

![5](https://user-images.githubusercontent.com/38815618/106851179-1cbd7400-66f9-11eb-8a08-8dd2fa0813d5.PNG)

<p>
    피어-투-피어 아키텍처에서 모든 노드는 메시지를 수신자에게 직접적으로 전달한다. 이는 노드가 수신자의 주소와 포트를 알아야 하고 프로토콜과 메시지 형식을 이해하고 있어야 함을 의미한다. 브로커는 이러한 복잡성을 제거한다. 각 노드는 완전히 독립적일 수 있고, 세부 정보를 직접 알지 못하더라도 정의되지 않은 수 많은 피어들과 통신할 수 있다. 또한 브로커는 다른 통신 프로토콜 간의 브리지 역활을 할 수도 있다.
</p>

<p>
    디커플링 및 상호 운용성 외에도 브로커는 많은 브로커가 즉시 지원할 수 있는 광범위한 메시징 패턴을 굳이 언급하지 않고도 영구적인 큐(persistent queues), 라우팅(routing), 메시지 변환 및 모니터링과 같은 고급 기능을 제공할 수 있다. 물론, 피어-투-피어 아키텍처를 사용하여 이러한 모든 기능을 구현하는 것을 막을 수는 없지만, 불행히도 훨씬 더 많은 노력이 필요하다. 그럼에도 불구하고 브로커를 피해야 하는 몇 가지 이유가 있다.
</p>

- 단일 장애 지점의 제거
- 브로커는 확장해야 하는 반면, 피어-투-피어 아키텍처에서는 단일 노드만 확장하면 된다.
- 브로커 없이 메시지를 교환하면 전송 대기 시간을 크게 줄일 수 있다.

## 2. 게시/구독 패턴

<p>
    이 패턴은 일련의 구독자가 특정 카테고리의 메시지를 수신하기 위해 구독을 등록한다. 반면 게시자는 모든 관련 구독자에게 배포되는 메시지를 생성한다.
</p>

![1](https://user-images.githubusercontent.com/38815618/107109097-a3508d80-6880-11eb-9099-d29217c596d2.PNG)

<p>
    pub/sub는 게시자가 메시지의 수신자가 누구인지 미리 알 필요가 없다. 특정 메시지를 받기 위해서는 구독자가 자신의 관심사를 등록해야 하므로 게시자는 알 수 없는 수의 수신자와 함께 작업할 수 있다. 즉, 게시/구독 패턴의 양쪽이 느슨하게 결합되어 있으므로 진화하는 분산 시스템의 노드를 통합하는데 이상적이다.
</p>

<p>
    브로커가 존재하면 구독자가 메시지의 게시자인 노드를 알지 못해 브로커와만 상호작용하기 때문에 시스템 노드 간의 분리가 더욱 개선된다. 또한, 브로커는 메시지 큐 시스템을 제공하여 노드 간의 연결 문제가 있는 경우에도 안정적인 전달을 보장한다.
</p>

### 2-1 간단한 실시간 채팅 어플리케이션 만들기

#### 서버 측 구현

```javascript
// app.js
const WebSocketServer = require('ws').Server;

// 정적 파일을 서비스하는 서버
const server = require('http').createServer( // 1.
    require('ecstatic')({root: `${__dirname}/www`})
);

const wss = new WebSocketServer({server: server}); // 2.
wss.on('connection', ws => {
    console.log('Client connected');
    ws.on('message', msg => { // 3.
        console.log(`Message: ${msg}`);
        broadcast(msg);
    });
});

function broadcast(msg) { // 4.
    wss.clients.forEach(client => {
        client.send(msg);
    });
}

server.listen(process.argv[2] || 8080);
```

1. 먼저 HTTP 서버를 만들고 정적 파일을 제공하기 위해 ecstatic이라는 미들웨어를 추가한다. 이는 어플리케이션의 클라이언트에서 필요로 하는 리소스들을 제공하는데 필요하다.
2. WebSocket 서버의 새 인스턴스를 만들고 이를 기존의 HTTP 서버에 연결한다. 그런 다음, 연결 이벤트에 대한 이벤트 리스너를 첨부하여 들어오는 WebSocket 연결에 대기한다.
3. 새로운 클라이언트가 서버에 연결될 때마다 수신 메시지로 전달되는 메시지를 듣기 시작한다. 새 메시지가 도착하면 연결된 모든 사용자에게 전파한다.
4. `broadcast()` 함수는 연결된 모든 클라이언트에 대해 `send()` 함수를 호출하는 단순한 반복을 수행한다.

#### 클라이언트 측 구현

```html
<!DOCTYPE html>
<html>
    <head>
        <script>
            var ws = new WebSocket('ws://' + window.document.location.host);
            ws.onmessage = function(message) {
                var msgDiv = document.createElement('div');
                msgDiv.innerHTML = message.data;
                document.getElementById('messages').appendChild(msgDiv);
            };
        
            function sendMessage() {
                var message = document.getElementById('msgBox').value;
                ws.send(message);
            }
        </script>
    </head>
    <body>
        Messages:
        <div id='messages'></div>
        <input type='text' placeholder='Send a message' id='msgBox'>
        <input type='button' onclick='sendMessage()' value='Send'>
    </body>
</html>
```

#### 채팅 어플리케이션 실행 및 확장

<p>
    한 인스턴스에서 채팅 메시지를 보낼 때, 메시지를 로컬로 브로드캐스트하여 특정 서버에 연결된 클라이언트들에게만 메시지를 전파한다. 실제로 두 서버는 서로 통신하지 않는다. 앞으로 이 두 서버를 통합해야 한다.
</p>

### 2-2 메시지 브로커로 Redis 사용하기

<p>
    Redis는 메시지 브로커라기 보다는 데이터베이스이다. 하지만 많은 기능 중에서 중앙 집중식 게시/구독 패턴을 구현하도록 특별하게 설계된 명령 쌍이 존재한다.
</p>

<p>
    Redis는 캐싱 서버나 세션 저장소와 같은 기존 인프라에서 사용할 수 있다. 속도와 유연성은 분산 시스템에서 데이터를 공유하기 위한 매우 보편적인 선택 기준이다. 따라서 프로젝트에서 구독/게시를 위한 브로커가 필요할 경우, 가장 간단하고 즉각적인 선택은 Redis 자체를 재사용하여 전용 메시지 브로커를 설치하고 유지 관리할 필요가 없도록 하는 것이다.
</p>

<p>
    앞으로 예제는 Redis를 메시지 브로커로 사용하여 채팅 서버를 통합한다. 각 인스턴스는 클라이언트에서 수신한 메시지를 브로커에 게시하는 동시에 다른 서버 인스턴스에서 오는 모든 메시지를 구독한다. 아키텍처의 각 서버는 구독자이면서 게시자이다.
</p>

![2](https://user-images.githubusercontent.com/38815618/107109098-a481ba80-6880-11eb-863d-22b144a1058c.PNG)

1. 메시지는 웹 페이지의 텍스트 상자에 입력되어 연결된 채팅 서버의 인스턴스로 전송된다.
2. 그런 다음 메시지가 브로커에 게시된다.
3. 브로커는 모든 가입자에게 메시지를 발송한다. 예제의 아키텍청에서는 채팅 서버의 모든 인스턴스가 대상이다.
4. 각 인스턴스에서 메시지는 연결된 모든 클라이언트에 전파된다.

```javascript
const WebSocketServer = require('ws').Server;
const redis = require("redis"); // 1.
const redisSub = redis.createClient();
const redisPub = redis.createClient();

// 정적 파일을 서비스하는 서버
const server = require('http').createServer(
    require('ecstatic')({root: `${__dirname}/www`})
);

const wss = new WebSocketServer({server: server});
wss.on('connection', ws => {
    console.log('Client connected');
    ws.on('message', msg => {
        console.log(`Message: ${msg}`);
        redisPub.publish('chat_messages', msg); // 2.
    });
});

redisSub.subscribe('chat_messages'); // 3.
redisSub.on('message', (channel, msg) => {
    wss.clients.forEach((client) => {
        client.send(msg);
    });
});

server.listen(process.argv[2] || 8080);
```

1. Node.js 어플리케이션을 Redis 서버에 연결하기 위해 사용 가능한 모든 Redis 명령을 지원하는 완전한 클라이언트인 Redis 패키지를 사용한다. 다음으로 두 개의 다른 연결을 인스턴스화 한다. 하나는 채널을 구독하고, 다른 하나는 메시지를 게시하는데 사용한다. Redis에서는 연결이 구독자 모드로 설정되면 구독과 관련된 명령만 사용할 수 있기 때문에 이 작업이 필요하다. 즉, 메시지 게시를 위해 두 번째 연결이 필요하다.
2. 연결된 클라이언트에서 새 메시지를 받으면 chat_messages 채널에 메시지를 게시한다. 서버가 동일한 채널에 가입되어 있어, Redis를 통해 다시 돌아올 것이기 때문에 메시지를 클라이언트에게 직접 브로드캐스트 하지 않는다.
3. 서버는 chat_messages 채널에도 가입해야 하므로, 현재 서버 또는 다른 대화 서버에서 해당 채널로 게시된 모든 메시지를 수신하도록 리스너를 등록한다. 메시지가 수신되면 현재 WebSocket 서버에 연결된 모든 클라이언트에 메시지를 브로드캐스트 한다.

### 2-3 ØMQ를 사용한 피어 투 피어 게시/구독

#### ØMQ 소개

<p>
    ØMQ는 다양한 메시징 패턴을 구축할 수 있는 기본적인 도구를 제공하는 네트워킹 라이브러리이다. 이 API는 저수준이면서 매우 빠른 최소한의 API를 가지고 있지만 원자 메시지, 로드 밸런싱, 큐 등과 같은 메시징 시스템의 모든 기본 구성 요소들을 제공한다. 또한, 전통적인 TCP, 프로세스 내 채널, 프로세스 간 통신, PGM 프로토콜을 사용한 멀티캐스팅을 지원한다.
</p>

#### 채팅 서버를 위한 피어-투-피어 아키텍처 설계

<p>
    아키텍처에서 브로커를 제거할 때, 채팅 어플리케이션의 각 인스턴스는 게시하는 메시지를 수신하기 위해 다른 사용 가능한 인스턴스에 직접 연결해야 한다. ØMQ에는 PUB와 SUB라는 두 가지 유형의 소켓이 있다. 일반적인 패턴은 PUB 소켓을 다른 SUB 소켓에 대한 요청 수신을 대기하는 포트에 바인딩하는 것이다.
</p>

<p>
    구독은 SUB 소켓으로 배달되는 메시지를 지정하는 필터를 가질 수 있다. 필터는 간단한 바이너리 버퍼이므로 메시지의 시작 부분과 일치하게 된다. 메시지가 PUB 소켓을 통해 전송되면 메시지는 연결된 모든 SUB 소켓으로 브로드캐스트 되지만, 구독 필터가 적용된 후에만 브로드캐스트 된다. 필터는 TCP와 같이 연결 프로토콜을 사용하는 경우에만 게시자 측에 적용된다.
</p>

![1](https://user-images.githubusercontent.com/38815618/107121825-d5410e80-68d7-11eb-92ba-d4b6f8de05d1.PNG)

<p>
    위의 그림에서 인스턴스가 두 개인 경우의 흐름을 보여주지만, 동일한 개념을 N개의 인스턴스에 적용할 수 있다. 아키텍처는 필요한 모든 연결을 설정할 수 있도록 각 노드가 시스템의 다른 노드를 인식해야 한다는 것을 보여준다. 또한 구독이 SUB 소켓에서 PUB 소켓으로 이동하는 동안 메시지가 반대 방향으로 이동하는 것을 보여준다.
</p>

#### ØMQ PUB/SUB 소켓 사용하기

```javascript
// app.js에서 추가된 부분들
// ...
const args = require('minimist')(process.argv.slice(2)); // 1.
const zmq = require('zmq');

// ...

const pubSocket = zmq.socket('pub'); // 2.
pubSocket.bind(`tcp://127.0.0.1:${args['pub']}`);

const subSocket = zmq.socket('sub'); // 3.
const subPorts = [].concat(args['sub']);
subPorts.forEach(p => {
    console.log(`Subscribing to ${p}`);
    subSocket.connect(`tcp://127.0.0.1:${p}`);
});
subSocket.subscribe('chat');

// ...

wss.on('connection', ws => {
    console.log('Client connected'); 
    ws.on('message', msg => { // 4.
        console.log(`Message: ${msg}`);
        broadcast(msg);
        pubSocket.send(`chat ${msg}`);
    });
});

// ...

subSocket.on('message', msg => { // 5.
    console.log(`From other server: ${msg}`);
    broadcast(msg.toString().split(' ')[1]);
});

server.listen(args['http'] || 8080);
```

1. 기본적으로 ØMQ 기본 라이브러리에 대한 Node.js 바인딩인 zmq 패키지가 필요하다. 또한 커맨드라인의 인자들을 파싱하는 minimists를 require한다. 이름을 가진 인자들을 쉽게 받아들이기 위한 것이다.
2. 즉시 PUB 소켓을 만들고 커맨드 라인의 --pub 인수에 제공된 포트에 바인드한다.
3. SUB 소켓을 만들고, 이를 어플리케이션의 다른 인스턴스의 PUB 소켓에 연결한다. 대상 PUB 소켓의 포트는 커맨드 라인 --sub 인자에 제공된다. 그런 다음, 채팅을 필터로 제공함으로써 실제 구독을 생성한다. 즉, chat으로 시작되는 메시지만 수신하게 된다.
4. WebSocket에서 새 메시지를 받으면 연결된 모든 클라이언트에 브로드캐스트 하지만 PUB 소켓을 통해서도 게시된다. 공백이 뒤따르는 접두어로 chat을 사용하므로 chat을 필터로 사용하여 모든 구독자에게 메시지가 게시된다.
5. SUB 소켓에 도착하는 메시지를 듣기 시작한다. 메시지의 간단한 구문 분석을 통해 chat 접두어를 제거한 후 현재 WebSocket 서버에 연결된 모든 클라이언트로 브로드캐스트 한다.

```bash
# 실행
node app --http 8080 --pub 5000 --sub 5001 --sub 5002
node app --http 8081 --pub 5001 --sub 5000 --sub 5002
node app --http 8082 --pub 5002 --sub 5000 --sub 5001
```

<p>
    첫 번째 명령은 포트 8080에서 수신 중인 HTTP 서버로 인스턴스를 시작하고 포트 5000번을 PUB 소켓으로 바인딩한다. 또 SUB 소켓을 다른 두 인스턴스의 PUB 소켓인 5001, 5002에 연결한다. 다른 두 명령도 비슷한 방식으로 동작한다.
</p>

<p>
    살펴볼 수 있는 첫 번째 현상은 SUB 소켓을 연결할 PUB 소켓에 문제가 있어도 ØMQ는 문제를 발생시키지 않는다. 예를 들어, 첫 번째 명령을 수행할 때 포트 5001 및 5002에서 아무도 수신 대기를 하고 있지 않지만, ØMQ는 에러를 발생시키지 않는다. 이는 ØMQ가 일정 시간 간격으로 포트에 대한 연결을 자동으로 시도하는 재연결 메커니즘을 가지고 있기 때문이다. 이 기능은 노드가 다운되거나 다시 시작될 때 특히 유용하다. PUB 소켓에서도 동일한 논리가 적용된다. 구독이 없으면 모든 메시지가 삭제되지만 동작은 계속한다.
</p>

### 2-4 영구 구독자(Durable subscribers)

<p>
    메시징 시스템에서 중요한 추상화는 메시지 큐(MQ)이다. 메시지 큐의 경우, 대기열 시스템은 수신자들이 메시지를 수신할 수 있을 때까지 메시지들을 저장하므로 메시지 발신자와 메시지 수신자가 반드시 동시에 활성화되고 연결될 필요가 없다. 이 동작은 구독자가 메시지 시스템에 연결된 동안에만 메시지를 수신할 수 있는 설정후 잊어버리기(set and forget) 패러다임과 반대되는 것이다.
</p>

<p>
    항상 안정적으로 모든 메시지를 수신할 수 있는 구독자, 심지어 수신하지 않을 때도 메시지가 전송되는 구독자를 영구 구독자라고 한다. 영구 구독자를 허용하려면 시스템이 구독자의 연결이 끊어진 동안 메시지를 대기열에 축적해야 한다. 대기열은 메시지를 메모리에 저장하거나 디스크에 유지함으로써 브로커가 다시 시작되거나 충돌한 경우에도 메시지를 복구할 수 있다.
</p>

![2](https://user-images.githubusercontent.com/38815618/107121828-d5410e80-68d7-11eb-9548-896383cfff84.PNG)

#### AMQP 소개

<p>
    메시지 대기열은 일반적으로 메시지를 분실하면 안되는 상황에서 사용되는데, 여기에는 은행 또는 금융 시스템과 같은 중요한 업무용 어플리케이션이 포함된다. AMQP는 많은 메시지 대기열 시스템에서 지원하는 개방형 표준 프로토콜이다. 일반적인 통신 프로토콜을 정의하는 것 외에도 라우팅, 필터링, 대기열 처리, 안정성 및 보안을 묘사하는 모델들을 제공한다. AMQP에는 다음 세 가지 필수 컴포넌트가 있다.
</p>

1. 대기열(Queue): 클라이언트가 사용하는 메시지를 저장하는 데이터 구조로, 대기열의 메시지들은 본질적으로 어플리케이션에 있는 하나 이상의 사용자에게 푸시된다. 여러 사용자가 동일한 대기열에 연결되어 있을 경우, 메시지는 이들에게 로드 밸런스된다. 대기열은 다음 중 하나 일 수 있다.
   - 영구적(Durable) 큐: 브로커가 다시 시작되면 대기열이 자동으로 다시 만들어진다. 영구적 대기열이라는 말은 모든 콘텐츠가 보존된다는 의미가 아니다. 실제로 영구적(persistent)으로 표시된 메시지만 Disk에 저장되고 재시작 시 복원된다.
   - 독점적(Exclusive) 큐: 이는 큐가 하나의 특정 구독자 연결에만 바인딩됨을 의미한다. 연결이 닫히면 대기열이 소멸된다.
   - 자동 삭제(Auto-delete) 큐: 마지막 구독자의 연결이 끊어지면 대기열이 삭제된다.
2. 교환기(Exchange): 여기에 메시지가 게시된다. 교환기를 실행하는 알고리즘에 따라 메시지를 하나 이상의 대기열로 라우팅한다.
   - 직접 교환기(Direct Exchange): 전체 라우팅 키를 일치시켜 메시지를 라우팅한다.
   - 토픽 교환기(Topic Exchange): 라우팅 키와 일치하는 glob-like 패턴을 사용하여 메시지를 배분한다.
   - 팬아웃 교환기(Fanout Exchange): 제공된 모든 라우팅 키를 무시하고 연결된 모든 대기열에 메시지를 브로드캐스트한다.
3. 바인딩(Binding): 교환기와 대기열 간의 연결이다. 이는 또한 교환기에서 도착한 메시지를 필터링하는데 사용되는 라우팅 키 또는 패턴을 정의한다.

<p>
    이러한 컴포넌트들은 브로커에서 관리하며, 브로커는 브로커를 만들고 조작하기 위한 API를 제공한다. 브로커에 연결할 때 클라이언트는 브로커와 통신 상태를 유지 관리하는 채널을 생성하여 연결을 추상화한다.
</p>

![3](https://user-images.githubusercontent.com/38815618/107121829-d5d9a500-68d7-11eb-8e27-dcc913e907f8.PNG)

#### AMQP 및 RabbitMQ의 영구 가입자

<p>
    메시지를 잃지 않는 것이 중요한 전형적인 시나리오는 마이크로 서비스 아키텍처의 여러 서비스를 동기화 상태로 유지하려는 경우이다. 브로커를 사용하여 모든 서비스를 동일한 페이지에 보관하려면 정보를 잃지 않는 것이 중요하다. 그렇지 않으면 일관성 없는 상태가 될 수 있다.
</p>

##### 채팅 어플리케이션의 히스토리 서비스 설계하기

<p>
    앞으로 데이터 베이스에 채팅 메시지를 저장하는 히스토리 서비스를 추가하여 클라이언트가 연결될 때 서비스를 쿼리하고 전체 채팅 기록을 검색할 수 있도록 할 것이다. RabbitMQ 브로커와 AMQP를 사용하여 채팅 서비스와 히스토리 서비스를 통합할 예정이며, 다음 그림은 계획한 아키텍처를 보여준다.
</p>

![4](https://user-images.githubusercontent.com/38815618/107121822-d40fe180-68d7-11eb-8862-ce5a9c5e8a70.PNG)

<p>
    단일 팬아웃 교환기를 사용하며, 특정 라우팅이 필요하지 않으므로 시나리오가 복잡한 것은 아니다. 다음으로, 채팅 서버의 각 인스턴스에 대해 하나의 대기열을 생성한다. 이 대기열은 독점적 큐이다. 채팅 서버가 오프라인일 때는 부재 중 메시지를 수신하는 것에 관심이 없다. 이는 히스토리 서비스의 역할이며, 저장된 메시지에 대해 더 복잡한 쿼리를 구현할 수도 있다. 실제로 이는 채팅 서버가 영구 가입자가 아니며, 연결이 닫히자마자 대기열이 삭제된다는 것을 의마한다.
</p>

<p>
    반대로 히스토리 서비스는 어떤 메시지도 잃어서는 안된다. 그렇지 않으면 히스토리 서비스의 목적이 무의미하기 때문이다. 히스토리 서비스가 연결 해제된 동안 발행된 모든 메시지는 대기열에 보관되어 온라인으로 돌아올 때 전달되도록 내구성을 유지해야 한다.
</p>

##### AMQP를 사용하여 신뢰성 있는 히스토리 서비스 구현

<p>
    모듈은 채팅 기록을 클라이언트에 노출시키는 HTTP 서버와 채팅 메시지 캡처 및 로컬 데이터베이스에 저장하는 AMQP 소비자로 구성된다.
</p>

```javascript
// historySvc.js
const level = require('level');
const timestamp = require('monotonic-timestamp');
const JSONStream = require('JSONStream');
const amqp = require('amqplib');
const db = level('./msgHistory');

require('http').createServer((req, res) => {
    res.writeHead(200);
    db.createValueStream()
        .pipe(JSONStream.stringify())
        .pipe(res);
}).listen(8090);

let channel, queue;
amqp
    .connect('amqp://localhost') // 1.
    .then(conn => conn.createChannel())
    .then(ch => {
        channel = ch;
        return channel.assertExchange('chat', 'fanout'); // 2.
    })
    .then(() => channel.assertQueue('chat_history')) // 3.
    .then((q) => {
        queue = q.queue;
        return channel.bindQueue(queue, 'chat'); // 4.
    })
    .then(() => {
        return channel.consume(queue, msg => { // 5.
            const content = msg.content.toString();
            console.log(`Saving message: ${content}`);
            db.put(timestamp(), content, err => {
                if (!err) channel.ack(msg);
            });
        });
    })
    .catch(err => console.log(err));
```

1. 먼저 AMQP 브로커와의 연결을 수립한다. 예제의 경우에는 RabbitMQ를 사용한다. 그런 다음, 커뮤니케이션 상태를 유지할 세션과 비슷한 채널을 만든다.
2. 다음으로 chat이라는 이름의 교환기를 설정한다. 이는 팬아웃 교환기이다. `assertExchange()` 명령은 브로커에 교환기가 있는지 확인하는 것이다. 존재하지 않으면 브로커가 만든다.
3. chat_history라는 대기열을 만든다. 기본적으로 큐는 내구성을 가진다. 독점적이지 않고 자동 삭제 큐가 아니므로 영구 구독자를 지원하기 위해 추가적인 옵션을 전달할 필요가 없다.
4. 다음으로 이전에 생성한 교환기에 대기열을 바인딩한다. 여기서 교환기는 팬아웃 유형의 교환기로 필터링을 수행하지 않는다. 따라서 라우팅 키 혹은 패턴과 같이 특정한 다른 옵션이 필요하지 않는다.
5. 마지막으로, 방금 작성한 대기열에서 오는 메시지를 수신한다. 예제는 수신한 모든 메시지를 키로 단순한 타임스탬프를 사용하여 LevelDB 데이터베이스에 저장함으로써 메시지를 날짜 별로 정렬한다. `channel.ack(msg)`를 사용하여 모든 메시지를 승인하고 메시지가 데이터베이스에 성공적으로 저장된 후에만 볼 수 있다. 브로커에서 ACK(수신확인)를 받지 못하면 메시지가 다시 처리될 수 있도록 대기열에 보관한다. 이는 서비스의 신뢰성을 완전히 새로운 차원으로 끌어 올린 AMQP의 또 다른 놀라운 기능이다. 명시적인 확인 응답을 보내지 않으려면 {noACK:true} 옵션을 `channel.consume()` API에 전달하면 된다.

##### AMQP와 채팅 어플리케이션 통합

```javascript
// app.js

// ...
    .then(() => {
        return channel.assertQueue(`chat_srv_${httpPort}`, {exclusive: true});
    })
// ...
    ws.on('message', msg => {
        console.log(`Message: ${msg}`);
        channel.publish('chat', '', new Buffer(msg));
    });
// ...
```

<p>
    채팅 서버는 영구 구독자일 필요는 없으며 설정 및 패러다임으로도 충분하다. 따라서 대기열을 생성할 때 {exclusive:true} 옵션을 전달하면, 대기열의 범위가 현재 연결로 지정되므로 채팅 서버가 종료되는 즉시 삭제된다. 새 메시지를 게시하는 것은 단순히 대상 교환기(chat)와 라우팅 키를 지정하면 된다. 예제는 팬아웃 교환기를 사용하기 때문에 이 경우에는 비어('')있다.
</p>

## 3. 파이프라인 및 작업 배포 패턴

![1](https://user-images.githubusercontent.com/38815618/107515853-f0b95b80-6bee-11eb-9c52-3bc89dd997eb.PNG)

<p>
    위 그림에서 여러 작업자가 동일한 작업을 받는 것을 절대 원치 않기 때문에 이러한 유형의 어플리케이션에서 게시/구독 패턴은 적합하지 않다. 대신 필요한 것은 각 메시지를 다른 소비자에게 보내는 로드 밸런서와 유사한 메시지 배포 패턴이다. 메시징 시스템 용어로, 이 패턴은 경쟁 소비자(competing consumers), 팬아웃 배포(fanout distribution) 또는 환풍기(ventilator) 패턴으로 알려져 있이다.
</p>

<p>
    HTTP 로드 밸런서와의 한 가지 중요한 차이점은 여기서는 소비자의 역할이 보다 활발하다는 것이다. 대부분의 경우 소비자와 연결되는 것은 생산자가 아니라 소비자 자신이 새로운 작업을 얻기 위해 작업 생산자나 작업 대기열에 연결된다. 이는 생산자를 수정하거나 서비스 레지스트리를 채택하지 않고도 작업자의 수를 원활하게 늘릴 수 있다는 점에서 확장 가능한 시스템으로 큰 장점이다.
</p>

<p>
    일반적인 메시징 시스템에서 반드시 생산자와 작업자간에 요청/응답 통신을 할 필요는 없다. 대신 대부분의 경우 선호되는 접근 방식은 일방적인 비동기 통신을 사용하는 것인데, 이를 병렬 처리와 확장성이 향상된다. 이러한 아키텍처에서 메시지는 잠재적으로 항상 한 방향으로만 전달되어 아래의 그림에 표시된 파이프라인을 생성할 수 있다.
</p>

![2](https://user-images.githubusercontent.com/38815618/107515854-f151f200-6bee-11eb-8740-78517ac66794.PNG)

<p>
    파이프라인을 사용하면 동기식 요청/응답 통신에 대한 부담 없이 매우 복잡한 프로세스가 가능한 아키텍처를 구축할 수 있으므로 대기 시간이 짧아지고 처리량이 높아지는 경우가 많다. 위 그림에서 메시지를 일련의 작업자들에 배포하고(팬아웃) 다른 처리 장치로 전달한 다음, 일반적으로 싱크로 표현되는 단일 노드로 취합하는(팬인) 방법을 볼 수 있다.
</p>

### 3-1 ØMQ 팬아웃/팬인 패턴

#### PUSH/PULL 소켓

<p>
    PUSH 소켓은 메시지를 전송하기 위한 것이고 PULL 소켓은 수신용이다.
</p>

- 둘 다 연결 모드 혹은 바인드 모드에서 동작할 수 있다. 즉, PUSH 소켓을 만들어 PULL 소켓에서 들어오는 연결을 청취하는 로컬 포트에 바인딩하거나 PULL 소켓에서 PUSH 소켓의 연결을 수신하도록 할 수 있다. 메시지는 항상 PUSH에서 PULL까지 동일한 방향으로 이동한다. 유일하게 다른 부분은 연결은 초기화하는 부분이다. 바인드 모드는 작업 생성자와 싱크 같은 영구적인 노드에 최적의 솔루션이지만, 연결 모드는 작업자와 같은 임시노드에 적합하다. 따라서 내구성이 높은 노드에 영향을 주지 않고 일시적인 노드의 수를 임의로 변경할 수 있다.
- 하나의 PUSH 소켓에 여러 개의 PULL 소켓이 연결되어 있으면 메시지가 모든 PULL 소켓에 균등하게 배분된다. 실제로는 부하가 분산된다(peer-to-peer load balancing). 한편, 여러 PUSH 소켓에서 메시지를 수신하는 PULL 소켓은 공정한 대기열 시스템을 사용하여 메시지들을 처리한다. 즉, 인바운드 메시지에 라운드 로빈을 적용하여 모든 소스에서 메시지들을 균일하게 소비한다.
- 연결된 PULL 소켓이 없는 PUSH 소켓을 통해 전송된 메시지들은 사라지지 않는다. 대신 노드가 온라인 상태가 되어 메시지를 가져가기 시작할 때까지 생성자의 큐에 대기한다.

#### ØMQ를 사용한 분산된 해시섬 크래커 만들기

<p>
    해시섬 크래커(hashsum cracker)는 주어진 알파벳 문자의 가능한 모든 변형에 주어진 해시(MD5, SHA1 등)를 일치시키기 위해 전수 공격(brute-force) 기술을 사용하는 시스템이다. 이는 병렬 파이프라인의 강력함을 보여주는 예제로 완벽한 과도한 병렬 작업 부하(embarrassingly parallel workload) 문제라도고 한다.
</p>

![3](https://user-images.githubusercontent.com/38815618/107515849-f020c500-6bee-11eb-9c51-0a866738bbc3.PNG)

<p>
    아키텍처에는 주어진 알파벳의 가능한 모든 변형을 생성하고 일련의 작업자(worker)들에게 배포하는 변형 생성자(ventilator)가 있다. 작업자들은 주어진 변형에 대한 해시섬을 계산하고 이를 입력으로 제공된 해시섬에 일치하는지 비교한다. 일치하는 항목이 존재하면 결과가 결과 수집 노드로 전송된다.
</p>

<p>
    아키텍처의 영구 노드는 변형 생성자 및 결과 수집자이고, 이에 반해 임시 노드들은 작업자들이다. 이는 각 작업자가 PULL 소켓을 공급기에 연결하고 PUSH 소켓을 결과 수집자에 연결한다는 것을 의미한다. 공급기 또는 결과 수집자에서 매개 변수를 변경하지 않고 원하는 수의 작업자들을 시작하고 중지할 수 있다.
</p>

##### 변형 생성자(ventilator) 구현

```javascript
const zmq = require('zmq');
const variationsStream = require('variations-stream');
const alphabet = 'abcdefghijklmnopqrstuvwxyz';
const batchSize = 10000;
const maxLength = process.argv[2];
const searchHash = process.argv[3];

const ventilator = zmq.socket('push'); // 1.
ventilator.bindSync("tcp://*:5016");

let batch = [];
variationsStream(alphabet, maxLength)
    .on('data', combination => {
        batch.push(combination);
        if (batch.length === batchSize) { // 2.
            const msg = {searchHash: searchHash, variations: batch};
            ventilator.send(JSON.stringify(msg));
            batch = [];
        }
    })
    .on('end', () => {
        // 나머지 조합을 전달
        const msg = {searchHash: searchHash, variations: batch};
        ventilator.send(JSON.stringify(msg));
    })
;
```

1. 먼저 PUSH 소켓을 만들고 이를 로컬 포트 5000번에 바인딩한다. 작업자의 PULL 소켓이 연결되어 작업을 수신한다.
2. 생성된 변형 항목들을 각각 10,000개의 항목으로 그룹화한 다음, 일치시킬 해시와 확인할 단어 묶음이 포함된 메시지를 작성한다. 이는 본질적으로 작업자들이 받을 작업 대상이다. 공급기 소켓을 통해 `send()`를 호출하면 메시지를 라운드 로빈 방식의 배포에 따라 다음으로 사용 가능한 작업자에게 전달한다.

##### 작업자 구현

```javascript
const zmq = require('zmq');
const crypto = require('crypto');
const fromVentilator = zmq.socket('pull');
const toSink = zmq.socket('push');

fromVentilator.connect('tcp://localhost:5016');
toSink.connect('tcp://localhost:5017');

fromVentilator.on('message', buffer => {
    const msg = JSON.parse(buffer);
    const variations = msg.variations;
    variations.forEach( word => {
        console.log(`Processing: ${word}`);
        const shasum = crypto.createHash('sha1');
        shasum.update(word);
        const digest = shasum.digest('hex');
        if (digest === msg.searchHash) {
            console.log(`Found! => ${word}`);
            toSink.send(`Found! ${digest} => ${word}`);
        }
    });
});
```

<p>
    작업자는 아키텍처의 임시 노드를 나타내므로 소켓은 들어오는 연결을 수신하는 것이 아니라 원격지의 노드에 연결되어야 한다. 작업자에게 다음 두 개의 소켓을 제공한다.
</p>

- 공급기에 연결되어 작업을 수신하는 PULL 소켓
- 결과를 전달하기 위해 결과 수집자(sink)에 연결되는 PUSH 소켓

<p>
    받은 각 메시지에 대해 포함된 단어 묶음을 반복한 후 각 단어에 대해 SHA1 체크섬을 계산하고 이를 메시지와 함께 전달된 searchHash와 비교한다. 일치하는 항목이 발견되면 그 결과를 결과 수집자로 전달한다.
</p>

##### 결과 수집자 구현

```javascript
const zmq  = require('zmq');
const sink = zmq.socket('pull');
sink.bindSync("tcp://*:5017");

sink.on('message', buffer => {
    console.log('Message from worker: ', buffer.toString());
});
```

<p>
    싱크는 매우 기본적인 결과 수집기로 단순히 작업자에게서 받은 메시지를 콘솔에 출력한다. 결과 수집자가 아키텍처의 영구 노드이기 때문에 작업자들의 PUSH 소켓에 명시적으로 연결하는 대신, PULL 소켓을 바인드하는 것은 유의해야 한다.
</p>

### 3-2 AMQP의 파이프라인과 경쟁 소비자

#### 점대점(point-to-point) 통신 및 경쟁 소비자

<p>
    AMQP와 같은 시스템을 사용하여 파이프라인과 작업 배분 패턴을 구현하려면 각 메시지가 오직 한 소비자에만 수신된다는 보장이 있어야 하지만, 교환기가 잠재적으로 하나 이상의 큐에 바인딩 될 수 있는 경우는 이를 보장할 수 없다. 이에 대한 해결책은 교환기를 우회하여 목적지 큐에 직접 메시지를 전송하는 것이다. 이 방법을 사용하면 하나의 대기열만 메시지를 수신할 수 있으며, 이러한 통신 패턴을 점대점(point-to-point)이라고 한다.
</p>

<p>
    다수의 소비자가 동일한 큐에서 듣고 있을 때, 메시지가 균일하게 전달되어 팬아웃 배분이 구현된다. 메시지 브로커의 영역에서 이를 경쟁 소비자(competing consumers) 패턴으로 알려져 있다.
</p>

#### AMQP를 사용한 해시 크래커 구현

![1](https://user-images.githubusercontent.com/38815618/107527664-611aa980-6bfc-11eb-9ac1-9549d24841fb.PNG)

<p>
    여러 작업자에게 여러 작업들을 배포하려면 단일 대기열을 사용해야 한다. 위의 그림에서 이를 작업 대기열(Jobs queue)이라고 한다. 작업 대기열의 다른 한쪽 끝에는 경쟁 소비자로서 일련의 작업자들이 있다. 각각의 작업자는 서로 다른 메시지를 큐로부터 수신한다. 결과적으로 여러 작업이 서로 다른 작업자에 전달되어 동시에 실행된다.
</p>

<p>
    작업자가 생성한 결과는 결과 대기열(results queue)이라고 하는 다른 대기열에 게시한 다음, 결과 수집자(results collector)에 의해 소비된다. 전체 아키텍처에서 어떠한 교환기(Exchange)도 사용하지 않는다.
</p>

##### 공급자(producer) 구현하기

```javascript
const amqp = require('amqplib');
// ...

let connection, channel;
amqp
    .connect('amqp://localhost')
    .then(conn => {
        connection = conn;
        return conn.createChannel();
    })
    .then(ch => {
        channel = ch;
        produce();
    })
    .catch(err => console.log(err))
;

function produce() {
    let batch = [];
    variationsStream(alphabet, maxLength)
        .on('data', combination => {
            batch.push(combination);
            if (batch.length === batchSize) {
                const msg = {searchHash: searchHash, variations: batch};
                channel.sendToQueue('jobs_queue', 
                    new Buffer(JSON.stringify(msg)));
                batch = [];
            }
        })
        // ...
    ;
}
```

<p>
    위의 코드에서 볼 수 있듯이, 어떠한 교환기나 바인딩 없이 AMQP 통신을 훨씬 간단하게 설정할 수 있다. 또한, 메시지를 게시하는 것만 관심이 있기 때문에 대기열도 필요하지 않다. 가장 중요한 부분은 `channel.sendToQueue()` API이다. 이 API는 대기열에 직접 메시지를 전달하는 역활을 담당한다. 이 경우 교환기나 라우팅을 거치지 않는다.
</p>

##### 작업자 구현하기

```javascript
const amqp = require('amqplib');
const crypto = require('crypto');

let channel, queue;
amqp
    .connect('amqp://localhost')
    .then(conn => conn.createChannel())
    .then(ch => {
        channel = ch;
        return channel.assertQueue('jobs_queue');
    })
    .then(q => {
        queue = q.queue;
        consume();
    })
    .catch(err => console.log(err.stack))
;

function consume() {
    channel.consume(queue, function(msg) {
        const data = JSON.parse(msg.content.toString());
        const variations = data.variations;
        variations.forEach( word => {
            console.log(`Processing: ${word}`);
            const shasum = crypto.createHash('sha1');
            shasum.update(word);
            const digest = shasum.digest('hex');
            if (digest === data.searchHash) {
                console.log(`Found! => ${word}`);
                channel.sendToQueue('results_queue', 
                    new Buffer(`Found! ${digest} => ${word}`));
            }
        });
        channel.ack(msg);
    });
}
```

<p>
    새로운 작업자는 메시지 교환과 관련된 부분을 제외하고 이전 섹션에서 구현한 zmq와 매우 유사하다. 위의 코드에서 먼저 jobs_queue가 있는지 확인한 다음, `channel.consume()`을 사용하여 들어오는 작업들을 기다린다. 그런 다음 매칭이 발견될 때마다 다시 점대점 통신을 사용하여 results_queue를 통해 수집자(collector)에 결과를 보낸다. 여러 작업자가 시작된 경우 모두 동일한 대기열에서 수신 대기하므로 메시지의 부하가 분산된다.
</p>

##### 결과 수집자(result collector) 구현하기

```javascript
// ...
    .then(ch => {
        channel = ch;
        return channel.assertQueue('results_queue');
    })
    .then(q => {
        queue = q.queue;
        channel.consume(queue, msg => {
            console.log('Message from worker: ', msg.content.toString());
        });
    })
// ...
```

<p>
    결과 수집자도 수신된 모든 메시지를 콘솔에 인쇄하는 간단한 모듈이다.
</p>
