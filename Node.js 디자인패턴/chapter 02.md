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

## 2. 모듈 시스템과 그 패턴

### 2-1 노출식 모듈 패턴

<p>
    자바스크립트의 주요 문제점 중 하나는 네임스페이스가 없다는 것이다. 전역 범위에서 실행되는 프로그램은 내부 어플리케이션과 종속된 라이브러리 코드의 데이터들로 인해 충돌이 발생할 수 있다. 이러한 문제를 해결하기 위한 보편적인 기법을 노출식 모듈 패턴(revealing module pattern)이라고 한다.
</p>

```javascript
const module = (() => {
    const privateFoo = () => {...};
    const privateBar = [];

    const exported = {
        publicFoo: () => {...},
        publicBar: () => {...}
    };

    return exported;
})();
console.log(module);
```

<p>
    위의 패턴 처럼 자기 호출 함수를 사용하여 private 범위를 만들고 공개 될 부분만 export한다. module 변수는 export된 API만 포함하고 있으며, 나머지 모듈 내부 콘텐츠는 실제로 외부에서 액세스할 수 없다.
</p>

### 2-2 Node.js 모듈 설명

<p>
    CommonJS는 자바스크립트 생태계를 표준화하려는 목표를 가진 그룹으로, 가장 많이 사용되는 제안 중 하나가 CommonJS 모듈이다. Node.js는 사용자 정의 확장을 추가하여 이 스펙 위에 모듈 시스템을 구축하였다.
</p>

#### 직접 만드는 모듈 로더

```javascript
function loadModule(filename, module, require) {
    const wrappedSrc = `(function(module, exports, require) {
            ${fs.readFileSync(filename, 'utf8')}
        })(module, module.exports, require);`;
    eval(wrappedSrc);
}
```

<p>
    위의 코드는 `require()` 함수의 원래 기능 중 일부를 모방한 함수를 만든 것이며, 먼저 모듈의 내용을 로드하고 이를 private 범위로 감싸 평가하는 함수이다. 모듈의 소스코드는 노출 모듈 패턴과 마찬가지로 기본적으로 함수로 싸여진다. 차이점은 일련의 변수들(module, exports, require)을 모듈에 전달한다는 것이다.
</p>

```javascript
// 실제 require() 함수의 내부 동작과 같지는 않음

...

const require = (moduleName) => {
    console.log(`Require invoked for module: ${moduleName}`);
    const id = require.resolve(moduleName); // 1.
    if (require.cache[id]) { // 2.
        return require.cache[id].exports;
    }
    // 모듈 메타데이터
    const module = { // 3.
        exports: {},
        id: id
    };
    // 캐시 갱신
    require.cache[id] = module; // 4.
    // 모듈 로드
    loadModule(id, module, require); // 5.
    // 익스포트된 변수들을 반환
    return module.exports; // 6.
};

require.cache = {};
require.resolve = (moduleName) => {
    // moduleName에서 모듈 ID를 확인
};
```

1. 모듈 이름을 입력으로 받아 수행하는 첫 번째 일은 id라고 부르는 모듈의 전체 경로를 알아내는(resolve) 것이다. 이 작업은 이를 해결하기 위해 관련 알고리즘을 구현하고 있는 `require.resolve()`에 위임된다.
2. 모듈이 이미 로드된 경우 캐시된 모듈을 사용한다. 이 경우 즉시 반환한다.
3. 모듈이 아직 로드되지 않은 경우 최초 로드를 위한 환경을 설정한다. 특히, 빈 객체 리터럴을 통해, 초기화된 exports 속성을 가지고 있는 module 객체를 만든다. exports 속성은 불러올 모듈의 코드에서 모든 public API를 익스포트 하는데 사용될 것이다.
4. module 객체가 캐시된다.
5. 모듈 소스코드는 해당 파일에서 읽어 오며, 코드는 앞에서 살펴본 방식대로 평가된다. 방금 생성한 module 객체와 require() 함수의 참조를 모듈에 전달한다. 모듈은 module.exports 객체를 조작하거나 대체하여 public API를 내보낸다.
6. 마지막으로 모듈의 public API를 나타내는 module.exports의 내용이 호출자에게 반환된다.

