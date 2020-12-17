# Chapter 02 - Node.js 필수 패턴

## 1. 콜백 패턴

<p>
    콜백은 리액터 패턴 핸들러를 구현한 것이며, Node.js에 독특한 프로그래밍 스타일을 제공하는 상징 중 하나이다. 콜백은 작업 결과를 전달하기 위해 호출되는 함수이며, 비동기 작업을 처리할 때 반드시 필요하다. 자바스크립트에서 함수는 일급 클래스 객체이기 때문에 콜백을 표현하기 좋다. 콜백을 구현하는 또 다른 이상적인 구조는 클로저이다. 클로저를 사용하면 실제로 함수가 작성된 환경을 참조할 수 있다. 콜백이 언제 어디서 호출되는 지에 관계없이 비동기 작업이 요청된 컨텍스트를 항상 유지할 수 있기 때문이다.
</p>

### 1-1 연속 전달 방식(The Continuation-Passing Style)

- 함수형 프로그래밍에서 결과를 전달하는 이러한 방식을 연속 전달 방식(CPS)이라 한다.
  - 단순히 결과를 호출자에게 직접 반환하는 대신 다른 함수(콜백)로 전달함으로써 결과를 전달하는 것을 말한다.

#### 동기식 연속 전달 방식

```javascript
function add(a, b) {
    return a + b;
}
```

- 위의 코드 처럼 결과를 return 문을 통해 호출자에게 전달하는 것을 직접 스타일(direct style)이라고 한다.

```javascript
function add(a, b, callback) {
    callback(a + b);
}
```

- 위의 코드는 앞선 함수와 동일한 처리를 연속 전달 방식으로 바꾼 것이다.

```javascript
console.log('before');
add(1, 2, result => console.log('Result: ' + result));
console.log('after');

// before
// Result: 3
// after
```

- 위의 코드는 앞선 add 함수를 사용한 것으로 동기 함수이기 때문에 순차적으로 출력된다.

#### 비동기 연속 전달 방식

```javascript
function additionAsync(a, b, callback) {
    setTimeout(() => callback(a + b), 100);
}

console.log('before');
additionAsync(1, 2, result => console.log('Result: ' + result));
console.log('after');

// before
// after
// Result: 3
```

- 위의 코드는 비동기 호출로 앞선 코드와 달리, 콜백의 실행이 끝날 때까지 기다리지 않고 즉시 반환되어 위와 같이 출력된다.
- 비동기 작업이 완료되면 실행은 비동기 함수에 제공된 콜백에서부터 다시 계속된다.

#### 비 연속 전달(Non-continuation-passing)

```javascript
const result = [1, 5, 7].map(element => element - 1);
console.log(result); // [0, 4, 6]
```

<p>
    함수에 콜백 인자가 있다고 해서 항상 비동기식이나 연속 전달 스타일이 아니다. 위의 코드처럼 콜백은 배열 내의 요소를 반복하는데 사용될 뿐 연산 결과를 전달하지 않는다.
</p>

### 1-2 동기냐? 비동기냐?

<p>
    두 가지 패러다임에서 공통적으로 반드시 피해야 할 것은 API의 특성과 관련하여 모순과 혼돈을 만드는 것이다. 그렇게 하면 발견하기 어렵고 재현이 불가능한 문제가 발생할 수 있다.
</p>

#### 예측할 수 없는 함수

```javascript
const fs = require('fs');
const cache = {};

function inconsistentRead(filename, callback) {
    if (cache[filename]) {
        // 동기적으로 호출됨
        callback(cache[filename]);
    } else {
        // 비동기 함수
        fs.readFile(filename, 'utf8', (err, data) => {
            cache[filename] = data;
            callback(data);
        });
    }
}
```

<p>
    가장 위험한 상황은 특정 조건에서 동기적으로 동작하고 다른 조건에서 비동기적으로 동작하는 API를 갖는 것이다. 위의 코드는 cache 변수를 사용하여 서로 다른 파일을 읽어 작업의 결과를 저장한다. 이 함수는 `fs.readFile()` 함수가 결과를 반환할 때까지 캐시가 설정되지 않은 경우 비동기식으로 동작하고, 캐시에 이미 있는 파일에 대한 모든 후속 요청에 대해 동기식으로 변해 즉각적으로 콜백을 호출하므로 위험하다.
