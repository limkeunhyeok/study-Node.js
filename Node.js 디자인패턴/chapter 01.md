# Chapter 01 - Node.js 플랫폼에 오신 것을 환영합니다.

## 1. Node.js 철학

### 1-1 경량 코어

<p>
    코어를 최소의 기능 세트로 하고, 나머지를 사용자의 몫으로 해서, 핵심 모듈의 바깥 영역 모듈들을 생태계에 맡기는 것이다. 핵심 기능 세트를 최소한으로 유지하면, 유지 보수 측면에서 편리할 뿐만 아니라 전체 생태계의 발전에 긍정적인 문화적 영향을 가져올 수 있다.
</p>

### 1-2 경량 모듈

- 작은 것이 아름답다
- 각 프로그램이 각기 한 가지 역활을 잘 하도록 만든다

<p>
    Node.js는 npm을 통해 설치된 각 패키지가 각기 고유한 별도의 일련의 의존성을 가지도록 함으로써, 프로그램 충돌 없이 많은 패키지들을 의존할 수 있다. 사실 Node의 방식은 어플리케이션을 작고 잘 집중화된 수많은 의존성들로 구성하여 재사용성을 극도로 높인다. 작은 모듈은 재사용성뿐만 아니라 아래의 장점을 가진다.
</p>

- 이해하기 쉽고 사용하기 쉽다
- 테스트 및 유지보수가 훨씬 간단하다
- 브라우저와 완벽한 공유가 가능하다