#### 모듈 정의

```javascript
// 다른 종속성 로드
const dependency = require('./anotherModule');

// private 함수
function log() {
    console.log(`Well done ${dependency.username}`);
}

// 익스포트되어 외부에서 사용될 API
module.exports.run = () => {
    log();
}
```

<p>
    위의 코드는 모듈을 정의하는 방법으로, `module.exports` 변수에 할당되지 않는 한, 모듈 내부의 모든 항목은 private이다.
</p>

#### 전역 정의

<p>
    모듈 시스템은 전역에서 사용할 수 있도록 global이라는 특수 변수를 제공한다. 이 변수에 할당된 모든 항목은 자동으로 전역 범위에 있게 된다.
</p>

#### module.exports 대 exports

<p>
    `exports`는 `module.exports`의 초기 값에 대한 참조일 뿐이다. exports가 참조하는 객체에만 새로운 속성을 추가할 수 있다.
</p>

```javascript
exports.hello = () => {
    console.log('Hello');
}
```

<p>
    exports 변수의 재할당은 module.exports의 내용을 변경하지 않기 때문에 아무런 효과가 없으며 exports 변수 자체만을 재할당한다. 함수, 인스턴스 또는 문자열과 같은 객체 리터럴 이외의 것을 내보내려면 module.exports를 다시 할당해야 한다.
</p>

```javascript
// 변수 자체만을 재할당하므로 아무런 효과가 없음
exports = () => {
    console.log('hello');
}

// 객체 리터럴 이외의 것을 내보내려면
module.exports = () => {
    console.log('hello');
}
```

#### require 함수는 동기적이다.

<p>
    Node.js의 `requre()` 함수는 동기적이다. 따라서 `module.exports`에 대한 할당도 동기적이어야 한다. 이러한 속성은 모듈을 정의하는 방식에 중요한 영향을 미친다. 모듈을 정의할 때는 동기적 코드를 주로 사용하기 때문이다. 실제로 Node.js의 핵심 라이브러리들이 대부분의 Async 라이브러리에 대한 대안으로써 동기 API도 제공하는 가장 중요한 이유다. 원래 Node.js는 비동기 버전의 `require()`를 사용했었다. 하지만 과도한 복잡성으로 인하 곧 제거되었다.
</p>

#### 해결(resolving) 알고리즘

<p>
    의존성 지옥(dependency hell)은 소프트웨어의 의존성이 서로 공통된 라이브러리들을 의존하지만 호환되지 않는 서로 다른 버전을 필요로 하는 상황을 나타낸다. Node.js는 모듈이 로드되는 위치에 따라 다른 버전의 모듈을 로드할 수 있도록 하여 이 문제를 해결한다. 이 기능의 장점은 npm뿐 아니라 require 함수에서 사용하는 해결 알고리즘에도 적용된다.
</p>

<p>
    `resolve()` 함수는 모듈 이름을 입력으로 사용하여 모듈 전체의 경로를 반환한다. 이 경로는 코드를 로드하고 모듈을 고유하게 식별하는데 사용된다. 해결 알고리즘은 크게 세 가지로 나뉜다.
</p>

- 파일 모듈: moduleName이 '/'로 시작하면 이미 모듈에 대한 절대 경로라고 간주되어 그대로 반환한다. './'으로 시작하면 moduleName은 상대 경로로 간주되며, 이는 요청한 모듈로부터 시작하여 계산된다.
- 코어 모듈: moduleName이 '/' 또는 './'로 시작하지 않으면 알고리즘은 먼저 코어 Node.js 모듈 내에서 검색을 시도한다.
- 패키지 모듈: moduleName과 일치하는 코어 모듈이 없는 경우, 요청 모듈의 경로에서 시작하여 디렉터리 구조를 탐색하여 올라가면서 node_modules 디렉터리를 찾고 그 안에서 일치하는 모듈을 찾는다. 알고리즘은 파일 시스템의 루트에 도달할 때까지 디렉터리 트리를 올라가면서 다음 node_modules 디렉터리를 탐색하여 계속 일치하는 모듈을 찾는다.

