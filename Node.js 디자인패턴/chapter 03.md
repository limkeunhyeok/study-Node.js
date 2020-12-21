# Chapter 03 - 콜백을 사용한 비동기 제어 흐름 패턴

## 1. 비동기 프로그래밍의 어려움

### 1-1 간단한 웹 스파이더 만들기

- 웹 URL을 입력으로 받아, 해당 URL의 내용을 로컬 파일로 다운로드하는 콘솔용 어플리케이션인 간단한 웹 스파이더 구현
- npm 라이브러리
  - request: HTTP 호출을 간소화하는 라이브러리
  - mkdirp: 재귀적으로 디렉터리를 만드는 단순한 유틸리티

```javascript
'use strict';

const request = require('request');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const utilities = require('./utilities');

function spider(url, callback) {
    const filename = utilities.urlToFilename(url);
    fs.exists(filename, exists => { // 1.
        if (!exists) {
            console.log(`Downloading ${url}`);
            request(url, (err, response, body) => { // 2.
                if (err) {
                    callback(err);
                } else {
                    mkdirp(path.dirname(filename), err => { // 3.
                        if (err) {
                            callback(err);
                        } else {
                            fs.writeFile(filename, body, err => { // 4.
                                if (err) {
                                    callback(err);
                                } else {
                                    callback(null, filename, true);
                                }
                            });
                        }
                    });
                }
            });
        } else {
            callback(null, filename, false)
        }
    });
}

spider(process.argv[2], (err, filename, downloaded) => {
    if (err) {
        console.log(err);
    } else if (downloaded) {
        console.log(`Completed the download of "${filename}"`);
    } else {
        console.log(`"${filename}" was already downloaded`);
    }
});
```

1. 해당 파일이 이미 생성되어 있는지 확인하여 해당 URL이 이미 다운로드 되었는지를 검사한다.
2. 파일을 찾을 수 없는 경우 URL은 request를 통해 다운로드된다.
3. 파일을 저장할 디렉터리가 있는지 확인한다.
   - mkdirp는 버전 1.0.0 이후로 콜백을 사용하지 않으며, 해당 예제에서는 0.5.1을 사용하였다.
4. HTTP 응답의 내용을 파일 시스템에 쓴다.

<p>
    해당 어플리케이션은 `node spider.js http://www.example.com` 명령어를 통해 실행이 가능하며, 해당 페이지의 내용을 로드한다.
</p>

### 1-2 콜백 헬(The Callback hell)

<p>
    앞선 코드처럼 많은 클로저와 내부 콜백 정의가 코드를 읽을 수 없고 관리할 수 없는 덩어리로 만드는 상황을 콜백 헬이라고 하며, 심각한 안티 패턴 중 하나이다. 이런 식으로 작성된 코드는 깊은 중첩으로 인해 피라미드 같은 모양을 취해서 죽음의 피라미드(pyramid of doom)라고도 한다. 이런 코드의 문제는 가독성이다. 또한 각 스코프에서 사용된 변수의 이름이 중복된다는 점이다. 또한 클로저가 성능 및 메모리 소비 면에서 비용이 적게 들며, 활성 클로저가 참조하는 컨텍스트가 가비지 수집 시 유지되어 식별하기 쉽지 않은 메모리 누수가 발생할 수 있다.
</p>

## 2. 일반 JavaScript의 사용

### 2-1 콜백 규칙

- 콜백을 정의할 때 함부로 클로저를 사용하지 않는다. 이는 장점보다 단점이 더 많을 수 있는 방식이다.
- 가능한 빨리 종료한다. 코드를 얕게 유지하는데 도움이 된다.
- 콜백을 위한 명명된 함수를 생성하여 클로저 바깥에 배치하며 중간 결과를 인자로 전달한다. 함수의 이름을 지정하면 스택 추적에서 잘 보인다.
- 코드를 모듈화한다. 가능하면 코드를 작고 재사용 가능한 함수들로 분할한다.

### 2-2 콜백 규칙 사용

```javascript
// 수정 전
if (err) {
    callback(err);
} else {
    // 오류가 없을 때 실행할 코드
}

// 수정 후
if (err) {
    return callback(err);
}
// 오류가 없을 때 실행할 코드
```

