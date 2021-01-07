# Chapter 06 - 디자인 패턴

> 디자인 패턴은 되풀이하는 문제에 대한 재사용 가능한 솔루션이다. 자바스크립트는 멀티패러다임, 객체지향, 프로토타입 기반이며 동적 자료형을 가지고 있다. 함수를 일급 객체로 취급하고 함수 중심 프로그래밍 스타일을 허용한다. 이러한 특성은 자바스크립트를 매우 다재 다능한 언어로 만들어 개발자에게 엄청난 힘을 부여하지만 동시에 프로그래밍 스타일, 규칙, 기술 그리고 궁극적으로 생태계의 패턴을 분열시키는 원인이 된다. 자바스크립트는 풍부한 프레임워크와 독창적인 라이브러리가 많다. 이러한 맥락에서 전통적인 디자인 패턴은 자바스크립트의 특성에도 영향을 받았다. 구현하는 방법이 다양해서 패턴이라 부를 수 없을 수도 있지만, 각 패턴의 기반에 있는 독창적인 아이디어, 해결해야 할 문제 그리고 핵심 개념은 변하지 않는다.

## 1. 팩토리(Factory)

### 1-1 객체를 생성하기 위한 제너릭 인터페이스

<p>
    자바스크립트에서 단순성, 유연성, 그리고 작은 공개 API를 위해 함수 위주의 패러다임이 순수한 객체지향 설계보다 더 선호된다. 특히 객체의 새 인스턴스를 작성할 때 더 선호된다. 실제로, new 연산자 또는 Object.create()를 사용하여 프로토타입에서 직접 새 객체를 만드는 대신 팩토리를 호출하면 여러 면에서 훨씬 편리하고 유연하다.
</p>

<p>
    팩토리는 객체 생성을 구현과 분리할 수 있게 해준다. 근본적으로 팩토리는 새로운 인스턴스의 생성을 감싸서 우리가 하는 방식에 더 많은 유연성과 제어력을 제공한다. 팩토리 내에서 클로저를 활용하고 프로토타입과 new 연산자 또는 Object.create()를 사용하여 새로운 인스턴스를 만들거나 또는 특정 조건에 따라 다른 인스턴스를 반환할 수도 있다. 팩토리의 소비자는 인스턴스 생성이 수행되는 방법에 대해서는 적적으로 알 필요가 없다. new 연산자를 사용하면 객체 하느를 생성하는데 한 가지 특정한 방법으로만 코드를 바인드할 수 있으나 자바스크립트에서는 더 유연하고 거의 제약이 없을 수 있다.
</p>

```javascript
// 팩토리
function createImage(name) {
    return new Image(name);
}
const image = createImage('photo.jpeg');

// 클래스를 인스턴스화
const image = new Image(name);
```

<p>
    new를 사용하면 하나의 특정한 유형의 객체 만을 코드에 바인딩할 수 있다. 위의 경우 Image 유형의 객체에 바인딩된다. 팩토리는 대신 더 많은 유연성을 제공한다. 각각의 이미지 형식에 맞는 더 작은 객체들로 나누어 리팩토링한다고 할 때, 팩토리는 기존 코드의 변경을 최소화하여 작성할 수 있다.
</p>

```javascript
function createImage(name) {
    if (name.match(/\.jpeg$/)) {
        return new JpegImage(name);
    } else if (name.match(/\.gif$/)) {
        return new GifImage(name);
    } else if (name.match(/\.png$/)) {
        return new PngImage(name);
    } else {
        throw new Exception('Unsupported format');
    }
}
```

<p>
    팩토리는 생성된 객체의 생성자를 노출시키지 않고 객체를 확장하거나 수정하지 못하도록 한다. Node.js에서는 각 생성자를 비공개로 유지하면서 팩토리만 내보내는 방법으로 이 작업을 수행할 수 있다.
</p>

### 1-2 캡슐화를 강제하기 위한 메커니즘

<p>
    자바스크립트에는 접근 수준 지정자가 없다(예로 private 변수를 선언할 수 없음). 따라서 캡슐화를 적용하는 유일한 방법은 함수 스코프와 클로저를 사용하는 것이다. 팩토리는 private 변수를 적용하기가 쉽다.
</p>

```javascript
function createPerson(name) {
    const privateProperties = {};

    const person = {
        setName: name => {
            if(!name) throw new Error('A person must have a name');
            privateProperties.name = name;
        },
        getName: () => {
            return privateProperties.name;
        }
    };

    person.setName(name);
    return person;
}
```

<p>
    위 코드에서 클로저를 사용하여 두 개의 객체를 생성한다. 팩토리에 의해 반환되는 공용 인터페이스를 나타내는 person 객체와 외부에서 액세스할 수 없고 person 객체가 제공하는 인터페이스를 통해서만 조작할 수 있는 privateProperties 객체를 생성한다.