</p>

#### Zalgo를 풀어놓다

```javascript
function createFileReader(filename) {
    const listeners = [];
    inconsistentRead(filename, value => {
        listeners.forEach(listener => listener(value));
    });

    return {
        onDataReady: listener => listeners.push(listener)
    };
}
```

<p>
    앞선 함수가 실행되면 파일 읽기에 대한 여러 가지 리스너를 설정할 수 있는, 알림을 발생시키는 역활의 새로운 객체를 생성한다. 읽기가 완료되어 데이터 준비가 끝나면 모든 리스너들이 한번에 호출된다. 위의 함수는 `inconsistentRead()` 함수를 사용하여 이 기능을 구현한다.
</p>

```javascript
const reader1 = createFileReader('data.txt');
reader1.onDataReady(data => {
    console.log('First call data: ' + data);

    // ... 동일 파일에 대해 다시 읽기
    const reader2 = createFileReader('data.txt');
    reader2.onDataReady(data => {
        console.log('Second call data: ' + data);
    });
});

// 출력 결과: First call data: some data
```

<p>
    만든 createFileReader 함수를 사용하면 위와 같이 두 번째 콜백이 호출되지 않는다. 이러한 이유는 아래와 같다.
</p>

- reader1이 생성되는 동안 `inconsistentRead()` 함수는 사용 가능한 캐시된 결과가 없으므로 비동기적으로 동작한다. 따라서 리스너를 등록하는데 충분한 시간을 가질 수 있다. 읽기 작업이 완료된 후, 나중에 이벤트 루프의 다른 사이클에서 리스터가 호출되기 때문이다.
- 그런 다음 reader2는 요청된 파일에 대한 캐시가 이미 존재하는 이벤트 루프의 사이클에서 생성된다. 이 경우 `inconsistentRead()`에 대한 내부 호출은 동기 방식이 된다. 따라서 콜백은 즉시 호출된다. 즉, reader2의 모든 리스너들이 동기적으로 호출된다. 하지만, 리스너를 reader2의 생성 후에 등록하기 때문에 호출되지 않는다.

<p>
    위와 같은 버그는 식별하기가 어려울 수 있으며, 이러한 유형의 예측할 수 없는 함수들을 Zalgo를 풀어놓는다고 비유한다.
</p>

#### 동기 API의 사용

<p>
    앞선 사례로 API의 동기, 비동기 특성을 명확하게 정의하는 것이 필수적이라는 것을 알 수 있다. 이에 `inconsistentRead()` 함수를 적절하게 수정할 수 있는 방법 중 한 가지는 완전히 동기화시키는 것이다.
</p>

```javascript
const fs = require('fs');
const cache = {};

function consistentReadSync(filename) {
    if (cache[filename]) {
        return cache[filename];
    } else {
        cache[filename] = fs.readFileSync(filename, 'utf8');
        return cache[filename];
    }
}
```

<p>
    위의 코드는 앞선 코드를 완전히 동기화시킨 것이다. 함수가 동기식이면 연속 전달 방식을 가질 이유가 없어, 전체 기능이 직접 스타일로 변환되었다. 실제로 직접 스타일을 사용하여 동기식 API를 구현하는 것이 항상 최선의 방법이라고 말할 수 있다. 만약 비동기 API 대신 동기 API를 사용하면 아래와 같이 주의할 사항이 있다.
</p>

- 특정 기능에 대한 동기식 API를 항상 사용할 수 있는 것은 아니다.
- 동기 API는 이벤트 루프를 블록하고 동시 요청을 보류한다. 자바스크립트 동시성 모델을 깨뜨려서 전체 어플리케이션 속도를 떨어뜨린다.

<p>
    `consistentReadSync()` 함수에서 동기식 I/O API는 하나의 파일당 한번 호출되고 이후의 호출에는 캐시에 저장된 값을 사용하기 때문에, 이벤트 루프를 블로킹하는 위험은 부분적으로 완화된다. 또한, 제한된 수의 정적 파일로 작업할 경우에는 이벤트 루프에 큰 영향을 미치지 않는다. 하지만 큰 파일을 읽는 경우라면 성능상 좋지 않다. Node.js에서 동기 I/O를 사용하는 것은 많은 경우에 권장되지 않지만, 어떤 경우에는 가장 쉽고 효율적인 방안이 될 수 있다. 따라서 유스케이스를 잘 살펴보고 적절한 대안을 선택하는 것이 좋다.