<p>
    위의 코드는 else 문을 제거하여 오류 검사 패턴을 재구성하였다. 이는 오류를 받는 즉시 함수로 복귀가 가능하며, 함수의 중첩 수준을 줄이고, 복잡한 리팩토링을 필요로 하지 않는다.
</p>

<p>
    다음 최적화는 재사용 가능한 코드를 구분하여 별도의 함수로 분리하는 것이다.
</p>

```javascript
function saveFile(filename, contents, callback) {
    mkdirp(path.dirname(filename), err => {
        if (err) {
            return callback(err);
        }
        fs.writeFile(filename, contents, callback);
    });
}

function download(url, filename, callback) {
    console.log(`Downloading ${url}`);
    request(url, (err, response, body) => {
        if (err) {
            return callback(err);
        }
        saveFile(filename, body, err => {
            if (err) {
                return callback(err);
            }
            console.log(`Downloaded and saved: ${url}`);
            callback(null, body);
        });
    });
}
```

<p>
    위의 코드는 기존의 코드에서 파일을 저장하는 기능과 URL로 주어진 파일을 다운로드하는 함수를 구현하였다. 이를 이용하여 `spider()` 함수를 수정하고 완성된 코드는 아래와 같다.
</p>

```javascript
'use strict';

const request = require('request');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const utilities = require('./utilities');

function saveFile(filename, contents, callback) {
    mkdirp(path.dirname(filename), err => {
        if (err) {
            return callback(err);
        }
        fs.writeFile(filename, contents, callback);
    });
}

function download(url, filename, callback) {
    console.log(`Downloading ${url}`);
    request(url, (err, response, body) => {
        if (err) {
            return callback(err);
        }
        saveFile(filename, body, err => {
            if (err) {
                return callback(err);
            }
            console.log(`Downloaded and saved: ${url}`);
            callback(null, body);
        });
    });
}

function spider(url, callback) {
    const filename = utilities.urlToFilename(url);
    fs.exists(filename, exists => {
        if (exists) {
            return callback(null, filename, false);
        }
        download(url, filename, err => {
            if (err) {
                return callback(err);
            }
            callback(null, filename, true);
        });
    });
}

spider(process.argv[2], (err, filename, downloaded) => {
    if (err) {
        console.log(err);
    } else if (downloaded) {
        console.log(`Completed the download of "${filename}"`);
    } else {
        console.log(`"${filename}" was already downloaded`);
    }
});
```

<p>
    수정한 코드와 기존 코드의 기능 및 인터페이스는 같으며, 코드가 구성된 방식만 바뀌었다. 기본 원칙을 적용함으로써 코드의 중첩을 줄이고, 재사용성 및 테스트 가능성을 높일 수 있었다.
</p>

### 2-3 순차 실행