</p>

<p>
    팩토리는 private 멤버를 생성하기 위한 기술 중 하나일 뿐이다. 이 외에 다른 접근 방법은 다음과 같다.
</p>

- 생성자에서 private 변수 정의하기(`http://crockford.com/javascript/private.html` 참고)
- 규칙(convention) 사용하기: 속성 이름 앞에 밑줄(_) 또는 달러 기호($)를 붙임(이것은 기술적으로 멤버가 외부에서 접근되는 것을 막지는 못함)
- ES2015 WeakMap 사용하기(Mozilla 참고)

### 1-3 간단한 코드 프로파일러 작성하기

- 코드 프로파일러 속성
  - 프로파일링 세션을 시작시키는 `start()` 메소드
  - 세션을 종료하고 실행 시간을 콘솔에 기록하는 `end()` 메소드

```javascript
// profiler.js
class Profiler {
    constructor(label) {
        this.label = label;
        this.lastTime = null;
    }

    start() {
        this.lastTime = process.hrtime();
    }

    end() {
        const diff = process.hrtime(this.lastTime);
        console.log(
            `Timer "${this.label}" took ${diff[0]} seconds and ${diff[1]} nanoseconds.`
        );
    }
}
```

<p>
    위의 코드는 `start()`가 호출되면 단순히 세밀한 타이머를 사용하여, 현재의 시간을 저장하고, `end()`가 실행되면 경과 시간을 계산하여 결과를 콘솔에 출력한다.
</p>

<p>
    이런 프로파일러를 사용하여 다른 루틴의 실행 시간을 계산할 경우, 특히 프로덕션 환경에서 표준 출력으로 생성될 엄청난 양의 로그를 쉽게 상상할 수 있다. 여기서 원하는 것은 프로파일링 정보를 다른 소스(예: 데이터베이스)로 리다이렉션하거나 어플리케이션이 프로덕션 모드에서 실행 중인 경우 프로파일러를 모두 비활성화 하는 것이다. new 연산자를 사용하여 Profiler 객체를 직접 인스턴스화한 경우, 다른 로직을 적용하기 위해서는 클라이언트 코드 또는 Profiler 객체에 추가적인 로직을 적용해야 한다. 이에 대신 Profiler의 생성을 추상화하기 위해 팩토리를 사용할 수 있다. 어플리케이션이 프로덕션 모드에서 실행되는지, 개발 모드에서 실행되는지 여부에 따라 완벽하게 동작하는 Profiler 객체를 또는 동일한 인터페이스를 가진 빈 메소드가 있는 모의(mock) 객체를 반환할 수 있다.
</p>

```javascript
module.exports = function(label) {
    if (process.env.NODE_ENV === 'development') {
        return new Profiler(label); // 1.
    } else if (process.env.NODE_ENV === 'production') {
        return {
            start: function() {},
            end: function() {}
        }
    } else {
        throw new Error('Must set NODE_ENV');
    }
};
```

- 만든 팩토리는 Profiler 객체의 생성을 추상화한다.
  1. 어플리케이션이 개발 모드에서 실행 중인 경우, new를 사용해 완전한 기능을 갖춘 Profiler 객체를 반환한다.
  2. 대신 어플리케이션이 프로덕션 모드로 실행 중이면 `start()`와 `end()` 메소드가 비어있는 모의(Mock) 객체를 반환한다.

<p>
    팩토리 함수를 사용하면 어떤 방식으로든 객체를 생성할 수 있으며, 추가적인 초기화 단계를 수행하거나 특정 조건을 기반으로 다른 유형의 객체를 반환할 수 있다. 또한 이 모든 세부 사항을 객체의 소비자로부터 격리할 수 있다.
</p>

```javascript
// profileTest.js
const profiler = require('./profiler');

function getRandomArray(len) {
    const p = profiler(`Generating a ${len} items long array`);
    p.start();
    const arr = [];
    for (let i = 0; i < len; i++) {
        arr.push(Math.random());
    }
    p.end();
}

getRandomArray(1e6);
console.log('Done');

// 개발자 모드 실행
// export NODE_ENV=development; node profilerTest.js

// 프로덕션 모드 실행
// export NODE_ENV=development; node profilerTest.js
```

<p>
    변수 p는 Profiler 객체의 인스턴스를 가지고 있지만, Profile 객체가 어떻게 생성되었는지 어떤 객체인지 실행 코드 만을 가지고 알 수가 없다. 위의 코드는 Profiler를 테스트하는 코드이다.
</p>

### 1-4 합성 가능한(Composable) 팩토리 함수

