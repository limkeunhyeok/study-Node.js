# 3부 마이크로서비스 만들기

## 8장 모놀리식에서 마이크로서비스로: 인터페이스 통일

### 1. 인터페이스

![1](https://user-images.githubusercontent.com/38815618/98106481-bac45700-1edc-11eb-8baf-ba51674315a6.PNG)

<p>
    클라이언트와 서버 관점에서 마이크로서비스 아키텍처는 많은 서버가 API를 각각 제공하는 구조이다. 독립된 각 API를 호출하려면 클라이언트는 모든 서버의 접속 정보와 패킷 구조를 알아야 하므로 통일된 인터페이스가 필요하다.
</p>

### 2. 레이어의 필요성

<p>
    클라이언트가 인터페이스 하나로 모든 마이크로서비스를 호출할 수 있으려면 레이어 개념이 필요하다. 이는 마이크로서비스들과 통신할 수 있는 인터페이스 레이어를 하나 두는 개념이다. 마이크로서비스보다 상위 계층의 레이어를 두고, 클라이언트의 접속을 처리하게 하면 통일된 인터페이스를 이용해 모든 API를 호출할 수 있다.
</p>

![2](https://user-images.githubusercontent.com/38815618/98106488-bbf58400-1edc-11eb-9bd1-3c437408d8b4.PNG)

<p>
    클라이언트는 게이트웨이로 접속한다. 이때 게이트웨이는 HTTP, TCP, PROTOBUF 등 다양한 형태의 서버가 될 수 있으며, 게이트웨이도 여러 개 존재할 수 있다. 단 게이트웨이 간에는 통신을 하지 않는다.
</p>

<p>
    게이트웨이는 망형 구조로 연결된 마이크로서비스들과 연결된다. 앞서 만든 Distributor를 이용해 모든 마이크로서비스와 접속하거나 필요한 마이크로서비스와 제한적으로 접속할 수도 있다. 보안을 위해 접속 IP를 제한할 수도 있고, 요청 가능한 API를 필터링할 수도 있다.
</p>

<p>
    마이크로서비스는 클라이언트가 접속했을 때와 동일하게 게이트웨이의 요청을 처리한다. 클라이언트가 접속하는 위치에 따라 게이트웨이와 마이크로서비스가 서로 다른 네트워크에 있기도 한다. 게이트웨이는 Public 망에 위치하고, 마이크로서비스는 Private 망에 위치해 보안을 강화할 수 있다.
</p>

### 3. HTTP 게이트웨이 만들기

![3](https://user-images.githubusercontent.com/38815618/98106495-bc8e1a80-1edc-11eb-9f8c-d80413ad6874.PNG)

<p>
    HTTP 게이트웨이는 HTTP에 대한 요청을 받아 메모리에 저장한 후 해당 API에 대한 마이크로서비스를 호출한다. 마이크로서비스에서 응답이 오면 메모리에 저장한 HTTP 요청 객체를 찾아 응답하고 메모리에서 지운다.
</p>

```javascript
const http = require('http');
const url = require('url');
const querystring = require('querystring');

var server = http.createServer((req, res) => { // 1. HTTP 서버 생성
    var method = req.method;
    var uri = url.parse(req.url, true);
    var pathname = uri.pathname;

    if (method === "POST" || method === "PUT") { // 2. POST, PUT 메서드 처리
        var body = "";

        req.on('data', function(data) {
            var params;

            // 3. 헤더가 application/json일 때는 JSON으로 파싱
            if (req.headers['content-type'] == "application/json") {
                params = JSON.parse(body);
            } else {
                // 4. 헤더가 JSON이 아니면 querystring으로 파싱
                params = querystring.parse(body);
            }

            onRequest(req, method, pathname, params);
        });
    } else {
        onRequest(req, method, pathname, uri.query);
    }
}).listen(8000, () => {
    console.log('listen', server.address());
});

function onRequest(res, method, pathname, params) { // 5. 요청 정보 처리
}

```

1. http 모듈으로 서버를 생성한다.
2. POST와 PUT에서 data와 end 이벤트를 이용해 파라미터를 읽는다.
3. 컨텐츠 타입이 application/json이라면 JSON.parse를 통해 파라미터를 처리한다.
4. 컨텐츠 타입이 application/json이 아니라면 querystring.parse를 통해 파라미터를 처리한다.
5. 모든 메서드에서 파라미터를 읽어 들였으면 메서드 정보와 API 주소 입력 파라미터를 onRequest 함수로 전달한다.

```javascript
...

const tcpClient = require('./client'); // 1. Client 클래스 참조

var mapClients = {};
var mapUrls = {};
var mapResponse = {};
var mapRR = {};
var index = 0;

var server = http.createServer((req, res) => {
    ...
}).listen(8000, () => {
    console.log('listen', server.address());

    var packet = { // 2. Distributor 전달 패킷
        uri: "/distributes",
        method: "POST",
        key: 0,
        params: {
            port: 8000,
            name: "gate",
            urls: []
        }
    };
    var isConnectedDistributor = false;

    this.clientDistributor = new tcpClient( // 3. Distributor 접속
        "127.0.0.1"
        , 9000
        , (options) => { // 4. Distributor 접속 완료 이벤트
            isConnectedDistributor = true;
            this.clientDistributor.write(packet);
        }
        , (options, data) => { onDistribute(data); } // 5. Distributor 데이터 수신 이벤트
        , (options) => { isConnectedDistributor = false; } // 6. Distributor 접속 종료 이벤트
        , (options) => { isConnectedDistributor = false; } // 7. Distributor 에러 이벤트
    );

    setInterval(() => { // 8. Distributor 재접속
        if (isConnectedDistributor != true) {
            this.clientDistributor.connect();
        }
    }, 3000);
});

function onRequest(res, method, pathname, params) {
}

function onDistribute(data) { // 9. Distributor 데이터 수신 처리
    for (var n in data.params) {
        var node = data.params[n];
        var key = node.host + ":" + node.port;
        if (mapClients[key] == null && node.name != "gate") {
            var client = new tcpClient(node.host, node.port, onCreateClient, onReadClient, onEndClient, onErrorClient);
            mapClients[key] = { // 10. 마이크로서비스 연결 정보 저장
                client: client,
                info: node
            };
            for (var m in node.urls) { // 11. 마이크로서비스 URL 정보 저장
                var key = node.urls[m];
                if (mapUrls[key] == null) {
                    mapUrls[key] = [];
                }
                mapUrls[key].push(client);
            }
            client.connect();
        }
    }
}

function onCreateClient(options) {
    console.log("onCreateClient");
}

function onReadClient(options, packet) {

}

function onEndClient(options) { // 12. 마이크로서비스 접속 종료 처리
    var key = options.host + ":" + options.port;
    console.log("onEndClient", mapClients[key]);
    for (var n in mapClients[key].info.urls) {
        var node = mapClients[key].info.urls[n];
        delete mapUrls[node];
    }
    delete mapClients[key];
}

function onErrorClient(options) {
    console.log("onErrorClient");
}
```

1. HTTP 게이트웨이가 마이크로서비스들과 통신하기 위해 Client 클래스를 참조한다.
2. HTTP 게이트웨이를 Distributor에 등록하는 패킷을 구성한다.
3. Distributor 접속용 Client 클래스의 인스턴스를 생성한다.
4. Distributor에 접속하면 isConnectedDistributor를 true로 설정하고 만들어 놓은 패킷을 전달한다.
5. Distributor에서 정보가 전달되면 onDistribute 함수에 처리하도록 한다.
6. 접속이 종료되면 isConnectedDistributor를 false로 변경한다.
7. 에러가 발생되면 isConnectedDistributor를 false로 변경한다.
8. 3초 간격으로 isConnectedDistributor 값이 false라면 Distributor로 접속을 시도한다.
9. Distributor에서 현재 접속 가능한 마이크로서비스 목록이 전달되면 접속하지 않은 마이크로서비스에 대해 Client 클래스 인스턴스를 생성한다.
10. 접속 주소로 key를 만들어 mapClients에 인스턴스를 저장한다.
11. 처리 가능한 URL들을 mapUrls에 저장한다.
12. 접속이 종료되면 mapClients와 mapUrls에 등록한 정보를 삭제한다.

```javascript
...


function onRequest(res, method, pathname, params) {
    var key = method + pathname;
    var client = mapUrls[key];
    if (client == null) { // 1. 처리 가능한 API만 처리
        res.writeHead(404);
        res.end();
        return;
    } else {
        params.key = index; // 2. 고유키 발급
        var packet = {
            uri: pathname,
            method: method,
            params: params
        };

        mapResponse[index] = res; // 3. 요청에 대한 응답 객체 저장
        index++; // 4. 고유 값 증가
        if (mapRR[key] == null) // 5. 라운드 로빈 처리
            mapRR[key] = 0;
        mapRR[key]++;
        client[mapRR[key] % client.length].write(packet); // 6. 마이크로서비스에 요청
    }
}

...

function onReadClient(options, packet) { // 7. 마이크로서비스 응답
    console.log("onReadClient", packet);
    mapResponse[packet.key].writeHead(200, { 'Content-Type': 'application/json' });
    mapResponse[packet.key].end(JSON.stringify(packet));
    delete mapResponse[packet.key]; // 8. 응답 객체 삭제
}

...
```

1. HTTP 게이트웨이로 API 요청이 오면 현재 처리 가능한 마이크로서비스 API들을 확인해 처리 가능한 API만 처리한다.
2. 해당 마이크로서비스를 호출하기 전에 고유한 키를 발급한다.
3. 마이크로서비스에서 온 응답을 전달하기 위해 http의 응답 객체를 저장한다.
4. 유일성을 보장하는 고유키 값을 증가시킨다.
5. 동일한 API를 처리하는 마이크로서비스 여러 개를 고르게 호출하기 위해 라운드 로빈 인덱스 값을 증가시킨다.
6. 접속된 마이크로서비스로 API를 호출한다.
7. 마이크로서비스가 API를 처리한 후 응답하면 onReadClient 함수로 전달된다.
8. mapResponse를 찾아 응답한 후 삭제한다.