<p>
    더 작고 집중된 모듈을 사용하면 작은 코드 조각이라 해도 모두가 공유하거나 재사용할 수 있다. 이것은 DRY(Don't Repeat Yourself, 같은 것을 반복하지 말라) 원칙에 대한 새로운 차원의 적용이다.
</p>

### 1-3 작은 외부 인터페이스

<p>
    Node.js 모듈은 크기와 범위가 작을 뿐만 아니라 대개 최소한의 기능을 노출하는 특성을 가지고 있어, API 사용이 보다 명확해지고 잘못된 사용에 덜 노출된다.
</p>

<p>
    Node.js에서 모듈을 정의하는 가장 일반적인 패턴은 함수나 생성자와 같이 하나의 핵심 기능을 표현하는 동시에, 더 많은 고급 기능이나 보조 기능은 노출된 함수나 생성자의 속성이 되도록 하는 것이다. 이를 통해 사용자는 중요한 내용과 부수적인 내용을 구분할 수 있다.
</p>

<p>
    Node.js 모듈은 확장 용도보다는 실제 사용하도록 만들어진다. 확장 가능성을 금지시켜 모듈의 내부를 잠그는 것은 유스케이스를 줄이고, 구현을 단순화하며, 유지 관리를 용이하게 하고, 가용성을 높인다.
</p>

### 1-4 간결함과 실용주의

> 디자인은 구현과 인터페이스 모두에서 단순해야 한다. 구현이 인터페이스 보다 단순해야 하는 것이 더 중요하다. 단순함은 설계에서 가장 중요한 고려 사항이다.

<p>
    단순한 설계는 구현하는데 소요되는 노력과 자원을 적게 사용하여 더 빨리 보급할 수 있고 적응과 유지보수 및 이해가 쉽다. 이러한 요인들은 커뮤니티의 기여도를 높이고, 소프트웨어 자체가 성장하고 향상될 수 있도록 한다.
</p>

## 2. Node.js 6와 ES2015에 대한 소개

### 2-1 let과 const 키워드

- 기존 javascript는 함수 스코프와 전역 스코프만을 지원하여 변수의 생명주기 및 접근을 제어

```javascript
if (false) {
    var x = 'hello';
}

console.log(x) // undefined
```

- 위의 코드처럼 잠재적 오류를 피하기 위해, let 키워드를 사용하여 블록 스코프를 준수하는 변수를 선언

```javascript
if (false) {
    let x = 'hello';
}

console.log(x) // ReferenceError: x is not defined
```

- const 키워드는 상수 변수를 선언

```javascript
const x = 'This will never change';
x = '...'; // TypeError: Assignment to constant variable
```

- 아래의 코드처럼 객체 내부에서 속성을 변경하면 실제 값(객체)이 변경되지만 변수와 객체 사이의 바인딩은 변경되지 않으므로 오류를 발생시키지 않음
- 반대로 전체 변수를 재할당하면 변수와 값 사이의 바인딩이 변경되어 오류가 발생

```javascript
const x = {};
x.name = 'John'; // 오류가 발생하지 않음
x == null; // 오류 발생
```

### 2-2 화살표 함수

- 화살표 함수는 함수 정의를 위한 보다 간결한 구문으로 콜백을 정의할 때 유용

```javascript
const numbers = [2, 6, 7, 8, 1];
// 기존 구문
const even = numbers.filter(function(x) {
    return x%2 === 0;
});

// 화살표 함수 사용
const even = numbers.filter(x => x%2 === 0);
```

- 화살표 함수는 어휘 범위(lexical scope)로 바인드
  - 화살표 함수 내부의 this 값은 부모 블록의 값과 같음

### 2-3 클래스 구문

```javascript
// 프로토타입
function Person(name, surname, age) {
    this.name = name;
    this.surname = surname;
    this.age = age;
}

Person.prototype.getFullName = function() {
    return this.name + ' ' + this.surname;
};

Person.older = function(person1, person2) {
    return (person1.age >= person2.age) ? person1 : person2;
};

// 클래스
class Person {
    constructor (name, surname, age) {
        this.name = name;
        this.surname = surname;
        this.age = age;
    }

    getFullName() {
        return this.name + ' ' + this.surname;
    }

    static older(person1, person2) {
        return (person1.age >= person2.age) ? person1 : person2;
    }
}
```

<p>
    ES2015에서 객체지향 언어의 개발자에게 익숙한 방식인 클래스를 소개하였다. 이 구문은 자바스크립트 런타임에 의해 내부적으로 객체가 관리되는 방식이 변했다는 것은 아니다. 개발자에게 매우 유용하고 가독성이 뛰어난, 단지 구문 상의 편의를 위한 것이다.
</p>

<p>
    위 코드에서 두 가지 구현은 동일한 의미지만, 클래스의 핵심적인 특징은 extend 및 super 키워드를 사용하여 확장할 수 있다는 것이다.
</p>

```javascript
class PersonWithMiddlename extends Person {
    constructor(name, middlename, surname, age) {
        super(name, surname, age);
        this.middlename = middlename;
    }

    getFullName() {
        return this.name + '' + this.middlename + '' + this.surname;
    }
}
```

<p>
    위의 코드는 extends를 사용하여 Person 클래스를 확장한 것이다. super 키워드를 사용하여 부모 생성자를 호출하는 새로운 생성자를 정의하였으며, getFullName 함수를 오버라이드하였다.
</p>

### 2-4 향상된 객체 리터럴

- 이 문법은 변수 및 함수를 객체의 멤버로 지정하고, 객체를 생성할 때 동적인 멤버명을 정의할 수 있도록 하며, 편리한 setter 및 getter 함수들을 제공

```javascript
const person = {
    name: 'George',
    surname: 'Boole',

    get fullname() {
        return this.name + ' ' + this.surname;
    },

    set fullname(fullname) {
        let parts = fullname.split(' ');
        this.name = parts[0];
        this.surname = parts[1];
    }
};

console.log(person.fullname); // George Boole
console.log(person.fullname = 'Alan Turing'); // Alan Turing
console.log(person.name); // Alan
```

<p>
    위 코드에서 person은 속성으로 name과 surname 그리고 set과 get을 통해 조작되는 fullname 이렇게 세 가지 속성이 있다. 두 번째 console.log에서 Alan Turing을 출력하는데, 기본적으로 모든 set 함수가 동일한 속성에 대하여 get 함수가 반환하는 값을 반환한다.
</p>

### 2-5 Map과 Set Collection

```javascript
const profiles = new Map();
profiles.set('twitter', '@adalovelace');
profiles.set('facebook', 'adalovelace');
profiles.set('googleplus', 'ada');

console.log(profiles.size); // 3
console.log(profiles.has('twitter')); // true
console.log(profiles.get('twitter')); // @adalovelace
console.log(profiles.has('youtube')); // false
console.log(profiles.delete('facebook')); // true
console.log(profiles.has('facebook')); // false
console.log(profiles.get('facebook')); // undefined
console.log('-------------------');

for (const entry of profiles) {
    console.log(entry);
};
// [ 'twitter', '@adalovelace' ]
// [ 'googleplus', 'ada' ]
```

<p>
    ES2015에서 안전하고 유연하며 직관적인 방식으로 해시 맵 컬렉션을 활용하도록 특별히 설계된 Map이라는 새로운 프로토타입을 도입했다. 위의 코드처럼 Map 프로토타입에는 몇 가지 편리한 메소드를 제공한다.
</p>

```javascript
const tests = new Map();
tests.set(() => 2+2, 4);
tests.set(() => 2*2, 4);
tests.set(() => 2/2, 1);

for (const entry of tests) {
    console.log((entry[0]() === entry[1]) ? 'PASS' : 'FAIL');
}
```

<p>
    Map은 일반 객체와 달리 함수와 객체를 Map의 키로 사용할 수 있다. 위의 코드는 함수를 키로 저장하고, 예상되는 결과를 값으로 저장했다. hash map의 함수들은 반복 구문을 통해 실행되는데 모든 entry들은 삽입 순서대로 출력된다. 이는 일반 객체로 map을 구현했을 경우 항상 보장되지는 않는다.
</p>

```javascript
const s = new Set([0, 1, 2, 3]);
s.add(3); // 추가되지 않음
console.log(s.size); // 4
s.delete(0);
console.log(s.has(0)); // false

for (const entry of s) {
    console.log(entry);
}
// 1 2 3
```

<p>
    ES2015에서 Map과 함께 Set 프로토타입을 소개한다. 이 프로토타입을 사용하면 모든 요소들이 유일한 고유값을 가지는 목록인 집합을 쉽게 만들 수 있다. 또한 set은 그 요소로 객체와 함수를 가질 수 있다.
</p>

### 2-6 WeakMap 및 WeakSet Collection

<p>
    WeakMap은 인터페이스 측면에서 Map과 매우 유사하다. 차이가 있다면 WeakMap은 가지고 있는 전체를 반복 구문으로 탐색할 방법이 없으며 객체 만을 키로 가질 수 있다. WeakMap의 독특한 특징은 키로 사용된 객체에 대한 유일한 참조가 WeakMap 내에만 남아 있을 경우, 이 객체를 가비지 컬렉트할 수 있다는 것이다. 이것은 생명 주기 내에서 삭제되어야 할 객체와 관련된 몇몇 메타 데이터를 저장하는 경우 유용하다.
</p>

```javascript
let obj = {};
const map = new WeakMap();
map.set(obj, {key: 'some_value'});
console.log(map.get(obj)); // { key: 'some_value' }
obj = undefined; // 다음 가비지 컬렉트 사이클에서 맵에 관련된 객체와 데이터가 정리됨
```

<p>
    위의 코드는 obj라는 일반 객체를 생성한 뒤, 이 객체에 대한 메타 데이터를 map이라는 WeakMap에 저장한다. 이 메타 데이터는 map의 get 메서드를 통해 획득할 수 있으며, 해당 객체에 undefined를 값으로 할당함으로써 객체를 제거할 수 있다.
</p>

<p>
    WeakSet도 WeakMap과 마찬가지로, WeakSet 내 유일 참조가 남을 경우 해당 객체를 가비지 컬렉트할 수 있다.
</p>

### 2-7 Template 표기법

<p>
    이 구문은 역 따옴표(`)를 구분 기호로 사용하며, 일반 따옴표나 큰 따옴표를 구분 기호로 사용하는 문자열과 비교할 때 여러 가지 이점을 제공한다. 주요 이점은 ${expression}의 형식으로 변수 또는 표현식을 삽입할 수 있다.
</p>

### 2-8 ES2015의 기타 기능들

- 기본 매개 변수(Default function parameters)
- 나머지 매개 변수(Rest parameters)
- 전개 연산자(Spread operator)
- 비구조화(Destructuring)
- new.target
- Proxy
- Reflect
- Symbols

## 3. Reactor 패턴

### 3-1 I/O는 속도가 느리다.

<p>
    I/O는 컴퓨터의 기본적인 동작 중에서 가장 느리다. I/O는 일반적으로 CPU 측면에서 비용이 많이 들지 않지만, 요청을 보낸 순간부터 작업이 완료되는 순간까지 지연을 동반하게 된다. 또한 어플리케이션의 입력은 실시간 채팅 어플리케이션에서 전송 버튼이나 메시지 클릭과 같은 실제 사람의 입력이므로 I/O의 속도와 빈도는 기술적인 면에만 의존하지 않는다. 이 때문에 디스크 또는 네트워크보다 훨씬 느리게 진행될 수 있다.
</p>

### 3-2 블로킹 I/O

<p>
    전통적인 블로킹 I/O 프로그래밍에서는 I/O 요청에 해당하는 함수 호출은 작업이 완료될 때까지 스레드의 실행이 차단된다. 블로킹 I/O를 사용하여 구현된 웹 서버는 동일한 스레드에서 여러 연결을 처리할 수 없다. 각 소켓에서의 모든 I/O 작업이 다른 연결 처리를 차단하기 때문이다. 이러한 이유로 웹 서버에서 동시성을 처리하기 위한 전통적인 접근 방식은 처리해야 하는 각각의 동시 연결에 대해 새로운 스레드 또는 프로세스를 시작하거나 풀에서 가져온 스레드를 재사용하는 것이다. 이렇게 해서 스레드가 I/O 작업으로 차단되어도 분리된 스레드에서 처리되므로 다른 요청의 가용성에는 영향을 미치지 않는다.
</p>

### 3-3 논 블로킹 I/O

<p>
    논 블로킹 I/O에서 시스템 호출은 데이터가 읽히거나 쓰여질 때까지 기다리지 않고 항상 즉시 반환된다. 호출하는 순간에 결과를 사용할 수 없는 경우, 이 함수는 미리 정의된 상수를 반환하여 그 순간에 반환할 수 잇는 데이터가 없음을 나타낸다. 이러한 논 블로킹 I/O에 액세스하는 가장 기본적인 패턴은 실제 데이터가 반환될 때까지 루프 내에서 리소스를 적극적으로 폴링하는 것이며, busy-waiting 이라고 한다. 이러한 기술로 동일한 스레드에서 서로 다른 리소스를 처리할 수 있지만 효율적이지는 않다. 폴링 알고리즘은 대부분 엄청난 양의 CPU 시간 낭비를 초래한다.
</p>

### 3-4 이벤트 디멀티플렉싱

<P>
    대부분의 최신 운영체제는 효율적인 논 블로킹 리소스 처리를 위한 기본적인 메커니즘을 제공한다. 이 메커니즘을 동기 이벤트 디멀티플렉서 또는 이벤트 통지 인터페이스라고 한다. 이 구성 요소는 감시된 일련의 리소스들로부터 들어오는 I/O 이벤트를 수집하여 큐에 넣고 처리할 수 있는 새 이벤트가 있을 때까지 차단한다.
</P>

```javascript
socketA, pipeB;
watchedList.add(socketA, FOR_READ); // 1
watchedList.add(pipeB, FOR_READ);
while(events = demultiplexer.watch(watchedList)) { // 2
    // 이벤트 루프
    foreach(event in events) { // 3
        // 여기서 read는 블록되지 않으며 비어 있을지 언정, 항상 테이터를 반환
        data = event.resource.read();
        if(data === RESOURCE_CLOSED)
            // 리소스가 닫혔기 때문에 리소스 목록에서 제거
            demultiplexer.unwatch(event.resource);
        else
            // 실제 데이터가 도착하여 이를 처리
            consumeData(data);
    }
}
```

1. 리소스를 데이터 구조(List)에 추가한다. 예제에서는 각 인스턴스를 특정 작업(예: read)과 연결한다.
2. 이벤트 통지자에 감시할 리소스 그룹을 설정한다. 이 호출은 동기식이며, 감시 대상 자원 중 하나라도 읽을 준비가 될 때까지 차단된다. 이 경우, 이벤트 디멀티플렉서는 호출로부터 복귀하여 새로운 일련의 이벤트들을 처리할 수 있게 된다.
3. 이벤트 디멀티플렉서에 의해 반환된 각 이벤트가 처리된다. 이 시점에서 각 이벤트와 관련된 리소스는 읽기 작업을 위한 준비가 되어 있으며, 차단되지 않는 상황이라는 것이 보증된다. 모든 이벤트가 처리되고 나면, 이 흐름은 다시 디멀티플렉서에서 처리 가능한 이벤트가 발생할 때까지 차단된다. 이를 이벤트 루프라고 한다.

<p>
    이 패턴을 사용하면 busy-waiting 기술을 사용하지 않고도 단일 스레드 내에서 여러 I/O 작업을 처리할 수 있다. 하나의 스레드만 사용하더라도 다중 I/O 사용 작업을 동시에 실행할 수 있는 능력을 손상시키지 않는다. 작업은 여러 스레드로 분산되지 않고 시간에 따라 분산된다. 또한 하나의 스레드만 갖는다는 것은 프로그래머가 일반적으로 동시성에 접근하는 방식에 유익한 영향을 미친다.
</p>

### 3-5 Reactor 패턴 소개

<p>
    핵심 개념은 각 I/O 작업과 관련된 핸들러를 갖는 것이며, 이 핸들러는 이벤트가 생성되어 이벤트 루프에 의해 처리되는 즉시 호출된다.
</p>

![1](https://user-images.githubusercontent.com/38815618/102319094-b8661a00-3fbd-11eb-9fd7-7c2e26e6b8f9.PNG)

1. 어플리케이션은 이벤트 디멀티플렉서에 요청을 전달함으로써 새로운 I/O 작업을 생성한다. 또한 어플리케이션은 처리가 완료될 때 호출될 핸들러를 지정한다. 이벤트 디멀티플렉서에 새요청을 전달하는 것은 논 블로킹 호출이며, 즉시 어플리케이션에 제어를 반환한다.
2. 일련의 I/O 작업들이 완료되면 이벤트 디멀티플렉서는 새 이벤트를 이벤트 큐에 집어 넣는다.
3. 이 시점에서 이벤트 루프가 이벤트 큐의 항목들에 대해 반복한다.
4. 각 이벤트에 대해서 관련된 핸들러가 호출된다.
5. 어플리케이션 코드의 일부인 핸들러는 실행이 완료되면 이벤트 루프에 제어를 되돌린다.(5a) 그러나 핸들러의 실행 중에 새로운 비동기 동작이 요청(5b)이 발생하여 제어가 이벤트 루프로 돌아가기 전에 새로운 요청이 이벤트 디멀티플렉서(1)에 삽입될 수도 있다.
6. 이벤트 큐 내의 모든 항목이 처리되면, 루프는 이벤트 디멀티플렉서에서 다시 블록되고 처리 가능한 새로운 이벤트가 있을 때 이 과정이 다시 트리거 된다.

<p>
    Reactor 패턴은 일련의 관찰 대상 리소스에서 새 이벤트를 사용할 수 있을 때까지 차단하여 I/O를 처리한 다음, 각 이벤트를 관련 핸들러로 전달함으로서 반응한다.
</p>

### 3-6 Node.js의 논 블로킹 엔진 libuv

<p>
    각 운영체제에는 이벤트 디멀티플렉서에 대한 자체 인터페이스가 있다. 또한 I/O 작업은 동일한 OS 내에서도 리소스 유형에 따라 매우 다르게 작동할 수 있다. 이러한 불일치 때문에 이벤트 디멀티플렉서에 대한 보다 높은 수준의 추상화를 필요로 한다. 이러한 이유로 libuv라는 C 라이브러리가 만들어졌다. 이를 통해 모든 주요 플랫폼과 호환되고, 서로 다른 유형의 리소스들의 논 블로킹 동작을 표준화할 수 있는 것이다. libuv는 기본 시스템 호출을 추상화하는 것 외에도 Reactor 패턴을 구현하고 있으므로 이벤트 루프를 만들고, 이벤트 큐를 관리하며, 비동기 입출력 작업을 실행하고, 다른 유형의 작업을 큐에 담기 위한 API들을 제공한다.
</p>

### 3-7 Node.js를 위한 구조

![2](https://user-images.githubusercontent.com/38815618/102319099-b9974700-3fbd-11eb-9e7e-10deaff55b0c.PNG)

- libuv와 기타 낮은 수준의 기능들을 Javascript에 랩핑하고 사용 가능하도록 해주는 바인딩 세트
- Chrome V8 엔진, Node.js가 매우 빠르고 효율적인 이유 중 하나
- 상위 수준의 Node.js API를 구현하고 있는 코어 Javascript 라이브러리(노드 코어라고 함)
