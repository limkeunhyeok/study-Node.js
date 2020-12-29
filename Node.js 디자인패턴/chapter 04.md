# Chapter 04 - ES2015 이후 비동기식 프로그램의 제어 흐름 패턴

## 1. 프라미스(Promise)

### 1-1 프라미스란 무엇인가?

- 프라미스란 함수가 Promise라는 객체를 반환할 수 있도록 하는 추상화이며, Promise는 비동기 작업의 최종 결과
- 프로미스 용어
  - pending(대기중): 비동기 작업이 완료되지 않음
  - fulfilled(이행됨): 성공적으로 끝남
  - rejected(거부됨): 작업이 실패하여 종료됨
  - setted(처리됨): 프라미스가 이행되거나 거부됨

```javascript
promise.then([onFulfilled], [onRejected])
```

<p>
    위 코드에서 `onFulfilled()`는 최종적으로 프라미스의 이행 값을 받는 함수이고, `onRejected()`는 거부 이유(rejection reason, 있을 경우)를 받게 된다. 두 함수 모두 선택 사항이다.
</p>

```javascript
// 기존 스타일의 코드
asyncOperation(arr, (err, result) => {
    if (err) {
        // 에러 처리
    } else {
        // 결과 처리
    }
});

// 프라미스 사용 코드
asyncOperation(arg)
    .then(result => {
        // 결과 처리
    }, err => {
        // 에러 처리
});
```

- then 메소드가 반환하는 프라미스
  - x가 값이면 이행(fulfill) 값 x를 가지고 핸들러가 호출된다.
  - x가 프라미스거나 thenable인 경우, x를 가지고 이행된 값을 가지고 핸들러가 호출된다.
  - x가 프라미스거나 thenable인 경우, x의 거부 이유로 에러 핸들러가 호출된다.