<p>
    합성 가능한 팩토리 함수는 향상된 팩토리 함수를 만들기 위해 함께 조합(composed)될 수 있는 특정 유형의 팩토리 함수를 말한다. 이는 복잡한 클래스 계층 구조를 만들지 않고도 다양한 소스에서 동작하면서 속성을 상속하는 객체를 만들 때 유용하다.
</p>

<p>
    이를 위한 예시로 비디오 게임을 만든다고 가정해본다. 캐릭터는 화면에서 움직일 수 있으며 칼로 베고 총을 쏠 수 있다. 또한 생명 포인트와 화면에서의 위치, 이름과 같은 몇몇 기본적인 속성을 가지고 있다. 특정 동작마다 하나씩 몇 가지 유형의 캐릭터를 정의할 것이며, 다음과 같다.
</p>

- Character: 생명 포인트와 위치 그리고 이름을 가지고 있는 기본 캐릭터
- Mover: 움직일 수 있는 캐릭터
- Slasher: 베기가 가능한 캐릭터
- Shooter: 총알이 있다면 사격을 할 수 있는 캐릭터

<p>
    이상적인 것은 기존 캐릭터와 다른 동작들을 결합하여 새로운 유형의 캐릭터를 정의하는 것이다. 예를 들어 아래와 같은 새로운 유형을 정의하는 것이다.
</p>

- Runner: 움직일 수 있는 캐릭터
- Samurai: 움직이며 칼로 벨수 있는 캐릭터
- Sniper: 움직이지 않고 총을 쏠 수 있는 캐릭터
- Gunslinger: 움직이면서 총을 쏠 수 있는 캐릭터
- Western Samurai: 움직이면서 칼로 베고 총을 쏠 수 있는 캐릭터

<p>
    모든 기본 유형의 기능을 결합할 수 잇는 자유로움이 필요하기 때문에 클래스와 상속을 사용하여 이 문제를 쉽게 모델링할 수 없다. 따라서 조합 가능한 팩토리 함수를 사용하여, 특히 stampit 모듈에서 정의한 stamp 스펙을 사용한다. 이 모듈은 새로운 팩토리 함수들을 만들기 위해 함께 구성할 수 있는 팩토리 함수들을 정의하기 위한 직관적인 인터페이스를 제공한다.
</p>

```javascript
const stampit = require('stampit');

const character = stampit().
    props({
        name: 'anoymous',
        lifePoints: 100,
        x: 0,
        y: 0
    });

const c = character();
c.name = 'John';
c.lifePoints = 10;
console.log(c); // { name: 'John', lifePoints: 10, x: 0, y: 0 }
```

<p>
    위의 코드는 기본 캐릭터의 새 인스턴스를 만드는데 사용할 수 있는 캐릭터 팩토리 함수이다. 모든 캐릭터는 props에서 정의된 속성 및 기본 값을 갖는다.
</p>

```javascript
// game.js
const stampit = require('stampit');

const haveName = stampit()
    .props({
        name: 'anonymous'
    })
;

const haveCoordinates = stampit()
    .props({
        x: 0,
        y: 0
    })
;

const character = stampit.compose(haveName, haveCoordinates)
    .props({
        lifePoints: 100
    })
;

const mover = stampit.compose(haveName, haveCoordinates)
    .methods({
        move(xIncr, yIncr) {
            this.x += xIncr;
            this.y += yIncr;
            console.log(`${this.name} moved to [${this.x}, ${this.y}]`);
        }
    })
;

const slasher = stampit.compose(haveName)
    .methods({
        slash(direction) {
            console.log(`${this.name} slashed to the ${direction}`);
        }
    })
;

const shooter = stampit()
    .props({
        bullets: 6
    })
    .methods({
        shoot(direction) {
            if (this.bullets > 0) {
                --this.bullets;
                console.log(`${this.name} shoot to the ${direction}`);
            }
        }
    })
;

const runner = stampit.compose(character, mover);
const samurai = stampit.compose(character, mover, slasher);
const sniper = stampit.compose(character, shooter);
const gunslinger = stampit.compose(character, mover, shooter);
const westernSamurai = stampit.compose(gunslinger, samurai);

const gojiro = westernSamurai();
gojiro.name = 'Gojiro Kiryu';
gojiro.move(1,0);
gojiro.slash('left');
gojiro.shoot('right');
```

<p>
    위의 코드는 앞선 코드를 기반으로 game.js를 구현한 것이다. 먼저 이름과 좌표를 정의하는 haveName과 haveCoordinates 팩토리를 정의한다. 그후 `compose()` 메소드를 이용하여 haveName과 haveCoordinates를 조합하여 character 팩토리를 정의한다. 이와 유사하게 나머지 mover, slasher, shooter를 정의한다. 기본적인 유형을 정의했다면 새로운 유형들은 `compose()` 메소드를 사용하여 쉽게 정의할 수 있다.