![1](https://user-images.githubusercontent.com/38815618/102744744-dc4ea480-439d-11eb-80d3-b05cf6afa27a.PNG)

<p>
    일련의 작업을 순차적으로 실행한다는 것은 한 번에 하나씩 실행한다는 것을 의미한다. 목록 상의 작업 결과가 다음 작업의 실행에 영향을 줄 수 있으므로 실행 순서가 중요하고, 이를 보존해야 한다. 이 흐름에는 다음의 변형이 있다.
</p>

- 결과를 전달하거나 전파하지 않고 일련의 알려진 작업을 순서대로 실행한다.
- 작업의 출력을 다음 작업의 입력으로 사용한다(체인, 파이프라인, 폭포수라고도 함).
- 순차적으로 각 요소에 대해 비동기 작업을 실행하면서 일련의 작업들을 반복한다.

#### 알려진 일련의 작업에 대한 순차 실행

```javascript
function task1(callback) {
    asyncOperation(() => {
        task2(callback);
    });
}

function task2(callback) {
    asyncOperation(result, () => {
        task3(callback);
    });
}

function task3(callback) {
    asyncOperation(() => {
        callback();
    });
}

task1(() => {
    console.log('task 1, 2 and 3 executed');
})
```

<p>
    위의 패턴은 일반적인 비동기 작업 완료 시, 각 작업이 다음 작업을 호출하는 방법을 보여준다. 이 패턴은 작업의 모듈화에 중점을 두어 비동기 코드를 처리하는데 항상 클로저를 사용할 필요가 없다는 것을 보여준다. 또한 실행될 작업의 수와 양을 미리 알고 있을 경우 완벽하게 작동한다.
</p>

#### 순차 반복

##### 웹 스파이더 버전 2

```javascript
function spider(url, nesting, callback) {
    const filename = utilities.urlToFilename(url);
    fs.readFile(filename, 'utf8', (err, body) => {
        if (err) {
            if (err.code !== 'ENOENT') {
                return callback(err);
            }
            return download(url, filename, (err, body) => {
                if (err) {
                    return callback(err);
                }
                spiderLinks(url, body, nesting, callback);
            });
        }
        spiderLinks(url, body, nesting, callback);
    });
}
```

<p>
    위의 코드는 웹 페이지에 포함된 모든 링크를 재귀적으로 다운로드한다. 이를 위해 페이지에서 모든 링크를 추출한 다음, 각각의 웹 스파이더를 재귀적으로 순서대로 시작한다.
</p>

<p>
    첫 번째 단계는 spiderLinks()라는 함수를 사용하여 페이지의 모든 링크를 재귀적으로 다운로드 하도록 하는 것이다. 또한 파일이 이미 존재하는지 체크하는 대신, 해당 파일에 대한 읽기를 먼저 시도하여 파일 내의 링크들의 수집을 시작한다. 이런 방식으로 중단된 다운로드를을 다시 시작할 수 있다. 마지막으로 재귀의 깊이를 제한하는데 사용되는 nesting이라는 새로운 인자를 전달한다.
</p>

##### 링크들의 순차 크롤링

```javascript
// 순차 비동기 반복 알고리즘을 사용하여 HTML 페이지의 모든 링크를 다운로드
function spiderLinks(currentUrl, body, nesting, callback) {
    if (nesting === 0) {
        return process.nextTick(callback);
    }
    let links = utilities.getPageLinks(currentUrl, body); // 1.
    function iterate(index) { // 2.
        if (index === links.length) {
            return callback();
        }

        spider(links[index], nesting - 1, err => { // 3.
            if (err) {
                return callback(err);
            }
            iterate(index + 1);
        });
    }
    iterate(0); // 4.
}
```

1. `utilities.getPageLinks()` 함수를 통해 페이지에 포함된 모든 링크 목록을 가져온다. 이 함수는 내부의 대상(동일 호스트 이름)을 가리키는 링크들만 반환한다.
2. `iterate()`라는 로컬 함수를 사용하여 링크를 반복한다. iterate()는 분석할 다음 링크의 인덱스를 사용한다. 이 함수에서 먼저 하는 일은 인덱스가 링크 배열의 길이와 같은지 확인하는 것이다. 이 경우 모든 항목을 처리했으므로 즉시 `callback()` 함수를 호출한다.
3. 이 시점에서 링크를 처리하기 위한 모든 준비가 완료되어야 한다. 중첩 레벨을 줄여 `spider()` 함수를 호출하고 작업이 완료되면 반복의 다음 단계를 호출한다.
4. `spiderLinks()` 함수의 마지막 단계에서 `iterate(0)`를 호출하여 재귀 작업을 시작시킨다.

##### 패턴

```javascript
function iterate(index) {
    if (index === tasks.length) {
        return finish();
    }
    const task = tasks[index];
    task(function() {
        iterate(index + 1);
    });
}

function finish() {
    // 반복 작업이 완료된 후 처리
}

iterate(0);
```

<p>
    위의 코드는 컬렉션의 요소들이나 또는 일반적인 작업 목록에 대해 비동기 순차적으로 반복해야 하는 상황에 사용할 수 있는, 일반화한 패턴이다.
</p>

### 2-4 병렬 실행

![2](https://user-images.githubusercontent.com/38815618/102744746-dce73b00-439d-11eb-99e0-691373e59607.PNG)

<p>
    일련의 비동기 작업들의 실행 순서가 중요하지 않고 단지 이런 작업들의 모든 실행이 끝났을 때 알림을 받으면 되는 경우가 있다. 이러한 상황은 병렬 실행 흐름을 사용하여 보다 효과적으로 처리할 수 있다. Node.js의 논 블로킹 성질 때문에 싱글 스레드로도 동시성을 달성할 수 있다. 실제로 이러한 경우 병렬이란 용어는 맞지 않다. 작업들을 동시에 실행하는 것이 아닌 이벤트 루프에 의해 인터리브 된다든 것을 의미하기 때문이다.
</p>

![3](https://user-images.githubusercontent.com/38815618/102744747-dd7fd180-439d-11eb-927f-e313873d812f.PNG)

1. Main 함수는 Task1과 Task2를 실행시킨다. 이와 같이 비동기 작업이 시작되면 즉시 컨트롤을 Main 함수로 되돌려 주며, Main 함수는 이를 이벤트 루프로 반환한다.
2. Task1의 비동기 작업이 완료되면 이벤트 루프가 제어를 돌려준다. Task1이 작업을 완료하면 Main 함수에 이를 통지한다. 이때 Task1의 자체적인 내부 작업 수행은 동기적이다.
3. Task2에 의해 시작된 비동기 작업이 완료되면 이벤트 루프가 해당 콜백을 호출하여 다시 제어를 Task2로 되돌려 준다. Task2가 끝나면 Main 함수에 다시 통지된다. 이 시점에서 Main 함수는 Task1과 Task2가 모두 완료되었음을 인지하고 있으므로 자신의 실행을 계속하거나 작업 결과를 다른 콜백으로 반환할 수 있다.

<p>
    Node.js에서는 논 블로킹 API에 의해 내부적으로 동시 처리되기 때문에 병렬 비동기 작업으로 실행된다는 것이다. Node.js에서 동기(블로킹) 작업은 실행을 비동기 작업으로 끼워 넣거나, `setTimeout()` 또는 `setImmediate()`로 지연시키지 않는 한 동시에 실행할 수 없다.
</p>

#### 웹 스파이더 버전 3

```javascript
function spiderLinks(currentUrl, body, nesting, callback) {
    if (nesting === 0) {
        return process.nextTick(callback);
    }
    const links = utilities.getPageLinks(currentUrl, body);
    if (links.length === 0) {
        return process.nextTick(callback);
    }

    let completed = 0, hasErrors = false;
    function done(err) { // 2.
        if (err) {
            hasErrors = true;
            return callback(err);
        }
        if(++completed === links.length && !hasErrors) {
            return callback();
        }
    }

    links.forEach(link => { // 1.
        spider(link, nesting - 1, done);
    });
}
```

<p>
    위의 코드는 모든 링크된 페이지들을 병렬로 다운로드하게 하여 프로세스의 성능을 쉽게 향상시킨다. 이를 위해 `spider()` 작업을 생성하여 이들의 모든 작업이 완료될 때 최종 콜백을 호출하도록 `spiderLinks()` 함수를 수정해야 한다.
</p>

1. 모든 작업을 한번에 시작한다. 앞선 작업이 완료될 때까지 기다리지 않고, 단순히 배열 내의 링크에 대해 각각의 작업을 시작시키는 것으로 충분하다.
2. 어플리케이션이 모든 작업을 완료할 때까지 기다리는 방법은 `spider()` 함수에 `done()`이라는 특수한 콜백을 전달하는 것이다. `done()` 함수는 `spider()` 작업이 완료되면 카운터를 증가시킨다. 완료된 다운로드 수가 링크 배열의 크기에 도달하면 최종 콜백이 호출된다.

#### 패턴

```javascript
const tasks = [ /* ... */];
let completed = 0;
tasks.forEach(task => {
    task(() => {
        if (++completed === tasks.length) {
            finish();
        }
    });
});

function finish() {
    // 모든 작업이 완료됨
}
```

<p>
    위의 패턴을 적용하여 적은 수정으로 각 작업의 결과를 컬렉션에 모으거나, 배열의 요소를 필터링하거나 또는 맵핑하거나, 일정한 작업의 수가 완료되면 즉시 `finish()` 콜백을 호출하도록 할 수 있다. 특히 마지막 상황을 경쟁(race)라고 한다.
</p>

#### 동시 작업에서의 경쟁 조건 조정

<p>
    멀티 스레드 환경에서 논블로킹 I/O를 사용하는 경우 여러 작업을 병렬로 실행할 때 문제가 발생할 수 있다. 하지만 Node.js에서 여러 개의 비동기 작업을 병렬로 실행하는 것은 리소스 측면에서 직관적이면서 비용이 적게 든다.
</p>

<p>
    Node.js의 동시성 모델의 또 다른 특징은 작업 동기화 및 경쟁 조건을 다루는 방식이다. 멀티 스레드 프로그래밍에서 보통 락, 뮤텍스, 세마포어 및 모니터와 같은 구조를 사용하여 수행되며, 병렬화의 성능에 상당한 영향을 미칠 뿐만 아니라 가장 복잡한 측면 중 하나일 수 있다. Node.js에서는 모든  것이 싱글 스레드에서 실행되기 때문에 일반적으로 동기화 메커니즘을 필요하지 않는다. 하지만 이것이 경쟁 조건을 가지지 않는 다는 것을 의미하지 않으며, 오히려 아주 일반적이다. 문제의 근본 원인은 비동기 작업 호출과 그 결과 통지 사이에 생기는 지연이다.
</p>

```javascript
function spider(url, nesting, callback) {
    const filename = utilities.urlToFilename(url);
    fs.readFile(filename, 'utf8', (err, body) => {
        if (err) {
            if (err.code !== 'ENOENT') {
                return callback(err);
            }
            return download(url, filename, (err, body) => {
            // ...
```

<p>
    `spider()` 함수에서 경쟁 고건이 발생하는 부분은 해당 URL을 다운로드하기 전에 파일이 이미 존재하는지 확인하는 부분이다. 동일한 URL에 대한 두 개의 spider 작업을 수행할 경우, 다운로드를 완료한 후 파일을 생성하지 않은 상황에서 `fs.readFile()`을 호출하게 되면 두 작업 모두 다운로드하게 된다.
</p>

![4](https://user-images.githubusercontent.com/38815618/102744748-de186800-439d-11eb-99d6-56921eeb494e.PNG)

<p>
    위 그림은 Task 1과 Task 2가 Node.js의 단일 스레드에서 인터리브되는 방법과 비동기 작업이 실제로 경쟁 조건이 발생할 수 있는 경우를 보여준다. 이를 해결하기 위해선 동일한 URL에서 실행되는 여러 `spider()` 작업을 상호 배제할 수 있는 변수를 추가한다.
</p>

```javascript
const spidering = new Map();
function spider(url, nesting, callback) {
    if (spidering.has(url)) {
        return process.nextTick(callback);
    }
    spidering.set(url, true);
    
    const filename = utilities.urlToFilename(url);
    fs.readFile(filename, 'utf8', (err, body) => {
        if (err) {
            if (err.code !== 'ENOENT') {
                return callback(err);
            }
            return download(url, filename, (err, body) => {
                if (err) {
                    return callback(err);
                }
                spiderLinks(url, body, nesting, callback);
            });
        }
        spiderLinks(url, body, nesting, callback);
    });
}
```

<p>
    변수 `spidering`로 인해 지정된 URL에 대해 조회하고 존재하는 경우 함수는 즉시 종료되고, 그렇지 않은 경우 플래그를 설정하고 다운로드를 계속한다. 이 경우 두 개의 spider 작업이 완전히 다른 시점에 실행되더라도 다시 다운로드를 하지 않을 것이라는 전제를 가지게 되기 때문에 잠금을 해지할 필요가 없다.
</p>

<p>
    경쟁 상황은 싱글 스레드 환경에 있어서도 많은 문제를 일으킬 수 있다. 경우에 따라서는 데이터 손상으로 이어질 수 있으며 일시적인 특성으로 인해 디버그 하기가 매우 어렵다. 따라서 작업을 병렬로 실행할 때 이러한 유형의 상황을 명확하게 확인하는 것이 좋다.
</p>

### 2-5 제한된 병렬 실행

<p>
    종종 제어하지 않고 병렬 작업을 생성하면 과도한 부하가 발생할 수 있다. 이러한 상황에서 흔히 발생하는 문제는 한 번에 너무 많은 파일을 열려고 할 경우 어플리케이션에서 사용할 수 있는 모든 파일 기술자(fd)를 사용하여 리소스가 부족하게 된다. 웹 어플리케이션에서는 DoS(Denial of Service) 공격으로 악용될 수 있는 취약점이 발생할 수도 있다. 이러한 모든 상황에서는 동시에 실행할 수 있는 작업의 수를 제한하는 것이 좋다. 이렇게 하면 서버의 부하에 대한 예측성을 가질 수 있으며, 어플리케이션의 리소스가 부족하지 않도록 할 수 있다. 아래의 그림은 동시 실행을 2로 제한한 상태에서 실행할 5개의 작업이 있는 상황을 말한다.
</p>

![5](https://user-images.githubusercontent.com/38815618/102744752-de186800-439d-11eb-990e-9c623f2b6d41.PNG)

1. 처음에 동시 실행의 제한을 초과하지 않는 최대한 많은 작업을 생성한다.
2. 이후 작업이 완료될 때마다 한도에 도달하지 않도록 하나 또는 하나 이상의 작업을 만든다.

#### 동시 실행 제한하기

```javascript
const tasks = ...
let concurrency = 2, running = 0, completed = 0, index = 0;
function next() { // 1.
    while(running < concurrency && index < tasks.length) {
        task = tasks[index++];
        task(() => { // 2.
            if (completed === tasks.length) {
                return finish();
            }
            completed++, running--;
            next();
        });
        running++;
    }
}
next();

function finish() {
    // 모든 작업이 완료됨
}
```

<p>
    위 패턴은 순차 실행과 병렬 실행의 혼합으로 볼 수 있으며, 이전의 두 가지 패턴이 유사하다.
</p>

1. `next()`라는 반복 호출 함수가 있으며, 동시 실행 제한 내에서 가능한 많은 작업을 병렬로 생성하는 내부 루프가 있다.
2. 이 콜백은 목록의 모든 작업을 완료했는지 확인한다. 실행할 작업이 있으면 `next()`를 호출하여 다른 작업을 생성한다.

#### 전역적으로 동시 실행 제한하기

##### 큐를 사용한 해결

```javascript
class TaskQueue {
    constructor(concurrency) {
        this.concurrency = concurrency;
        this.running = 0;
        this.queue = [];
    }

    pushTask(task) {
        this.queue.push(task);
        this.next();
    }
    
    next() {
        while(this.running < this.concurrency && this.queue.length) {
            const task = this.queue.shift();
            task(() => {
                this.running--;
                this.next();
            });
            this.running++;
        }
    }
};
```

<p>
    위 클래스의 생성자는 동시 실행 제한만을 입력으로 받아 그 외에 running, queue와 같은 변수들을 초기화한다. running 변수는 실행 중인 모든 작업을 추적하는데 사용되는 카운터이며, queue는 보류 중인 작업들을 저장하는 큐로 사용될 배열이다.
</p>

<p>
    `pushTask()` 메소드는 단순히 새 작업을 큐에 추가한 다음, `this.next()`를 호출하여 작업 실행을 로드한다. `next()` 메소드는 동시 실행 제한을 초과하지 않도록 큐에서 일련의 작업을 만들어 낸다. 기본적으로 동시 실행 제한을 초과하지 않는 가능한 최대한의 작업을 큐로부터 시작한다. 각 작업이 완료되면 실행 중인 작업 수를 갱신한 후에 `next()`를 다시 호출하여 다른 작업을 시작한다.
</p>

<p>
    TaskQueue 클래스에서 흥미로운 점은 새 작업을 큐에 동적으로 추가할 수 있다는 것이다. 다른 장점은 이제 작업들의 동시 실행 제한에 대한 엔티티를 중앙에서 가지고 함수 실행의 모든 인스턴스에서 공유할 수 있다는 것이다.
</p>

##### 웹 스파이더 버전 4

```javascript
function spiderLinks(currentUrl, body, nesting, callback) {
    if (nesting === 0) {
        return process.nextTick(callback);
    }
    const links = utilities.getPageLinks(currentUrl, body);
    if (links.length === 0) {
        return process.nextTick(callback);
    }

    let completed = 0, hasErrors = false;
    links.forEach(link => {
        downloadQueue.pushTask(done => {
            spider(link, nesting - 1, err => {
                if (err) {
                    hasErrors = true;
                    return callback(err);
                }
                if (++completed === links.length && !hasErrors) {
                    callback();
                }
                done();
            });
        });
    });
}
```

- 사용자 정의 콜백을 제공하여 `spider()` 함수를 실행한다.
- 콜백에서 `spiderLinks()` 함수 실행과 관련된 모든 작업이 완료되었는지 확인한다. 이 조건이 true면 `spiderLinks()` 함수의 최종 콜백을 호출한다.
- 작업이 끝나면 queue가 실행을 꼐속 할 수 있도록 `done()` 콜백을 호출한다.