![1](https://user-images.githubusercontent.com/38815618/103156251-082cb880-47ea-11eb-9756-75460b5fcbfc.PNG)

<p>
    위의 그림은 프라미스 체인이 동작하는 방식을 설명한 것이다.
</p>

<p>
    프라미스의 다른 중요한 특성은 값을 가지고 동기적으로 프라미스를 해결한다고 할지라도 `onFulfilled()`와 `onRejected()` 함수에 대한 비동기적인 호출을 보장한다. 이것은 실수로 자르고를 풀어 놓을 수도 있는 상황에 대비하여 코드를 보호함으로써 큰 노력을 들이지 않고 비동기 코드를 일관성 있고 견고하게 만든다.
</p>

<p>
    `onFulfilled()`와 `onRejected()` 핸들러에서 예외가 발생한 경우, `then()` 메소드를 통해 반환된 프라미스는 발생한 예외를 이유로 거부된다. 이것은 예외가 프라미스들을 통해 자동으로 체인 전체에 전파되며 throw 문을 사용할 수도 있다는 점에서 CPS에 비교하면 엄청난 이점이다.
</p>

### 1-2 Promise/A+ 구현

#### ES2015의 프라미스에 의해 제공되는 API 목록

- 생성자(new Promise(function(resolve, reject) {}))
  - 인자로 전달된 함수의 동작을 기반으로 이행하거나 거부하는 새로운 프라미스를 만든다.
  - resolve(obj): 값이 thenable인 경우 반환된 프라미스는 then 메소드를 처리하고 마지막 상태를 취한다. 그렇지 않은 경우 반환된 프라미스는 주어진 값으로 이행한다.
  - reject(err): err를 이유로 프라미스를 거부한다. err는 Error의 인스턴스를 나타낸다.
- Promise 객체의 정적 메소드들
  - Promise.resolve(obj): thenable이나 값으로 새로운 프라미스를 생성한다.
  - Promise.reject(err): 주어진 이유로 거부되는 프라미스 객체를 만든다.
  - Promise.all(iterable): 반복 가능한 객체의 모든 항목들이 이행되고 나면 모든 이행 값들을 가지고 이행하는 프라미스를 생성하는데, 하나의 항목이라도 거부될 경우 첫 번째 거절 이유를 가지고 거절된다. 반복 가능한 객체 내 항목들은 프라미스, thenable 또는 그냥 값일 수 있다.
  - Promise.race(iterable): 이것은 반복 가능한 객체 내에 있는 프라미스들 중 가장 먼저 이행되거나 거절된 결과를 가지고 이행되거나 거부되는 프라미스를 반환한다.
- Promise 인스턴스의 메소드들
  - promise.then(onFulfilled, onRejected): 프라미스의 필수 메소드로 이 동작은 Promise/A+ 표준과 호환된다.
  - promise.catch(onRejected): 위 메소드와 동일한 동작을 하는 간편 버전이다.

### 1-3 Node.js 스타일 함수 프라미스화하기

```javascript
module.exports.promisify = function(callbackBasedApi) {
    return function promisified() {
        const args = [].slice.call(arguments);
        return new Promise((resolve, reject) => {    //[1]
            args.push((err, result) => {      //[2]
                if(err) {
                    return reject(err);          //[3]
                }
                if(arguments.length <= 2) {        //[4]
                    resolve(result);
                } else {
                    resolve([].slice.call(arguments, 1));
                }
            });
            callbackBasedApi.apply(null, args);      //[5]
        });
    }
};
```

1. promisified() 함수는 프라미스 생성자를 사용하여 새로운 프라미스를 생성한 후, 즉시 호출자에게 반환한다.
2. 프라미스의 생성자에 전달된 함수에서 특별한 콜백을 만들어 callbackBasedApi로 전달해야 한다. 콜백이 항상 마지막 인자에 위치하는 것을 알고 있으므로, 간단하게 promisified() 함수에 전달된 인자 목록에 추가해주면 된다.
3. 콜백에서 오류가 발생하면 즉시 프라미스를 거부한다.
4. 오류가 수신되지 않으면 콜백에 전달되는 결과 수에 따라 값 또는 값의 배열로 프라미스를 결정한다.
5. 마지막으로 callbackBasedApi를 만든 인자들의 목록을 가지고 호출한다.

### 1-4 공개 API로 콜백과 프라미스 노출하기

<p>
    request, redis, mysql과 같은 라이브러리에서 사용되는 첫 번째 접근 방식은 콜백에만 기반을 둔 간단한 API를 제공하고, 필요한 경우 공개된 기능을 프라미스화 할 수 있는 옵션을 제공하는 것이다. 이 라이브러리들 중 일부는 제공하는 모든 비동기 함수들을 프라미스화 할 수 있는 헬퍼들을 제공하고 있지만, 여전히 개발자들은 공개된 API를 어느 정도 프라미스로 사용할 수 있게 전환할 수 있어야 한다.
</p>

<p>
    두 번째 접근 방식은, 콜백 지향 API를 제공하지만 콜백 인자를 선택적으로 만든다. 콜백이 인자로 전달될 때마다 함수는 평범하게 작동해서 완료되거나 실패할 때 콜백을 실행한다. 인자로 콜백이 전달되지 않으면 함수는 즉시 Promise 객체를 반환한다. 이 접근법은 콜백과 프라미스를 효과적으로 결합하여 개발자가 사전에 함수를 프라미스화 할 필요 없이 인터페이스 호출 시 선택할 수 있도록 한다.
</p>

```javascript
// 나눗셈을 비동기적으로 실행하는 모듈
module.exports = function asyncDivision (dividend, divisor, cb) {
    return new Promise((resolve, reject) => {  // [1]

        process.nextTick(() => {
            const result = dividend / divisor;
            if (isNaN(result) || !Number.isFinite(result)) {
                const error = new Error('Invalid operands');
                if (cb) { cb(error); }  // [2]
                return reject(error);
            }

            if (cb) { cb(null, result); }  // [3]
            resolve(result);
        });

    });
};

// test.js
var asyncDivision = require('./index.js');

// callback oriented usage
asyncDivision(10, 2, (error, result) => {
    if (error) {
        return console.error(error);
    }
    console.log(result);
});

// promise oriented usage
asyncDivision(22, 11)
    .then(result => console.log(result))
    .catch(error => console.error(error))
;
```

1. Promise 생성자를 사용하여 생성된 새로운 프라미스를 반환하고 있다. 위의 코드는 생성자에 인자로 전달된 함수의 내부에 전체 로직을 정의하였다.
2. 오류 발생 시 프라미스를 거부하지만, 호출 시 콜백이 전달되었을 경우에는 콜백을 실행하여 에러를 전파한다.
3. 결과를 계산한 후에 프라미스를 결정하지만, 이 때도 콜백이 존재하면 그 결과를 콜백에도 전달한다.

## 2. 제너레이터(Generator)

### 2-1 제너레이터의 기본

<p>
    제너레이터 함수는 function 키워드 다음에 *(별표) 연산자를 추가하여 선언할 수 있다. 제너레이터 함수 내 yield 키워드는 실행을 일시 중지하고 전달된 값을 호출자에게 반환할 수 있다. 제너레이터 객체의 next 메소드는 제너레이터의 실행을 시작/재시작하는데 사용되며 value(생성한 값)와 done(실행이 완료되었는지 나타내는 플래그) 값을 가진 객체를 반환한다.
</p>

#### 간단한 예시

```javascript
function* fruitGenerator() {
    yield 'apple';
    yield 'orange';
    return 'watermelon';
}

const newFruitGenerator = fruitGenerator();
console.log(newFruitGenerator.next()); // 1. { value: 'apple', done: false }
console.log(newFruitGenerator.next()); // 2. { value: 'orange', done: false }
console.log(newFruitGenerator.next()); // 3. { value: 'watermelon', done: true }
```

1. `newFruitGenerator.next()`가 처음으로 호출되었을 때, 제너레이터는 첫 번째 yield 명령에 도달할 때까지 실행을 계속한다. 이 명령은 제너레이터를 일시 중지시키고 값 apple을 호출자에게 반환한다.
2. `newFruitGenerator.next()`를 두 번째 호출하면 제너레이터는 두 번째 yield 명령에서 실행을 시작하여 다시 실행을 일시 중지하고 orange 값을 호출자에게 반환한다.
3. `newFruitGenerator.next()`의 마지막 호출은 제너레이터의 마지막 명령으로 제너레이터를 끝내는 return 문에서 재시작하여 value를 watermelon으로 설정하고 done을 true로 설정하여 반환한다.

#### 반복자(Iterator)로서의 제너레이터

```javascript
function* iteratorGenerator(arr) {
    for(let i = 0; i < arr.length; i++) {
        yield arr[i];
    }
}

const iterator = iteratorGenerator(['apple', 'orange', 'watermelon']);
let currentItem = iterator.next();
while(!currentItem.done) {
    console.log(currentItem.value);
    currentItem = iterator.next();
}
```

<p>
    위 코드에서 `iterator.next()`를 호출할 때마다 제너레이터의 for 루프를 다시 시작한다. 이것은 배열의 다음 항목을 반환(yielding)하는 다음 사이클을 실행하며, 호출될 때마다 제너레이터의 내부 상태가 유지되는 모습을 보여준다. 루프가 다시 시작될 때 모든 변수들의 상태는 실행이 일시 중지되었을 때와 완전히 동일하다.
</p>

#### 값을 제너레이터로 전달하기

```javascript
function* twoWayGenerator(arr) {
    const what = yield null;
    console.log('Hello ' + what);
}

const twoWay = twoWayGenerator();
twoWay.next();
twoWay.next('world'); // Hello world
```

1. `next()` 메소드가 처음 호출되면 제너레이터는 첫 번째 yield 문에 도달한 다음, 일시 중지 상태가 된다.
2. `next('world')`가 호출되면 제너레이터는 yield 명령에 있는 일시 중지 지점에서 다시 시작되지만, 이번에는 제너레이터로 전달되는 값을 갖고 있다. 이 값은 what 변수에 설정된다. 제너레이터는 `console.log()` 명령을 실행하고 종료한다.

```javascript
const twoWay = twoWayGenerator();
twoWay.next();
twoWay.throw(new Error());
```

<p>
    throw 메소드를 통해 예외를 던질 수 있도록 강제할 수 있다. 이 예외는 제너레이터 내부에서 예외가 발생하는 것과 똑같이 작동하며, 이는 `try ... catch` 블록을 사용한 다른 exception들처럼 catch할 수 있고 처리할 수 있다.
</p>

### 2-2 제너레이터를 사용한 비동기 제어 흐름

```javascript
// 자기 자신의 복사본을 만드는 clone.js
"use strict";

const fs = require('fs');
const path = require('path');

function asyncFlow(generatorFunction) {
    function callback(err) {
        if (err) {
            return generator.throw(err);
        }
        const results = [].slice.call(arguments, 1);
        generator.next(results.length > 1 ? results : results[0]);
    }
    const generator = generatorFunction(callback);
    generator.next();
}

asyncFlow(function* (callback) {
    const fileName = path.basename(__filename);
    const myself = yield fs.readFile(fileName, 'utf8', callback);
    yield fs.writeFile(`clone_of_${fileName}`, myself, callback);
    console.log('Clone created');
});
```

<p>
    `asyncFlow()` 함수는 제너레이터를 입력으로 받아 callback과 함께 인스턴스화 한 다음, 즉시 실행을 시작한다. 인자로 받은 `generatorFunction()`는 특별한 callback을 인자로 받는데, callback은 오류가 수신되면 `generator.throw()`를 호출하고, 그렇지 않으면 콜백 함수가 받은 결과를 다시 인자로 전달하여 제너레이터의 실행을 재개한다.
</p>

<p>
    제너레이터를 이용한 순차적 접근 비동기 코드 작성 방식에는 yield를 지정하여 반환받을 수 잇는 객체의 유형으로 프라미스를 사용하는 것과 썽크(thunk)를 사용하는 두 가지 변형된 기술이 있다.
</p>

```javascript
"use strict";

const fs = require('fs');
const path = require('path');

function asyncFlowWithThunks(generatorFunction) {
    function callback(err) {
        if (err) {
            return generator.throw(err); 
        }
        const results = [].slice.call(arguments, 1);
        const thunk = generator.next(results.length > 1 ? results : results[0]).value;
        thunk && thunk(callback);
    }
    const generator = generatorFunction();
    const thunk = generator.next().value;
    thunk && thunk(callback);
}

const readFileThunk = (filename, options) => {
    return (cb) => {
        fs.readFile(filename, options, cb);
    }
};

const writeFileThunk = (filename, options) => {
    return (cb) => {
        fs.writeFile(filename, options, cb);
    }
};

asyncFlowWithThunks(function* () {
    const fileName = path.basename(__filename);
    const myself = yield readFileThunk(fileName, 'utf8');
    yield writeFileThunk(`clone_of_${fileName}`, myself);
    console.log('Clone created');
});
```

<p>
    제너레이터 기반 제어 흐름에서 사용되는 썽크는 콜백을 제외한 원래 함수의 모든 인자들을 그대로 기억하고 있는 일종의 함수이다. 반환값은 원래 함수의 인자들을 제외한 콜백만을 인자로 취하는 또 다른 함수이다. 위 코드에서 트릭은 썽크를 가진 `generator.next()`의 반환값을 읽는 것이다. 그 다음은 특별한 콜백을 전달하여 썽크를 호출하는 것이다.
</p>

#### co를 사용한 제너레이터 기반의 제어 흐름

<p>
    Node.js 생태계에는 제너레이터를 사용해 비동기 제어 흐름을 처리할 수 있는 몇 가지 솔루션이 있으며 co도 그 중 하나이다. co는 몇 가지 yield를 지정할 수 있는 객체들을 지원하는데 다음과 같다.
</p>

- Thunks
- Promise
- Arrays(병렬 실행)
- Object(병렬 실행)
- Generators(delegation)
- Generator functions(delegation)

<p>
    또한 co는 다음 자체적인 생태계를 가지고 있다.
</p>

- 가장 인기있는 웹 프레임워크인 koa
- 특정 제어 흐름 패턴을 구현한 라이브러리
- co를 지원하기 위해 널리 사용되는 API를 랩핑한 라이브러리
