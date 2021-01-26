# Chapter 09 - 고급 비동기 레시피

## 1. 비동기적으로 초기화되는 require 수행 모듈

### 1-1 전통적인 솔루션

<p>
    db 모듈은 연결 및 서버와의 핸드세이크가 완료된 후에만 요청을 수락할 수 있다. 이 경우에는 보통 두 가지 옵션이 있다.
</p>

```javascript
const db = require('aDb');

module.exports = function findAll(type, callback) {
    if (db.connected) {
        runFind();
    } else {
        db.once('connected', runFind);
    }
    function runFind() {
        db.findAll(type, callback);
    };
};
```

- 모듈을 사용하기 전에 초기화되었는지 확인한다. 그렇지 않으면 초기화를 기다려야 한다. 이 프로세스는 동기식 모듈에서 작업을 호출할 때마다 수행해야 한다.

```javascript
const db = require('aDb');
const findAllFactory = require('./findAll');

db.on('connected', function() {
    const findAll = findAllFactory(db);
});

module.exports = db => {
    return function findAll(type, callback) {
        db.findAll(type, callback);
    }
}
```

- 비동기 require 모듈 대신 DI(Dependency Injection)를 사용한다. 이렇게 하면 비동기적으로 종속성이 완전히 초기화될 때까지 일부 모듈의 초기화를 지연시킬 수 있다. 이 기술은 모듈 초기화 관리의 복잡성을 다른 컴포넌트, 일반적으로 상위 모듈로 이관한다.

### 1-2 미리 초기화된 큐

<p>
    모듈을 관련된 의존성의 초기화 상태에서 분리하는 간단한 패턴은 큐와 커맨드 패턴이다. 이 개념은 아직 초기화되지 않은 상태에서 모듈이 받은 모든 작업을 저장한 후에 모든 초기화 단계가 완료되자마자 실행하는 것이다.
</p>

#### 비동기적으로 초기화하는 모듈 구현하기

```javascript
// asyncModule.js
const asyncModule = module.exports;

asyncModule.initialized = false;

asyncModule.initialize = callback => {
    setTimeout(function() {
        asyncModule.initialized = true;
        callback();
    }, 10000);
};

asyncModule.tellMeSomething = callback => {
    process.nextTick(() => {
        if (!asyncModule.initialized) {
            return callback(
                new Error("I don't have anything to say right now")
            );
        }
        callback(null, 'Current time is: ' + new Date());
    });
};
```

<p>
    위의 코드는 10초 후에 initialized 변수를 true로 설정하여 콜백을 호출하는 `initialize()` 함수를 노출한다. `tellMeSomething()`은 현재 시간을 반환하는 메소드지만, 모듈이 아직 초기화되지 않는 경우 오류를 발생시킨다.
</p>

```javascript
// routes.js
const asyncModule = require('./asyncModule');

module.exports.say = (req, res) => {
    asyncModule.tellMeSomething((err, something) => {
        if (err) {
            res.writeHead(500);
            return res.end('Error: ', + err.message);
        }
        res.writeHead(200);
        res.end('I say ' + something);
    });
};
```

<p>
    위의 코드는 HTTP 요청의 핸들러로, asyncModule의 `tellMeSomething()` 메소드를 호출한 후 결과를 HTTP 응답에 쓴다. 초기화 상태를 검사하지 않기 때문에 문제가 발생할 수도 있다.
</p>

```javascript
// app.js
const http = require('http');
const routes = require('./routes');
const asyncModule = require('./asyncModule');

asyncModule.initialize(() => {
    console.log('Async module initialized');
});

http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/say') {
        return routes.say(req, res);
    }
    res.writeHead(404);
    res.end('Not found');
}).listen(8000, () => console.log('Started'));
```

<p>
    위의 코드는 기본적인 HTTP 서버이다. 이 모듈은 어플리케이션의 진입점이며, asyncModule의 초기화를 시작시키고 미리 생성한 요청 핸들러를 사용한 HTTP 서버를 생성한다.
</p>

<p>
    이를 실행하고 요청을 보내면 오류가 발생한다. 이는 asyncModule이 아직 초기화되지 않은 상태에서 사용하려고 했기 때문이다. 비동기적으로 초기화된 모듈의 세부적인 구현에 따라 준비된 오류가 발생하거나, 중요한 정보가 손실되거나 전체 어플리케이션이 손상될 수 있다.
</p>

#### 미리 초기화된 큐를 사용한 모듈 래핑

```javascript
// asyncModuleWrapper.js - 1
const asyncModule = require('./asyncModule');

const asyncModuleWrapper = module.exports;
asyncModuleWrapper.initialized = false;
asyncModuleWrapper.initialize = function() {
    activeState.initialize.apply(activeState, arguments);
};

asyncModuleWrapper.tellMeSomething = function() {
    activeState.tellMeSomething.apply(activeState, arguments);
};
```

<p>
    위의 코드에서 asyncModuleWrapper은 각 메소드를 현재 활성 상태에 위임한다.
</p>

```javascript
// asyncModuleWrapper.js - 2
let pending = [];
let notInitializedState = {

    initialize: function(callback) {
        asyncModule.initialize(function() {
            asyncModuleWrapper.initalized = true;
            activeState = initializedState; // 1.
            
            pending.forEach(function(req) { // 2.
                asyncModule[req.method].apply(null, req.args);
            });
            pending = [];
            
            callback(); // 3.
        });
    },
  
    tellMeSomething: function(callback) {
        return pending.push({
            method: 'tellMeSomething',
            args: arguments
        });
    }  
};

let initializedState = asyncModule;
let activeState = notInitializedState;
```

1. activeState 변수를 다음 상태 객체인 initializedState로 갱신한다.
2. pending 큐에 이전에 저장된 모든 명령을 실행한다.
3. 원래의 콜백을 호출한다.

<p>
    이 시점에서는 모듈이 초기화되지 않았기 때문에, 이 상태의 `tellMeSomething()` 메소드는 간단하게 새로운 커맨드 객체를 생성하고 보류중인 큐에 추가한다.
</p>

<p>
    initializedState 객체는 원래의 asyncModule에 대한 참조일 뿐이다. 실제 초기화가 완료되면 모든 요청을 원래 모듈로 직접 라우트할 수 있다. 마지막으로 최초의 활성 상태를 설정해야하는데, notInitializedState로 정의한다.
</p>

### 1-3 실전에서는 어떻게 사용되는가

<p>
    위의 패턴은 많은 데이터베이스 드라이버와 ORM 라이브러리에서 사용된다. Mongoose는 MongoDB를 위한 ORM이다. Mongoose를 사용하면 쿼리를 보낼 수 있도록 데이터베이스 연결이 열릴 때까지 기다릴 필요가 없다. 각 작업을 큐에 넣은 다음 데이터베이스와 연결이 완전히 설정된 후에 나중에 실행되기 때문이다. 이는 API의 유용성을 향상시킨다.
</p>