</p>

### 1-5 실전에서는 어떻게 사용되는가

- 새로운 인스턴스를 만드는데 있어 팩토리만을 제공하는 패키지
  - Dnode: Node.js용 원격 프로시저 호출(RPC) 시스템이다. 노출된 유일한 인터페이스가 팩토리이고, 이를 통해 클래스의 새 인스턴스를 생성할 수 있기 때문에 외부에 노출되지 않는다.
  - Restify: REST API를 만들기 위한 프레임워크이다. `restify.createServer()` 팩토리를 통해 새로운 서버 인스턴스를 만들 수 있다.
- 클래스와 팩토리를 모두 외부에 노출하고 있지만, 새로운 인스턴스 작성하는 방법으로 팩토리를 소개하는 모듈
  - http-proxy: 프로그래밍 가능한 프록싱 라이브러리로 `httpProxy.createProxyServer(options)`으로 새로운 인스턴스를 생성한다.
  - 코어 Node.js HTTP 서버: `http.createServer()`를 사용하여 새로운 인스턴스를 생성한다.
  - bunyan: 로깅 라이브러리로 `bunyan.createLogger()`를 사용하여 새로운 인스턴스를 생성한다.

<p>
    앞선 예시들 외에도 일부 다른 컴포넌트의 생성을 감싸는 팩토리를 제공하는 through2와 from2이나, 내부적으로 stamp 스펙과 조합 가능한 팩토리 기능을 사용하여 프론트엔드에서 사용되는 react-stampit, redis 기반의 pub/sub 모듈인 remitter가 있다.
</p>

## 2. 공개 생성자(Revealing constructor)

<p>
    공개 생성자 패턴은 Node.js와 자바스크립트에서 상대적으로 새로운 패턴이다. 이는 Promise와 같은 일부 핵심 라이브러리에서 사용된다.
</p>

```javascript
const promise = new Promise(function(resolve, reject) {
    // ...
});
```

<p>
    Promise는 생성자의 인자로 함수를 받아들인다. 이 함수를 executor 함수라고 한다. 이 함수는 Promise 생성자의 내부 구현에 의해 호출되고, 생성중인 프라미스의 내부 상태의 제한된 부분만 조작할 수 있게 하는데 사용한다. 다시 말해, 객체의 내부 상태를 변경할 수 있도록 resolve와 reject 함수를 외부에 노출하는 메커니즘을 제공한다. 이것의 장점은 생성자 코드만 resolve와 reject에 접근할 수 있고, 일단 프라미스 객체가 생성되면 주위에 안전하게 전달될 수 있다는 점이다.
</p>

### 2-1 읽기 전용 이벤트 이미터

<p>
    명시적인 생성자 패턴을 사용하여 읽기 전용 이벤트 이미터를 만들 것인데, 이 이미터는 emit 메소드를 호출할 수 없는 특별한 종류의 이미터이다.
</p>

```javascript
const EventEmitter = require('events');

module.exports = class Roee extends EventEmitter {
    constructor(executor) {
        super();
        const emit = this.emit.bind(this);
        this.emit = undefined;
        executor(emit);
    }
};
```

<p>
    위의 코드는 EventEmitter 클래스를 확장하여 executor 함수를 유일한 생성자의 인자로 받아들인다. 생성자 내부에서 super 생성자를 호출하여 부모 생성자를 호출해 이벤트 이미터를 적절히 초기화한 다음, emit 함수를 백업해 둔 후 undefined를 할당하여 제거한다. 마지막으로 emit 메소드 백업을 인자로 전달하여 executor 함수를 호출한다. 여기서 undefined가 emit 메소드에 할당된 후에는 코드의 다른 부분에서 더 이상 호출할 수 없다. 백업된 emit은 executor 함수에 전달될 로컬 변수로 정의된다. 이 메커니즘을 사용하면 executor 함수 내에서만 emit을 사용할 수 있다.
</p>

```javascript
const Roee = require('./roee');

const ticker = new Roee((emit) => {
    let tickCount = 0;
    setInterval(() => emit('tick', tickCount++), 1000);
});

module.exports = ticker;
```

<p>
    위의 코드는 매 초마다 틱을 발생시키고 발생시킨 모든 틱의 수를 유지한다. 만든 ticker 객체는 다른 이벤트 이미터 기반의 객체와 동일하게 사용하며 on 메소드로 여러 개의 리스너를 연결할 수 있지만, emit을 사용하려고 하면 TypeError가 발생하여 실행이 되지 않을 것이다.
</p>