<p>
    파일 및 패키지 모듈의 경우 개별 파일과 디렉터리가 모두 moduleName과 일치할 수 있다. 알고리즘은 다음과 일치하는지 확인한다.
</p>

- 'MODULENAME'.js
- 'MODULENAME'/index.js
- 'MODULENAME'/package.json의 main 속성에 지정된 디렉터리/파일

<p>
    해결 알고리즘은 Node.js 의존성 관리의 견고성을 뒷받침하는 핵심적인 부분이며, 충돌 혹은 버전 호환성 문제없이 어플리케이션에서 수백 또는 수천 개의 패키지를 가질 수 있게 한다. 해결 알고리즘은 `require()`를 호출할 때 분명하게 적용된다. 그러나 필요하다면 `require.resolve()`를 호출하여 모듈에서 직접 사용될 수 있다.
</p>

#### 모듈 캐시

<p>
    `require()`의 후속 호출은 단순히 캐시된 버전을 반환하기 때문에 각 모듈은 처음 로드될 때만 로드되고 평가된다. 캐싱은 성능을 위해 중요하지만 다음과 같은 기능적인 영향도 있다.
</p>

- 모듈 의존성 내에서 순환을 가질 수 있다.
- 일정한 패키지 내에서 동일한 모듈이 필요할 때는 어느 정도 동일한 인스턴스가 항상 반환되는 것을 보장한다.

### 2-3 모듈 정의 패턴

<p>
    모듈 시스템은 API를 정의하기 위한 도구이기도 하다. API 디자인과 관련된 고려해야 할 주요 요소는 private 함수와 public 함수 간의 균형이다. 이것의 목표는 확장성과 코드 재사용같은 소프트웨어 품질과의 균형을 유지하면서 정보 은닉 및 API 유용성을 극대화하는 것이다.
</p>

#### exports 지정하기(named exports)

<p>
    public API를 공개하는 가장 기본적인 방법은 exports로 명기하는 것으로, exports에서 참조하는 객체의 속성에 공개할 모든 값을 할당하는 것이다. Node.js의 코어 모듈 대부분은 아래와 같은 패턴을 사용한다.
</p>

```javascript
// logger.js
exports.info = (message) => {
    console.log('info: ' + message);
};

exports.verbose = (message) => {
    console.log('verbose: ' + message);
};

...

// main.js
const logger = require('./logger');
logger.info('This is an informational message');
logger.verbose('This is a verbose message');
```

#### 함수 내보내기(Exporting a funcion)

<p>
    가장 일반적인 모듈 정의 패턴 중 하나가 `module.exports` 변수 전체를 함수에 재할당하는 것이다. 주요 장점은 모듈에 대한 명확한 진입점을 제공하는 단일 기능을 제공하여 그것에 대한 이해와 사용을 단순화한다는 것이다. 또한 최소한의 노출이라는 원리에 잘 맞아 떨어진다.
</p>

```javascript
// logger.js
module.exports = (message) => {
    console.log(`info: ${message}`);
};

module.exports.verbose = (message) => {
    console.log(`verbose: ${message}`);
};

...

// main.js
const logger = require('./logger');
logger('This is an informational message');
logger.verbose('This is a verbose message');
```

<p>
    단순히 함수를 내보내는 것이 제약처럼 보일 수도 있지만 단일 기능에 중점을 두도록 하는 완벽한 방법이며, 내부 형태에 대한 가시성을 줄이면서 이외 보조적인 사항들은 익스포트된 함수의 속성으로 노출하여 단일 진입점을 제공한다. Node.js의 모듈성은 한 가지만 책임지는 원칙(Single Responsibility Principle)을 지키는 것을 권장한다. 모든 모듈은 단일 기능에 대한 책임을 져야 하며, 책임은 모듈에 의해 완전히 캡슐화되어야 한다.
</p>

#### 생성자 익스포트하기

<p>
    생성자를 익스포트하는 모듈은 함수를 내보내는 모듈이 특화된 것이다. 차이점은 이 새로운 패턴을 통해 사용자에게 생성자를 사용하여 새 인스턴스를 만들 수 있게 하면서, 프로토타입을 확장하고 새로운 클래스를 만들 수 있는 기능도 제공할 수 있다는 것이다.
</p>