</p>

#### 지연 실행(Deferred execution)

<p>
    앞선 `inconsistentRead()`를 수정하는 다른 방법은 완전히 비동기로 만드는 것이다. 이때 동기 콜백 호출이 동일한 이벤트 루프 사이클에서 즉시 실행되는 대신 '가까운 미래에' 실행되도록 예약하는 것이다.
</p>

```javascript
const fs = require('fs');
const cache = {};

function consistentReadASync(filename, callback) {
    if (cache[filename]) {
        process.nextTick(() => callback(cache[filename]))
    } else {
        fs.readFile(filename, 'utf8', (err, data) => {
            cache[filename] = data;
            callback(data);
        });
    }
}
```

<p>
    `process.nextTick()`은 이벤트 루프의 다음 사이클까지 함수의 실행을 지연시킨다. 콜백을 인수로 취하여 대기중인 I/O 이벤트 대기열의 앞으로 밀어 낳고 즉시 반환한다. 그러면 콜백은 이벤트 루프가 다시 실행되는 즉시 호출된다. 단, `process.nextTick()`은 이미 예정된 I/O보다 먼저 실행되기 때문에 특정 상황에서 I/O 기아(starvation)를 발생시킬 수 있다.
</p>

### 1-3 Node.js 콜백 규칙

#### 콜백은 맨 마지막에

- 모든 코어 Node.js 함수에서 표준 규칙은 함수가 입력에서 콜백을 허용한다면 맨 마지막 인자로 전달되어야 한다.
  - 콜백이 적절한 위치에 정의되어 있는 경우, 함수 호출의 가독성이 더 좋다.

#### 오류는 맨 앞에

- Node.js에서 CPS 함수에 의해 생성된 오류는 항상 콜백의 첫 번째 인수로 전달되며, 실제 결과는 두 번째 인수에서부터 전달된다.
  - 동작이 에러 없이 성공하면 최초의 인수는 null 또는 undefined가 된다.
- 또한, 오류는 항상 Error 유형이어야 하며, 간단한 문자열이나 숫자를 오류 객체로 전달해서는 안된다.

#### 오류 전파

- 동기식 직접 스타일 함수의 오류 전파는 throw 문을 사용하여 수행되므로 오류가 catch 될 때까지 호출 스택에서 실행된다.

```javascript
const fs = require('fs');
function readJSON(filename, callback) {
    fs.readFile(filename, 'utf8', (err, data) => {
        let parsed;
        if (err) {
            // 오류를 전달하고 현재 함수를 종료
            return callback(err)
        }
        try {
            // 파일의 내용을 해석
            parsed = JSON.parse(data);
        } catch(err) {
            // 에러 catch
            return callback(err);
        }
        // 에러가 없으면 데이터를 전달
        callback(null, parsed);
    });
}
```

<p>
    비동기식 CPS에서 적절한 오류 전달은 오류를 호출 체인의 다음에서 콜백으로 전달하여 수행되며, 일반적인 패턴은 위의 코드와 같다.
</p>

#### 캐치되지 않은 예외

<p>
    앞선 코드에서 `try ... catch` 구문을 제거하고 `JSON.parse()`를 바로 콜백으로 전달하는 경우, `JSON.parse()`의 예외를 잡을 방법이 없다. 이를 실행할 경우 어플리케이션이 종료되고 콘솔에 예외 메시지를 출력한다. 어플리케이션은 예외가 이벤트 루프에 도착하는 순간 중단된다. 하지만 중단되기 전에 자원을 정리하거나 로그를 남길 수는 있다.
</p>

```javascript
process.on('uncaughtException', (err) => {
    console.error('This will catch at last the JSON parsing exception: ' + err.message);
    // 종료 코드 1(오류)로 어플리케이션을 종료
    // 다음 줄이 없으면 어플리케이션이 계속됨
    process.exit(1);
});
```

<p>
    Node.js는 캐치되지 않은 예외가 발생하면 프로세스를 종료하기 직전에 uncaughtException이 라는 특수 이벤트를 내보낸다. 위의 코드는 이러한 경우에 사용한다.
</p>
