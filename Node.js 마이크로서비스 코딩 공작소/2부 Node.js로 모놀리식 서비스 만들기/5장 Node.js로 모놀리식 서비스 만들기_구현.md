# 2부 Node.js로 모놀리식 서비스 만들기

## 5장 Node.js로 모놀리식 서비스 만들기: 구현

### 1. 파일 구성

![1](https://user-images.githubusercontent.com/38815618/97440794-484af880-196b-11eb-9ce8-aace42dfa269.PNG)

- monolithic.js: API 서버, 비즈니스 로직과 I/O 처리 기능을 분리
- monolithic_goods.js: 상품 관리 모듈
- monolithic_members.js: 회원 관리 모듈
- monolithic_purchases.js: 구매 관리 모듈

### 2. REST API 서버 만들기

```javascript
// 기본적인 형태의 HTTP 서버
const http = require('http');

var server = http.createServer((req, res) => {

}).listen(8000); // 8000번 포트 사용
```

```javascript
// 메서드와 URI 추가
const http = require('http');
const url = require('url');
const querystring = require('querystring');

var server = http.createServer((req, res) => {
    var method = req.method; // 메서드 얻어옴
    var uri = url.parse(req.url, true);
    var pathname = uri.pathname; // URI 얻어옴
}).listen(8000);
```

<p>
    메서드 정보와 URI 정보는 createServer 함수에서 전달되는 req 파라미터로 얻어 올 수 있다. 단 URI 정보를 얻으려면 약간의 파싱이 필요하며 url과 querystring 모듈을 이용해 쉽게 파싱할 수 있다.
</p>

```javascript
// 파라미터를 얻어 오는 기능 추가
const http = require('http');
const url = require('url');
const querystring = require('querystring');

var server = http.createServer((req, res) => {
    var method = req.method;
    var uri = url.parse(req.url, true);
    var pathname = uri.pathname;

    if (method === "POST" || method === "PUT") { // POST와 PUT이면 데이터를 읽음
        var body = "";

        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {
            var params;
            // 헤더 정보가 JSON이면 처리
            if (req.headers['content-type'] == "application/json") {
                params = JSON.parse(body);
            } else {
                params = querystring.parse(body);
            }

            onRequest(res, method, pathname, params);
        });
    } else { // GET과 DELETE이면 query 정보를 읽음
        onRequest(res, method, pathname, uri.query);
    }
}).listen(8000);

function onRequest(res, method, pathname, params) {
    res.end("response!"); // 모든 요청에 response! 메시지를 보냄
}
```

<p>
    HTTP 프로토콜은 메서드에 따라 입력 파라미터를 얻어 오는 방식이 다르다. POST와 PUT은 data와 end 이벤트를 이용해 얻어 올 수 있고, GET과 DELETE는 url 모듈의 parse 기능을 이용해 얻어 올 수 있다.
</p>

```javascript
// 기능별 모듈 호출
const http = require('http');
const url = require('url');
const querystring = require('querystring');

const members = require('./monolithic_members');
const goods = require('./monolithic_goods');
const purchases = require('./monolithic_purchases');

var server = http.createServer((req, res) => {
    var method = req.method;
    var uri = url.parse(req.url, true);
    var pathname = uri.pathname;

    if (method === "POST" || method === "PUT") {
        var body = "";

        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {
            var params;
            if (req.headers['content-type'] == "application/json") {
                params = JSON.parse(body);
            } else {
                params = querystring.parse(body);
            }

            onRequest(res, method, pathname, params);
        });
    } else {
        onRequest(res, method, pathname, uri.query);
    }
}).listen(8000);

function onRequest(res, method, pathname, params) { // 기능별로 호출
    switch (pathname) {
        case "/members":
            members.onRequest(res, method, pathname, params, response);
            break;
        case "/goods":
            goods.onRequest(res, method, pathname, params, response);
            break;
        case "/purchases":
            purchases.onRequest(res, method, pathname, params, response);
            break;
        default: // 정의되지 않은 요청에 404 에러 리턴
            res.writeHead(404);
            return res.end();
    }
}

function response(res, packet) { // JSON 형식의 응답
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(packet));
}
```

### 3. mysql 연동

<p>
    Node.js는 기본적으로 데이터베이스와 연동이 가능한 모듈을 제공하지 않는다. 따라서 npm으로 확장 모듈을 설치해야 한다.
</p>

```javascript
// 데이터베이스 연동
const mysql = require('mysql');
const conn = { // mysql 접속 정보
    host: 'localhost',
    user: 'micro',
    password: 'service',
    database: 'monolithic'
};

var connection = mysql.createConnection(conn);
connection.connect(); // mysql 접속
connection.query("query", (error, results, fields) => { // query
    // 결과 처리
});
connection.end(); // 접속 종료
```

### 4. 비즈니스 모듈 만들기

#### 4-1 상품 관리 모듈 만들기

```javascript
exports.onRequest = function (res, method, pathname, params, cb) {
    switch (method) {
        case "POST":
            return register(method, pathname, params, (response) => { // 상품 등록
                process.nextTick(cb, res, response);
            });
        case "GET":
            return inquiry(method, pathname, params, (response) => { // 상품 조회
                process.nextTick(cb, res, response);
            });
        case "DELETE":
            return unregister(method, pathname, params, (response) => { // 상품 삭제
                process.nextTick(cb, res, response);
            });
        default:
            return process.nextTick(cb, res, null);
    }
}
```

![2](https://user-images.githubusercontent.com/38815618/97440795-48e38f00-196b-11eb-951e-0d7ce123b460.PNG)

<p>
    위의 그림은 REST API 서버에서 register 함수를 호출하는 과정이다. 다른 모듈도 이와 동일한 패턴이다.
</p>

#### 4-2 회원 관리 모듈 만들기

```javascript
exports.onRequest = function (res, method, pathname, params, cb) {
    switch (method) {
        case "POST":
            return register(method, pathname, params, (response) => {
                process.nextTick(cb, res, response);
            });
        case "GET":
            return inquiry(method, pathname, params, (response) => {
                process.nextTick(cb, res, response);
            });
        case "DELETE":
            return unregister(method, pathname, params, (response) => {
                process.nextTick(cb, res, response);
            });
        default:
            return process.nextTick(cb, res, null);
    }
}
```

#### 4-3 구매 관리 모듈 만들기

```javascript
exports.onRequest = function (res, method, pathname, params, cb) {
    switch (method) {
        case "POST":
            return register(method, pathname, params, (response) => {
                process.nextTick(cb, res, response);
            });
        case "GET":
            return inquiry(method, pathname, params, (response) => {
                process.nextTick(cb, res, response);
            });
        default:
            return process.nextTick(cb, res, null);
    }
}
```

### 5. 기능 만들기

#### 5-1 상품 관리 기능 만들기

```javascript
// mysql 모듈 선언
const mysql = require('mysql');
const conn = { // mysql 접속 정보
    host: 'localhost',
    user: 'micro',
    password: 'service',
    database: 'monolithic'
};

...
```

##### 상품 등록 - register 함수

```javascript
...

function register(method, pathname, params, cb) {
    var response = {
        errorCode: 0,
        errorMessage: "success"
    };

    if (params.name == null || params.category == null || params.price == null || params.description == null) { // 유효성 검사
        response.errorCode = 1;
        response.errorMessage = "Invalid Parameters";
        cb(response);
    } else {
        var connection = mysql.createConnection(conn);
        connection.connect();
        connection.query("INSERT INTO goods(name, category, price, description) values(?, ?, ?, ?)",
            [params.name, params.category, params.price, params.description],
            (error, results, fields) => {
                if (error) { // mysql 에러 처리
                    response.errorCode = 1;
                    response.errorMessage = error;
                }
                cb(response);
            });
        connection.end();
    }
}
```

##### 상품 조회 - inquiry 함수

```javascript
...

function inquiry(method, pathname, params, cb) {
    var response = {
        errorCode: 0,
        errorMessage: "success"
    };

    var connection = mysql.createConnection(conn);
    connection.connect();
    connection.query("SELECT * FROM goods", (error, results, fields) => {
        if (error || results.length == 0) {
            response.errorCode = 1;
            // 등록된 상품이 없을 때 처리
            response.errorMessage = error ? error : "no data";
        } else {
            response.results = results; // 조회 결과 처리
        }
        cb(response);
    });
    connection.end();
}
```

##### 상품 삭제 - unregister

```javascript
...

function unregister(method, pathname, params, cb) {
    var response = {
        errorCode: 0,
        errorMessage: "success"
    };

    if (params.id == null) {
        response.errorCode = 1;
        response.errorMessage = "Invalid Parameters";
        cb(response);
    } else {
        var connection = mysql.createConnection(conn);
        connection.connect();
        connection.query("DELETE FROM goods WHERE id = ?",
            [params.id],
            (error, results, fields) => {
                if (error) {
                    response.errorCode = 1;
                    response.errorMessage = error;
                }
                cb(response);
            });
        connection.end();
    }
}
```

#### 5-2 회원 관리 기능 만들기

```javascript
// mysql 모듈 선언
const mysql = require('mysql');
const conn = { // mysql 접속 정보
    host: 'localhost',
    user: 'micro',
    password: 'service',
    database: 'monolithic'
};

...
```

##### 회원 등록 - register 함수

```javascript
...

function register(method, pathname, params, cb) {
    var response = {
        key: params.key,
        errorCode: 0,
        errorMessage: "success"
    };

    if (params.username == null || params.password == null) {
        response.errorCode = 1;
        response.errorMessage = "Invalid Parameters";
        cb(response);
    } else {
        var connection = mysql.createConnection(conn);
        connection.connect();
        connection.query("INSERT INTO members(username, password) values(?, ?)",
            [params.username, params.password],
            (error, results, fields) => {
                if (error) {
                    response.errorCode = 1;
                    response.errorMessage = error;
                }
                cb(response);
            });
        connection.end();
    }
}
```

##### 회원 인증 - inquiry 함수

```javascript
...

function inquiry(method, pathname, params, cb) {
    var response = {
        key: params.key,
        errorCode: 0,
        errorMessage: "success"
    };

    if (params.username == null || params.password == null) {
        response.errorCode = 1;
        response.errorMessage = "Invalid Parameters";
        cb(response);
    } else {
        var connection = mysql.createConnection(conn);
        connection.connect();
        connection.query("SELECT id FROM members WHERE username = (?) AND password = (?)",
            [params.username, params.password],
            (error, results, fields) => {
            if (error || results.length == 0) {
                response.errorCode = 1;
                response.errorMessage = "invalid password"
            } else {
                response.results = results[0].id;
            }
            cb(response);
        });
        connection.end();
    }
}
```

##### 회원 탈퇴 - unregister 함수

```javascript
...

function unregister(method, pathname, params, cb) {
    var response = {
        key: params.key,
        errorCode: 0,
        errorMessage: "success"
    };

    if (params.username == null) {
        response.errorCode = 1;
        response.errorMessage = "Invalid Parameters";
        cb(response);
    } else {
        var connection = mysql.createConnection(conn);
        connection.connect();
        connection.query("DELETE FROM members WHERE id = ?",
            [params.username],
            (error, results, fields) => {
                if (error) {
                    response.errorCode = 1;
                    response.errorMessage = error;
                }
                cb(response);
            });
        connection.end();
    }
}
```

#### 5-3 구매 관리 기능 만들기

```javascript
// mysql 모듈 선언
const mysql = require('mysql');
const conn = { // mysql 접속 정보
    host: 'localhost',
    user: 'micro',
    password: 'service',
    database: 'monolithic'
};

...
```

##### 구매 - register 함수

```javascript
...

function register(method, pathname, params, cb) {
    var response = {
        key: params.key,
        errorCode: 0,
        errorMessage: "success"
    };

    if (params.userid == null || params.goodsid == null) {
        response.errorCode = 1;
        response.errorMessage = "Invalid Parameters";
        cb(response);
    } else {
        var connection = mysql.createConnection(conn);
        connection.connect();
        connection.query("INSERT INTO purchases(userid, goodsid) values(?, ?)",
            [params.userid, params.goodsid],
            (error, results, fields) => {
                if (error) {
                    response.errorCode = 1;
                    response.errorMessage = error;
                }
                cb(response);
            });
        connection.end();
    }
}
```

##### 구매 내역 조회 - inquiry 함수

```javascript
function inquiry(method, pathname, params, cb) {
    var response = {
        key: params.key,
        errorCode: 0,
        errorMessage: "success"
    };

    if (params.userid == null) {
        response.errorCode = 1;
        response.errorMessage = "Invalid Parameters";
        cb(response);
    } else {
        var connection = mysql.createConnection(conn);
        connection.connect();
        connection.query("SELECT id, goodsid FROM purchases WHERE userid = (?)",
            [params.userid],
            (error, results, fields) => {
            if (error) {
                response.errorCode = 1;
                response.errorMessage = error;
            } else {
                response.results = results;
            }
            cb(response);
        });
        connection.end();
    }
}
```

### 6. 테스트

```javascript
const http = require('http');

var options = {
    host: "127.0.0.1",
    port: 8000,
    headers: {
        'Content-Type': 'application/json'
    }
};

function request(cb, params) {
    var req = http.request(options, (res) => {
        var data = "";
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log(options, data);
            cb();
        });
    });

    if (params) {
        req.write(JSON.stringify(params));
    }
    req.end();
}
```