```javascript
// logger.js
function Logger(name) {
    this.name = name;
}

Logger.prototype.log = function(message) {
    console.log(`[${this.name}] ${message}`);
};

Logger.prototype.info = function(message) {
    this.log(`info: ${message}`);
};

Logger.prototype.verbose = function(message) {
    this.log(`verbose: ${message}`);
};

module.exports = Logger;

...

// main.js
const Logger = require('./logger');
const dbLogger = new Logger('DB');
dbLogger.info('This is an informational message');
const accessLogger = new Logger('ACCESS');
accessLogger.verbose('This is a verbose message');
```

<p>
    위의 패턴은 ES2015의 클래스로 나타낼 수 있다. 생성자나 클래스를 내보내는 것은 모듈에 대한 단일 진입점을 제공하지만 substack 패턴과 비교할 때 훨씬 더 많은 모듈의 내부를 노출한다. 또한 기능 확장에 있어 훨씬 더 강력할 수 있다. 이 패턴의 변형은 new 명령을 사용하지 않는 호출에 대해 보호자(guard)를 적용하는 것으로 구성되며, 이 트릭으로 모듈을 팩토리로 사용할 수 있다.
</p>

#### 인스턴스 익스포트 하기

```javascript
// logger.js
function Logger(name) {
    this.count = 0;
    this.name = name;
}

Logger.prototype.log = function(message) {
    this.count++;
    console.log(`[${this.name}] ${message}`);
}

module.exports = new Logger('DEFAULT');

...

// main.js
const logger = require('./logger');
logger.log('This is an informational message');
```

<p>
    `require()` 함수는 캐싱 메커니즘을 이용하여 생성자나 팩토리를 통해 모듈을 생성하므로 서로 다른 모듈 간에 공유할 수 있는 상태 저장(stateful) 인스턴스를 쉽게 정의할 수 있다.
</p>

<p>
    이러한 패턴의 확장은 인스턴스 자체뿐만 아니라 인스턴스를 생성하는데 사용되는 생성자를 노출하는 것으로 구성된다. 이를 통해 사용자는 동일한 객체의 새 인스턴스를 만들거나 필요에 따라 확장할 수도 있다.
</p>

```javascript
...

module.exports.Logger = Logger;

...

const customLogger = new logger.Logger('CUSTOM');
customLogger.log('This is an informational message');
```

#### 다른 모듈 혹은 글로벌 스코프 수정

<p>
    모듈이 캐시에 있는 다른 모듈을 포함하여 전역 범위와 그 안에 있는 모든 개체를 수정할 수 있다(몽키 패치라고도 한다). 일반적으로 권장되지는 않지만, 일부 상황(예: 테스트용)에서 유용하고 안전하다.
</p>

## 3. 관찰자 패턴(The observer pattern)

<p>
    관찰자 패턴은 Node.js의 반응적인(reactive) 특성을 모델링하고 콜백을 완벽하게 보완하는 이상적인 해결책이다. 또한 관찰자 패턴은 상태 변화가 일어날 때 관찰자(또는 listener)에게 알릴 수 있는 객체(Subject라고 불림)를 정의하는 것이다. 콜백과의 차이점은 여러 관찰자에게 알릴 수 있다는 점이다.
</p>

### 3-1 EventEmitter 클래스

