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

## 2. 비동기 배치(일괄 처리) 및 캐싱

### 2-1 캐싱 또는 일괄 처리가 없는 서버 구현

<p>
    예시로 만들 서버는 전자상거래 회사의 판매를 관리하는 웹 서버로, 특정 유형의 상품에 대한 모든 거래의 합계를 서버에 질의한다. 이를 위해 단순성과 유연성을 고려해 LevelUP을 사용한다. 키는 transactionId로 표시되며, 값은 판매액(금액)과 항목의 유형을 포함하는 JSON 개체이다.
</p>

```javascript
// totalSales.js
const level = require('level');
const sublevel = require('level-sublevel');

const db = sublevel(level('example-db', {valueEncoding: 'json'}));
const salesDb = db.sublevel('sales');

module.exports = function totalSales(item, callback) {
    console.log('totalSales() invoked');
    let sum = 0;
    salesDb.createValueStream() // 1.
        .on('data', data => {
            if(!item || data.item === item) { // 2.
                sum += data.amount;
            }
        })
        .on('end', () => {
            callback(null, sum); // 3.
        });
};
```

1. 판매 트랜잭션을 가진 salesDb sublevel로부터 스트림을 생성한다. 이 스트림은 데이터베이스에서 모든 항목을 가져온다.
2. 데이터 이벤트는 데이터베이스 스트림에서 반환된 각 판매 거래를 수신한다. 현재 항목의 금액을 합계 값에 더하겠지만, 항목 유형이 입력에 제공된 것과 같은 경우에만 추가한다.
3. 마지막으로 종료 이벤트가 수신되면 결과로 최종 합계를 전달하여 `callback()` 메소드를 호출한다.

```javascript
// app.js
const http = require('http');
const url = require('url');
const totalSales = require('./totalSales');

http.createServer((req, res) => {
    const query = url.parse(req.url, true).query;
    totalSales(query.item, (err, sum) => {
        res.writeHead(200);
        res.end(`Total sales for item ${query.item} is ${sum}`);
    });
}).listen(8000, () => console.log('Started'));
```

<p>
    서버는 매우 단순하며, url 쿼리문을 통해 데이터가 전송된다.
</p>

### 2-2 비동기 요청 일괄 처리