![1](https://user-images.githubusercontent.com/38815618/102628743-860b1700-418d-11eb-9514-193719fbf15c.PNG)

<p>
    관찰자 패턴은 이미 코어에 내장되어 있으며 EventEmitter 클래스를 통해 사용할 수 있다. EventEmitter 클래스를 사용하여 특정 유형의 이벤트가 발생되면 호출될 하나 이상의 함수를 Listener로 등록할 수 있다.
</p>

```javascript
const EventEmitter = require('events').EventEmitter;
const eeInstance = new EventEmitter();
```

<p>
    EventEmitter는 프로토타입이며 코어 모듈로부터 익스포트된다. EventEmitter의 필수 메소드는 다음과 같다.
</p>

- on(event, listener): 이 메소드를 사용하면 주어진 이벤트 유형(문자열)에 대해 새로운 listener를 등록할 수 있다.
- once(event, listener): 이 메소드는 첫 이벤트가 전달된 후 제거되는 새로운 listener를 등록한다.
- emit(event, [arg1], [...]): 이 메소드는 새 이벤트를 생성하고 listener에게 전달할 추가적인 인자들을 지원한다.
- removeListener(event, listener): 이 메소드는 지정된 이벤트 유형에 대한 listener를 제거한다.

### 3-2 EventEmitter 생성 및 사용

```javascript
const EventEmitter = require('events').EventEmitter;
const fs = require('fs');

function findPattern(files, regex) {
    const emitter = new EventEmitter();
    files.forEach(function(file) {
        fs.readFile(file, 'utf8', (err, content) => {
            if (err) {
                return emitter.emit('error', err);
            }
            emitter.emit('fileread', file);
            let match;
            if (match = content.match(regex)) {
                match.forEach(elem => emitter.emit('found', file, elem));
            }
        });
    });
    return emitter;
}
```

<p>
    위의 함수는 EventEmitter를 사용하여 파일 목록에서 특정 패턴이 발견되면 실시간으로 구독자들에게 알리는 함수이다. 해당 함수는 다음 세 가지 이벤트를 발생시킨다.
</p>

- fileread: 파일을 읽을 때 발생한다.
- found: 일치하는 항목이 발견되었을 때 발생한다.
- error: 파일을 읽는 동안 오류가 발생했을 때 발생한다.

<p>
    findPattern은 아래의 코드와 같이 사용할 수 있으며, 출력 결과를 확인하기 위해 fileA.txt를 생성하고 hello world를 추가한다.
</p>

```javascript
findPattern(
    ['fileA.txt', 'fileB.json'],
    /hello \w+/g
)
.on('fileread', file => console.log(file + ' was read'))
.on('found', (file, match) => console.log('Matched "' + match + '" in file ' + file))
.on('error', err => console.log('Error emitted: ' + err.message));

// 출력 결과
// Error emitted: ENOENT: no such file or directory, open 'D:\Dropbox\임근혁\수업자료\study\study Node.js\Node.js 디자인패턴\fileB.json'
// fileA.txt was read
// Matched "hello world" in file fileA.txt
```

### 3-3 오류 전파

<p>
    EventEmitter는 이벤트가 비동기적으로 발생할 경우, 이벤트 루프에서 손실될 수 있기 때문에 콜백에서와 같이 예외를 바로 throw할 수 없다. 대신, error라는 특수한 이벤트를 발생시키고, Error 객체를 인자로 전달한다.
</p>

### 3-4 관찰 가능한 객체 만들기

<p>
    때로는 EventEmitter 클래스를 가지고 직접 새로운 관찰 대상 객체를 만드는 것만으로는 충분하지 않을 수도 있다. 이런 방식으로 단순한 새로운 이벤트를 만드는 것 이상의 기능을 제공하는 것은 비현실적이다. 실제로 일반적인 객체를 관찰 가능하게 만드는 것이 일반적이다. 이것은 EventEmitter 클래스를 확장함으로써 가능하다.
</p>

```javascript
onst EventEmitter = require('events').EventEmitter;
const fs = require('fs');

class FindPattern extends EventEmitter {
    constructor (regex) {
        super();
        this.regex = regex;
        this.files = [];
    }

    addFile (file) {
        this.files.push(file);
        return this;
    }

    find () {
        this.files.forEach( file => {
            fs.readFile(file, 'utf8', (err, content) => {
                if (err) {
                    return this.emit('error', err);
                }

                this.emit('fileread', file);

                let match = null;
                if (match = content.match(this.regex)) {
                    match.forEach(elem => this.emit('found', file, elem));
                }
            });
        });
        return this;
    }
}

const findPatternObject = new FindPattern(/hello \w+/);
findPatternObject
    .addFile('fileA.txt')
    .addFile('fileB.json')
    .find()
    .on('found', (file, match) => console.log(`Matched "${match}" in file ${file}`))
    .on('error', err => console.log(`Error emitted ${err.message}`))
    .on('fileread', file => console.log(`${file} was read`));

// Error emitted ENOENT: no such file or directory, open 'D:\Dropbox\임근혁\수업자료\study\study Node.js\Node.js 디자인패턴\fileB.json'
// fileA.txt was read
// Matched "hello world" in file fileA.txt
```

### 3-5 동기 및 비동기 이벤트

<p>
    동기 이벤트와 비동기 이벤트를 발생시키는 주된 차이점은 리스너를 등록할 수 있는 방법에 있다. 이벤트가 비동기적으로 발생하면 EventEmitter가 초기화된 후에도 프로그램은 새로운 리스너를 등록할 수 있다. 이벤트가 이벤트 루프의 다음 사이클이 될 때까지는 실행되지 않을 것이기 때문이다. 반대로 이벤트를 동기적으로 발생시키려면 EventEmitter 함수가 이벤트를 방출하기 전에 모든 리스너가 등록되어 있어야 한다.
</p>

```javascript
const EventEmitter = require('events').EventEmitter;

class SyncEmit extends EventEmitter {
    constructor() {
        super();
        this.emit('ready');
    }
}

const syncEmit = new SyncEmit();
syncEmit.on('ready', () => console.log('Object is ready to be used'));
```

<p>
    위의 코드에서 ready 이벤트가 비동기적으로 발생한다면 완벽하게 동작한다. 하지만 동기적으로 생성되면 이벤트가 이미 전송된 후 리스너가 등록되므로 결과적으로 리스너가 호출되지 않는다. 따라서 코드는 아무 것도 출력하지 않는다.
</p>

### 3-6 EventEmitter vs 콜백

<p>
    결과가 비동기 방식으로 반환되어야 하는 경우 콜백을 사용한다. 대신 이벤트는 일어난 무엇인가를 전달할 필요가 있을 때 사용한다. 하지만 두 패러다임이 대부분 동등하고 동일한 결과를 얻을 수 있어 혼란이 발생한다.
</p>

```javascript
function helloEvents() {
    const eventEmitter = new EventEmitter();
    setTimeout(() => eventEmitter.emit('hello', 'hello world'), 100);
    return eventEmitter;
}

function helloCallback(callback) {
    setTimeout(() => callback('hello world'), 100);
}
```

<p>
    위 코드에서 두 함수는 기능면으로 동일하며, 두 함수를 구별하는 것은 가독성, 의미, 구현 또는 사용되는데 필요한 코드의 양이다.
</p>

<p>
    EventEmitter가 더 좋은 경우는 동일한 이벤트가 여러 번 발생할 수도 있고, 전혀 발생하지 않을 수도 있는 경우이다. 콜백은 작업의 성공 여부와 상관없이 정확히 한 번 호출되어야 한다. 반복적인 상황에 놓인다면 사건의 발생이라는 의미의 본질에 생각해야 하며, 이 경우는 결과보다는 정보가 전달되어야 하는 이벤트에 더 가깝고, EventEmitter가 좋은 선택이다.
</p>

### 3-7 콜백과 EventEmitter의 결합

<p>
    이 패턴은 메인 함수로 전통적인 비동기 함수를 익스포트하여 최소한의 인터페이스라는 원칙을 지키면서도 EventEmitter를 반환하여 더 풍부한 기능과 제어를 제공하고자 할 때 매우 유용하다. 이 패턴의 예로 glob 스타일 파일 검색 라이브러리인 node-glob 모듈이 있다. 함수는 패턴과 옵션 그리고 인자로 주어진 패턴과 일치하는 모든 파일의 리스트를 가지고 호출될 콜백 함수를 취한다. 동시에 이 함수는 프로세스 상태에 대해 보다 세분화된 알림을 제공하는 EventEmitter를 반환한다. 예를 들어 end 이벤트가 일어날 때, 모든 일치된 파일 목록들을 얻기 위해 match 이벤트가 일어날 때마다 실시간으로 알림을 받거나 abort 이벤트 수신을 통해 수동으로 프로세스가 중단되었는지 여부를 알 수 있다.
</p>

<p>
    콜백을 받아들이고 EventEmitter를 반환하는 함수를 만듦으로써, EventEmitter를 통해 보다 세분화된 이벤트를 방출하면서 주요 기능에 대한 간단하고 명확한 진입점을 제공할 수 있다.
</p>