![1](https://user-images.githubusercontent.com/38815618/105928997-ff016680-6089-11eb-97ca-a3c15a2a0860.PNG)

<p>
    위의 그림은 동일한 입력을 사용하여 동일한 비동기 작업을 호출하는 두 개의 클라이언트를 보여준다. 이 상황을 해결하는 자연스러운 방법은 두 클라이언트가 서로 다른 순간에 완료될 두 개의 별도 작업자를 시작하는 것이다.
</p>

![2](https://user-images.githubusercontent.com/38815618/105928999-00329380-608a-11eb-8ba6-708870bbdb44.PNG)

<p>
    위의 그림은 같은 입력으로 동일한 API를 호출하는 두 요청을 일괄 처리하거나 다른 실행 중인 작업자에 추가하는 방법이다. 작업이 완료되면 두 클라이언트에게 모두 알릴 수 있으며, 이는 대개 적절한 메모리 관리와 무효화 전략이 필요한 복잡한 캐싱 메커니즘을 처리하지 않고도 어플리케이션의 부하를 최적화할 수 있는 간단하지만 매우 강력한 방법을 보여준다.
</p>

#### 총 판매 조회 웹 서버에서 일괄 처리 요청

```javascript
// totalSalesBatch.js
const totalSales = require('./totalSales');

const queues = {};
module.exports = function totalSalesBatch(item, callback) {
    if(queues[item]) {  // 1.
        console.log('Batching operation');
        return queues[item].push(callback);
    }
  
    queues[item] = [callback];  // 2.
    totalSales(item, (err, res) => {
        const queue = queues[item];  // 3.
        queues[item] = null;
        queue.forEach(cb => cb(err, res));
    });
};
```

1. 입력으로 제공되는 항목 유형에 대한 대기열이 이미 있으면, 해당 항목에 대한 요청이 이미 실행 중임을 의미한다. 이 경우 단순히 기존 큐에 콜백을 추가하고 즉시 호출에서 복귀해야 한다. 그 외의 것은 필요하지 않다.
2. 항목에 대한 것이 정의된 큐에 없으면 새 요청을 작성해야 함을 의미한다. 이를 위해 특정 항목에 대한 새로운 대기열을 만들고 현재 콜백 함수로 초기화한다. 그후 원래의 `totalSales()` API를 호출한다.
3. 원래 `totalSales()` 요청이 완료되면 해당 특정 항목에 대한 큐에 추가된 모든 콜백을 반복하여 작업 결과를 가지고 하나씩 호출한다.

<p>
    `totalSalesBatch()` 함수의 동작은 원래의 `totalSales()` API의 동작과 동일하다. 동일한 입력을 사용하는 API에 대한 여러 번의 호출이 일괄 처리되므로 시간과 리소스가 절약된다. app.js의 totalSales 모듈을 수정하고, 실행하면 먼저 요청이 일괄적으로 반환되며, 기존의 테스트보다 최소 4배 더 빠르다.
</p>

### 2-3 비동기 요청 캐싱

<p>
    요청의 일괄 처리 패턴의 문제점 중 하나는 API가 빠를수록 일괄 처리 요청의 수가 줄어든다는 것이다. API가 충분히 빠르면 최적화를 시도할 필요가 없다고 할 수도 있지만, 여전히 어플리케이션의 리소스 로드에 있어 합산을 한다면 상당한 영향을 미칠 수 있는 요인이 있음을 보여준다. 또한 때로는 API 호출의 결과가 자주 변경되지 않는다고 가정할 수도 있다. 이 경우 간단한 요청의 일괄 처리는 최상의 성능을 제공하지 못한다. 이러한 모든 상황에서 어플리케이션의 로드를 줄이고 응답 속도를 높이고자 한다면, 캐싱 패턴이 가장 좋다.
</p>

<p>
    캐싱 패턴은 요청이 완료되자마자 결과를 캐시에 저장한다. 캐시의 결과를 바로 변수, 데이터베이스 항목 또는 특수 캐싱 서버에 저장한다. 따라서 다음 번에 API를 호출할 때, 다른 요청을 생성하는 대신 캐시에서 즉시 결과를 검색할 수 있다. 비동기 프로그래밍에서 캐싱 패턴은 최적화를 위해 요청 일괄 처리와 결합되어야 한다. 캐시가 아직 설정되지 않은 상태에서 여러 요청이 동시에 실행될 수 있고, 이러한 요청이 모두 완료될 때 캐시가 여러 번 설정될 수 있기 때문이다.
</p>

![3](https://user-images.githubusercontent.com/38815618/105929000-00cb2a00-608a-11eb-865b-5b30ff6759ea.PNG)

<p>
    위의 그림은 최적의 비동기 캐싱 알고리즘을 위한 두 개의 단계를 보여준다. 비동기 API를 사용하고 있으므로 비록 캐시와 관련된 처리들이 동기적이라 할지라도 캐시된 값은 항상 비동기적으로 반환해야 한다.
</p>

- 첫 번째 단계는 일괄처리 패턴과 완전히 동일하다. 캐시가 설정되지 않은 동안 수신된 요청은 함께 일괄 처리된다. 요청이 완료되면 캐시가 한 번 설정된다.
- 캐시 설정이 완료되면 이후의 모든 요청이 캐시에서 직접 제공된다.

#### 총 판매 조회 웹 서버에서 요청 캐싱

```javascript
// totalSalesCache.js
const totalSales = require('./totalSales');

const queues = {};
const cache = {};

module.exports = function totalSalesBatch(item, callback) {
    const cached = cache[item];
    if (cached) {
        console.log('Cache hit');
        return process.nextTick(callback.bind(null, null, cached));
    }
  
    if (queues[item]) {
        console.log('Batching operation');
        return queues[item].push(callback);
    }
    
    queues[item] = [callback];
    totalSales(item, (err, res) => {
        if (!err) {
            cache[item] = res;
            setTimeout(() => {
                delete cache[item];
            }, 30 * 1000);
        }
        
        const queue = queues[item];
        queues[item] = null;
        queue.forEach(cb => cb(err, res));
    });
};
```

<p>
    앞선 비동기 일괄 처리와 유사하며 차이점은 다음과 같다.
</p>

- API가 호출될 때 가장 먼저 해야 할 일은 캐시에 설정되어 있는지를 확인하는 것이다. 캐시에 존재할 경우 캐시된 값을 `callback()`을 사용하여 즉시 반환하는데, `process.nextTick()`을 사용해 지연시킨다.
- 실행은 일괄 처리 모드에서 계속되지만 이번에는 원래 API가 성공적으로 완료되면 결과를 캐시에 저장한다. 또한 30초 후에 캐시가 무효화 되도록 제한 시간을 설정한다.

<p>
    app.js를 수정하여 실행하면 일괄처리와 비교할 때 시간이 10% 단축되는 것을 알 수 있다.
</p>

#### 캐싱 메커니즘 구현에 대한 참고 사항

- 캐시된 값이 많으면 쉽게 많은 메모리를 소비할 수 있다. 이 경우 LRU(Least Recently Used) 알고리즘을 사용하여 메모리 사용률을 일정하게 유지할 수 있다.
- 어플리케이션이 여러 프로세스에 분산되어 있는 경우, 캐시에 간단한 변수를 사용하게 되면 각 서버 인스턴스에서 다른 결과가 반환될 수 있다. 구현하려는 특정 어플리케이션에 바람직하지 않은 경우, 해결 방안은 캐시에 공유 저장소를 사용하는 것이다. 가장 널리 사용되는 솔루션은 Redis와 Memcached이다.
- 시간 제한 만료와 달리 수동 캐시 무효화를 사용하면 캐시 수명을 늘리고 동시에 최신 데이터를 제공할 수 있지만, 관리가 훨씬 더 복잡해진다.

### 2-4 프라미스를 사용한 일괄처리와 캐싱

<p>
    프라미스를 유익하게 이용할 수 있는 두 가지 특성이 있다.
</p>

- 다수의 리스너를 동일한 프라미스에 붙일 수 있다.
- `then()` 리스너는 한번만 호출할 수 있으며, 프라미스가 이미 해결된 후에도 연결되어 작동한다. 게다가 `then()`은 항상 비동기적으로 호출된다.

<p>
    첫 번째 특성은 요청을 일괄 처리하는데 필요한 것이며, 두 번째 특징은 해결된 값에 대한 캐시를 의미하여 일관된 비동기 방식으로 캐시된 값을 반환하는 자연스러운 메커니즘을 제공한다. 이는 프라미스를 사용하면 일괄 처리와 캐싱이 매우 단순하고 간결하다는 것을 의미한다.
</p>

```javascript
// totalSalesPromises.js
const pify = require('pify'); // 1.
const totalSales = pify(require('./totalSales'));

const cache = {};
module.exports = function totalSalesPromises(item) {
    if (cache[item]) { // 2.
        return cache[item];
    }

    cache[item] = totalSales(item) // 3.
        .then(res => { // 4.
            setTimeout(() => {delete cache[item]}, 30 * 1000);
            return res;
        })
        .catch(err => { // 5.
            delete cache[item];
            throw err;
        });
    return cache[item]; // 6.
};
```

1. 먼저 원래 `totalSales()`에 프라미스를 적용하기 위해 pify라는 모듈을 사용했다. 이를 사용하면 `totalSales()`는 콜백 대신 ES2015 프라미스를 반환한다.
2. `totalSalesPromises()` 래퍼가 호출될 때 주어진 항목 유형에 대해 캐시된 프라미스가 이미 존재하는지 체크한다. 이미 그런 프라미스가 존재한다면, 그것을 다시 호출자에게 반환한다.
3. 주어진 항목 유형에 대한 캐시에 프라미스가 없으면 원래 `totalSales()` API를 호출하여 프라미스를 만든다.
4. 프라미스가 해결되면 캐시는 지우는 시간을 설정하고 프라미스를 listen하고 있는 모든 then 리스너에 작업 결과를 전파하기 위해 res를 반환한다.
5. 프라미스가 오류로 거부되면 즉시 캐시를 재설정하고 오류를 던져 프라미스 체인에 전파하므로 동일한 프라미스에 연결된 다른 모든 리스너들도 오류를 수신할 수 있다.
6. 끝을로 방금 만든 캐시된 프라미스를 반환한다.

```javascript
// appPromises.js
const http = require('http');
const url = require('url');
const totalSales = require('./totalSalesPromises');

http.createServer(function(req, res) {
    const query = url.parse(req.url, true).query;
    totalSales(query.item).then(function(sum) {
        res.writeHead(200);
        res.end(`Total sales for item ${query.item} is ${sum}`);
    });
}).listen(8000, function() {console.log('Started')});
```

<p>
    기존의 app.js와 유사하나 프라미스 기반의 일괄 처리/캐싱 래퍼를 사용한다는 점에서 차이가 있다.
</p>

## 3. CPU 바운딩(CPU-bound) 작업 실행

> 이벤트 루프를 제어하지 못하는 긴 동기식 작업을 I/O 작업이 많지 않고 CPU의 사용량이 많다는 특징 때문에 CPU 바운딩이라고 한다.

### 3-1 부분 집합의 합 문제 해결

<p>
    대표적인 문제로 어떤 정수 집합 내에 총 합이 0인 비어있지 않은 부분 집합이 있는지 확인하는 문제가 있다. 예를 들어 집합 [1, 2, -4, 5, -3]을 입력으로 하면, 만족하는 부분 집합은 [1, 2, -3]과 [2, -4, 5, -3]이 있다.
</p>

<p>
    이를 위한 가장 단순한 알고리즘은 모든 조합 가능한 부분 집합들을 검사하는 것인데, 이는 계산 비용이 O(2n)이거나 입력에 따라 기하급수적으로 커진다. 20개의 정수로 구성된 집합을 검사할 때 최대 1,048,576개의 조합이 필요하며, 예시를 구현하여 시험하는데는 나쁘지 않은 예시이다. 따라서 어렵게 만들기 위해 주어진 sum 변수와 같은 가능한 모든 조합을 계산한다.
</p>

```javascript
// subsetSum.js - 1
const EventEmitter = require('events').EventEmitter;

class SubsetSum extends EventEmitter {
    constructor(sum, set) {
        super();
        this.sum = sum;
        this.set = set;
        this.totalSubsets = 0;
    }
// ...
```

<p>
    SubsetSum 클래스는 EventEmitter 클래스에서 확장되며, 입력으로 받은 합계와 일치하는 새 부분 집합을 찾을 때마다 이벤트를 생성할 수 있다.
</p>

```javascript
// subsetSum.js - 2
 _combine(set, subset) {
    for(let i = 0; i < set.length; i++) {
        let newSubset = subset.concat(set[i]);
        this._combine(set.slice(i + 1), newSubset);
        this._processSubset(newSubset);
    }
}
```

- `_combine()` 메소드는 완전한 동기식이다. 이벤트 루프에 제어권을 되돌려 주지 않고 모든 조합 가능한 부분 집합들을 재귀적으로 생성한다. I/O를 필요로 하지 않는 알고리즘의 경우로는 알맞은 경우이다.
- 새로운 조합이 생성될 때마다 `_processSubset()` 메소드에 추가적인 처리를 위해 전달된다.

```javascript
// subsetSum.js - 3
_processSubset(subset) {
    console.log('Subset', ++this.totalSubsets, subset);
    const res = subset.reduce((prev, item) => (prev + item), 0);
    if(res == this.sum) {
        this.emit('match', subset);
    }
}
```

<p>
    `_processSubset()` 메소드는 해당 요소의 합을 계산하기 위해 부분 집합에 reduce 연산을 적용한다. 그 후 결과 합계가 우리가 찾고자 하는 것과(this.sum) 같을 때 'match' 이벤트를 내보낸다.
</p>

```javascript
// subsetSum.js - 4
start() {
    this._combine(this.set, []);
    this.emit('end');
}
```

<p>
    `start()` 메소드는 `_combine()`을 호출하여 모든 조합을 생성하는 작업을 시키고, 끝으로 모든 조합이 검사되었으며 모든 예상되는 일치 결과가 emit되었음을 알리는 'end' 이벤트를 내보낸다. 따라서 함수가 반환되자마자 'end' 이벤트가 발생하므로 모든 조합이 계산되었음을 의미한다.
</p>

```javascript
// app.js
const http = require('http');
const SubsetSum = require('./subsetSum');

http.createServer((req, res) => {
    const url = require('url').parse(req.url, true);
    if (url.pathname === '/subsetSum') {
        const data = JSON.parse(url.query.data);
        res.writeHead(200);
        const subsetSum = new SubsetSum(url.query.sum, data);
        subsetSum.on('match', match => {
            res.write('Match: ' + JSON.stringify(match) + '\n');
        });
        subsetSum.on('end', () => res.end());
        subsetSum.start();
    } else {
        res.writeHead(200);
        res.end('I\m alive!\n');
    }
}).listen(8000, () => console.log('Started'));
```

<p>
    SubsetSum 알고리즘을 호출하는 URL을 /subsetSum?data?=`Array`&sum=`Integer` 형식으로 구현하였다. 또 다른 세부 항목은 서버가 /subsetSum이 아닌 다른 URL을 누를 때마다 텍스트로 응답하는 것이다.
</p>

### 3-2 setImmediate를 사용한 인터리빙

<p>
    이전의 subsetSum.js를 약간 수정하여 subsetSumDefer.js를 생성한다.
</p>

```javascript
_combineInterleaved(set, subset) {
    this.runningCombine++;
    setImmediate(() => {
        this._combine(set, subset);
        if(--this.runningCombine === 0) {
            this.emit('end');
        }
    });
}
```

<p>
    `setImmediate()`를 사용하여 원본(동기) `_combine()` 메소드 호출을 연기한다. 하지만 알고리즘이 더 이상 동기화되지 않기 때문에 함수가 언제 모든 조합의 생성을 완료했는지 알기가 어려워진다. 이를 위해 `combine()` 메소드의 모든 인스턴스가 실행을 완료하면 프로세스가 완료되었다는 것을 리스너에게 알리는 end 이벤트를 내보낸다.
</p>

```javascript
_combine(set, subset) {
    for(let i = 0; i < set.length; i++) {
        let newSubset = subset.concat(set[i]);
        this._combineInterleaved(set.slice(i + 1), newSubset);
        this._processSubset(newSubset);
    }
}
```

<p>
    기존의 `_combine()` 메소드의 재귀적 단계를 지연된 단계로 교체한다. 알고리즘의 각 단계가 동기적으로 실행되는 대신 `setImmediate()`를 사용하여 이벤트 루프에서 대기열에 추가되고, 보류중인 I/O 요청의 실행 후에 실행되도록 한다.
</p>

```javascript
start() {
    this.runningCombine = 0;
    this._combineInterleaved(this.set, []);
}
```

<p>
    `start()` 메소드는 `_combine()` 메소드의 실행 인스턴스의 수를 0으로 초기화하고, `combineInterleaved()`로 대체하며, end 이벤트 발생을 제거한다. 이후에 app.js에서 새 모듈로 수정한다.
</p>

#### 인터리빙 패턴에 대한 고려 사항

<p>
    대기중인 입출력 다음에 알고리즘의 다음 단계를 예약하기 위해서는 `setImmedidate()`를 사용해야 한다. 하지만 이것이 효율성 측면에서 최고의 패턴은 아니다. 실제로 작업을 지연하면 알고리즘이 실행해야 하는 모든 단계를 곱한 작은 오버헤드가 발생하며, 이는 중요한 영향을 미칠 수 있다. 이는 일반적으로 CPU 바운드 작업을 실행하고자 할 때 마지막으로 처리해야 하는 작업이다. 특히 사용자에게 결과를 직접 반환해야 하는 경우에는 적절한 시간 내에 처리를 해야 한다. 문제를 완화할 수 있는 가능한 해결책은 `setImmedidate()`를 매 단계마다 사용하는 대신, 특정 단계 후에만 사용하는 것이다. 하지만 문제의 근원은 해결되지 않는다.
</p>

<p>
    앞선 예시의 패턴이 꼭 피해야 한다는 것을 의미하지는 않는다. 사용량이 많은 서버에서는 이벤트 루프를 200밀리 초 동안 차단하는 작업조차도 원치 않는 지연을 만들어 낼 수 있다. 작업이 산발적으로 또는 백그라운드에서 실행되고 너무 오랫동안 실행하지 않아도 되는 상황에서는 `setImmedidate()`를 사용하여 실행을 인터리브하는 것이 이벤트 루프를 차단하는 것을 피하는 가장 간단하고 효과적인 방법이다.
</p>

### 3-3 멀티 프로세스 사용

<p>
    이벤트 루프를 막지 못하도록 하는 또 다른 패턴은 자식 프로세스를 사용하는 것이다. Node.js에서는 웹 서버와 같은 I/O 집약적인 어플리케이션을 실행할 때 최상의 성능을 제공하는 비동기식 아키텍처 덕분에 리소스 사용률을 최적화할 수 있다. 어플리케이션의 응답성을 유지하는 가장 좋은 방법은 값비싼 CPU 관련 작업을 기본 어플리케이션의 컨텍스트에서 실행하지 않고 대신 별도의 프로세스를 사용하는 것이다. 이에 세 가지 주요 장점이 있다.
</p>

- 동기화 작업의 실행 단계를 인터리빙할 필요 없이 최대 속도로 실행될 수 있다.
- Node.js의 프로세스로 작업하는 것은 간단하다. 알고리즘을 수정하여 `setImmediate()`를 사용하는 것보다 쉬우며, 메인 어플리케이션 자체를 확장할 필요 없이 다중 프로세서를 쉽게 사용할 수 있다.
- 최고의 성능이 필요하다면, ANSI C와 같은 저 수준 언어로 작성된 외부 프로세스를 실행할 수도 있다.

<p>
    Node.js는 외부 프로세스와 상호작용 할 수 있는 일련의 API 도구들을 제공한다. child_process 모듈에서 필요한 것을 찾을 수 있으며, 외부 프로세스가 Node.js 프로그램일 때 메인 어플리케이션에 연결하는 것처럼 매우 쉽다. 이는 `child_process.fork()` 함수를 이용하여 만들며, 새로운 child Node.js 프로세스를 생성하고 자동으로 통신 채널을 생성하여 EventEmitter와 매우 유사한 인터페이스를 사용하여 정보를 교환할 수 있도록 한다.
</p>

#### 부분 집합 합계 작업을 다른 프로세스에 위임

- processPool.js라는 새로운 모듈을 만들어 실행 중인 프로세스 풀을 생성한다. 새로운 프로세스를 시작하기 위해서는 많은 비용과 시간이 필요하며, 프로세스를 지속적으로 실행하고 요청을 처리할 준비가 미리 되어 있다면 시간과 CPU를 절약할 수 있다. 또한 Pool은 어플리케이션이 서비스 거부(DoS) 공격에 노출되지 않도록 동시에 실행되는 프로세스 수를 제한하는데 도움이 된다.
- 다음으로 자식 프로세스에서 실행중인 SubsetSum 작업을 추상화하는 subsetSumFork.js라는 모듈을 작성한다. 그 역활은 자식 프로세스와 통신하고 현재 어플리케이션에서 한 것처럼 작업 결과를 표시한다.
- 마지막으로 하위 집합 합계 알고리즘을 실행하고 그 결과를 부모 프로세스로 전달하는 목적으로 새로운 Node.js 프로그램인 작업자(Worker, 자식 프로세스)가 필요하다.

##### 프로세스 풀 구현

```javascript
// processPool.js - 1
const fork = require('child_process').fork;

class ProcessPool {
    constructor(file, poolMax) {
        this.file = file;
        this.poolMax = poolMax;
        this.pool = [];
        this.active = [];
        this.waiting = [];
    }
// ...
```

- pool: 사용할 준비가 된 실행중인 프로세스 집합
- active: 현재 사용중인 프로세스 목록을 표시
- waiting: 사용 가능한 프로세스가 부족하여 즉시 수행할 수 없는 모든 요청에 대한 콜백 큐

```javascript
// processPool.js - 2
acquire(callback) {
    let worker;
    if(this.pool.length > 0) { // 1.
        worker = this.pool.pop();
        this.active.push(worker);
        return process.nextTick(callback.bind(null, null, worker));
    }

    if(this.active.length >= this.poolMax) { // 2.
        return this.waiting.push(callback);
    }

    worker = fork(this.file); // 3.
    this.active.push(worker);
    process.nextTick(callback.bind(null, null, worker));
}
```

<p>
    이 메소드는 사용할 준비가 된 프로세스를 반환한다.
</p>

1. 풀에서 사용할 준비가 된 프로세스가 있으면 활성 목록으로 이동한 다음, 콜백을 호출하여 반환한다.
2. 풀에 사용 가능한 프로세스가 없고 실행중인 프로세스의 최대 수에 도달했으면 사용할 수 있을 때까지 기다려야 한다. 현재 콜백을 대기 목록들이 들어 있는 큐에 넣음으로써 이 작업을 수행한다.
3. 실쟁 중인 프로세스의 최대 수에 아직 도달하지 않은 경우, `child_process.fork()`를 사용하여 새로운 프로세스를 만들고 활성 목록에 추가한 후 콜백을 사용하여 호출자에게 반환한다.

```javascript
// processPool.js - 3
release(worker) {
        if(this.waiting.length > 0) { // 1.
            const waitingCallback = this.waiting.shift();
            waitingCallback(null, worker);
        }
        this.active = this.active.filter(w => worker !==  w); // 2.
        this.pool.push(worker);
    }
```

<p>
    이 메소드는 프로세스를 다시 풀에 넣는다.
</p>

1. waiting 목록에 요청이 있는 경우 해당 작업자를 waiting 대기열의 맨 앞에 있는 콜백에 재할당하여 제거한다.
2. 그렇지 않으면 작업 목록에서 작업자를 제거하고 다시 풀에 넣는다.

<p>
    장기간 메모리 사용을 줄이고 프로세스 풀의 견고성을 확보하기 위해 가능한 조치는 다음과 같다.
</p>

- 일정 시간 동안 사용하지 않으면 유휴 프로세스를 종료하여 메모리를 비운다.
- 반응이 없는 프로세스를 죽이거나 에러가 난 프로세스는 다시 시작시킨다.

##### 자식 프로세스와 통신하기

```javascript
// subsetSumFork.js
const EventEmitter = require('events').EventEmitter;
const ProcessPool = require('./processPool');
const workers = new ProcessPool(__dirname + '/subsetSumWorker.js', 2);

class SubsetSumFork extends EventEmitter {
    constructor(sum, set) {
        super();
        this.sum = sum;
        this.set = set;
    }

    start() {
        workers.acquire((err, worker) => { // 1.
        worker.send({sum: this.sum, set: this.set});

        const onMessage = msg => {
            if (msg.event === 'end') { // 3.
                worker.removeListener('message', onMessage);
                workers.release(worker);
            }

            this.emit(msg.event, msg.data); // 4.
        };

        worker.on('message', onMessage); // 2.
        });
    }
}

module.exports = SubsetSumFork;
```

<p>
    위의 코드는 Worker와 통신하여 생성된 결과를 알려주는 역활을 수행할 SubsetSumFork 래퍼를 구현한 것이다. 자식 작업자로 subsetSumWorker.js라는 파일을 사용하여 프로세스 풀 객체를 초기화하였고, 풀의 최대 용량도 2로 설정하였다. 또한 SubsetSum 클래스와 동일한 공용 API를 유지하려고 하고 있다. SubsetSumFork는 sum과 set을 인자로 받는 생성자를 가진 EventEmitter이며, `start()` 메서드는 별도의 프로세스에서 실행되어 알고리즘의 실행을 시작시킨다. 다음은 `start()` 메서드가 호출되면 발생하는 일이다.
</p>

1. pool에서 새로운 자식 프로세스를 얻는다. 이 일이 발생하면 즉시 작업자 핸들을 사용하여 자식 프로세스들이 실행할 작업과 함께 메시지를 보낸다. `send()` API는 Node.js에 의해 `child_process.fork()`로 시작하는 모든 프로세스에 자동으로 제공된다. 본질적으로 이것이 통신 채널이다.
2. `on()` 메서드를 사용하여 새로운 리스너를 연결하여 작업자 프로세스에서 반환된 메시지를 수신하기 시작한다.
3. 리스너에서 먼저 end 이벤트를 수신했는지 여부를 확인한다. 즉, SubsetSum 작업이 완료되면 onMessage 리스너를 제거하고 작업자를 해제하여 pool에 다시 넣는다.
4. 작업자는 {event, data} 형식으로 메시지를 생성하여 자식 프로세스에서 생성된 모든 이벤트를 매끄럽게 지속적으로 발생시킬 수 있도록 한다.

##### 부모 프로세스와 통신

```javascript
// subsetSumWorker.js
const SubsetSum = require('./subsetSum');

process.on('message', msg => { // 1.
    const subsetSum = new SubsetSum(msg.sum, msg.set);
    
    subsetSum.on('match', data => { // 2.
        process.send({event: 'match', data: data});
    });
  
    subsetSum.on('end', data => {
        process.send({event: 'end', data: data});
    });
    
    subsetSum.start();
});
```

<p>
    작업자가 자식 프로세스로 시작되면 다음과 같은 일이 일어난다.
</p>

1. 부모 프로세스의 메시지 수신을 즉시 시작한다. 이는 `process.on()` 함수를 사용하여 쉽게 수행할 수 있다. 부모 프로세스로부터 기대하는 유일한 메시지는 새로운 SubsetSum 작업에 입력으로 제공할 정보이다. 그러한 메시지가 수신되자마자 SubsetSum 클래스의 새로운 인스턴스를 만들고 match 및 end 이벤트에 대한 리스너를 등록한다. 마지막으로 `subsetSum.start()`로 연산을 시작한다.
2. 실행중인 알고리즘에서 이벤트를 수신할 때마다 {event, data} 형식의 객체에 래핑하여 부모 프로세스에 전달한다. 이 메시지는 subsetSumFork.js 모듈에서 처리된다.

#### 멀티 프로세스 패턴에 대한 고려 사항

<p>
    app.js를 수정한 뒤, 실행하면 이전에 보았던 인터리빙 패턴과 마찬가지로 이 새로운 버전의 subsetSum 모듈을 사용하면 CPU 바운드 작업을 실행하는 동안 이벤트 루프가 차단되지 않는다. 또한 부분 집합 합계 작업 두 개를 동시에 시작시키면 두 개의 서로 다른 프로세서를 최대한 활용하여 실행하도록 할 수 있다. 다만, 동시 처리를 2개의 프로세스로 제한했기 때문에 세 개의 작업을 동시 실행하려고 하면 마지막으로 시도했던 작업이 중단된다.
</p>

<p>
    멀티 프로세스 패턴은 인터리빙 패턴보다 인터리빙 패턴보다 강력하고 유연하다. 그러나 단일 시스템에서 제공하는 자원의 양은 여전히 제한적이므로 확장성에 한계가 있다. 이 경우 대답은 여러 컴퓨터에 걸쳐 부하를 분산시키는 것이다.
</p>
