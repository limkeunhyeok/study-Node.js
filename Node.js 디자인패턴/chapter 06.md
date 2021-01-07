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

## 3. 프록시(Proxy)

<p>
    프록시란 다른 객체에 대한 접근을 제어하는 객체이다. 여기서 다른 객체를 대상(Subject)이라고 한다. 프록시와 대상은 동일한 인터페이스를 가지고 있으며 이를 통해 다른 인터페이스와 완전히 호환되도록 바꿀 수 있다. 실제 이 패턴의 다른 이름은 서로게이트(surrogate)이다 프록시는 대상에서 실행될 작업의 전부 또는 일부를 가로채서 해당 동작을 향상시키거나 보완한다.
</p>

![1](https://user-images.githubusercontent.com/38815618/103853877-6fa00d80-50f2-11eb-9cb8-47b2fa7d9efc.PNG)

<p>
    Proxy와 Subject가 동일한 인터페이스를 갖는 방식과 어떻게 클라이언트에게 투명하게 노출되어 둘 중 하나를 서로 교환하여 사용할 수 있는지 보여준다. 프록시는 각 작업을 대상으로 전달하여 추가적인 전처리 또는 후처리로 동작을 향상시킨다. 다음은 프록시가 유용한 상황이다.
</p>

- 데이터 유효성 검사(Data validation): 프록시가 입력을 대상으로 전달하기 전에 유효성을 검사한다.
- 보안(Security): 프록시는 클라이언트가 작업을 수행할 수 있는 권한이 있는지 확인하고 검사 결과가 긍정적인 경우에만 요청을 대상으로 전달한다.
- 캐싱(Caching): 프록시가 내부 캐시를 유지하여 데이터가 캐시에 아직 존재하지 않는 경우에만 대상에서 작업이 실행되도록 한다.
- 지연 초기화(Lazy initialization): 대상의 생성 비용이 비싸다면 프록시는 필요로 할 때까지 연기할 수 있다.
- 로깅(Logging): 프록시는 메소드 호출과 상대 매개 변수를 인터셉트하고 이를 기록한다.
- 원격 객체(Remote objects): 프록시는 원격 위치에 있는 객체를 가져와서 로컬처럼 보이게 할 수 있다.

### 3-1 프록시 구현 기술

<p>
    객체를 프록시할 때 모든 메소드를 가로채기로 결정할 수도 있고, 그 중 일부만 가로채고 나머지는 직접 대상에 위임하기로 결정할 수도 있다.
</p>

#### 오브젝트 컴포지션

<p>
    컴포지션은 기능을 확장하거나 사용하기 위해 객체가 다른 객체와 결합되는 기술이다. 특정 프록시 패턴의 경우, 대상과 동일한 인터페이스를 가진 새로운 객체가 작성되고 대상에 대한 참조가 인스턴스 변수 혹은 클로저 변수 형식으로 프록시의 내부에 저장된다. 대상은 작성 시 클라이언트로부터 주입되거나 프록시 자체에 의해 작성될 수 있다.
</p>

```javascript
// 의사(pseudo) 클래스와 팩토리를 사용한 기법
function createProxy(subject) {
    const proto = Object.getPrototypeOf(subject);

    function Proxy(subject) {
        this.subject = subject;
    }

    Proxy.prototype = Object.create(proto);

    // 프록시된 메소드
    Proxy.prototype.hello = function() {
        return this.subject.hello() + ' world!';
    };

    // 델리게이트된 메소드
    Proxy.prototype.goodbye = function() {
        return this.subject.goodbye
            .apply(this.subject, arguments);
    };

    return new Proxy(subject);
}
module.exports = createProxy;
```

<p>
    컴포지션을 사용해 프록시를 구현하려면, `hello()`와 같이 조작하고자 하는 메소드를 가로채고 나머지는 단순히 대상에 위임해야 한다. 위의 코드는 대상이 프로토타입을 가지고 있는 제대로 된 프로토타입 체인을 유지하기 위한 특정한 사례를 보여주므로 proxy instanceof Subject를 실행하면 true가 반환된다. 이를 위해 위 코드에선 의사고전(pseudo-classical) 상속을 사용했다.
</p>

<p>
    프록시 체인은 처음에 대상과 관련된 코드와의 호환성을 개선하는데 유용할 수 있다. 하지만 자바스크립트에는 동적 타입 결정이 있으므로 대부분의 경우 상속을 사용하지 않고 보다 즉각적인 접근 방식을 사용할 수 있다. 예를 들어, 앞선 코드에서 제시한 프록시의 대체 구현은 객체 리터럴과 팩토리를 사용하는 것이다.
</p>

```javascript
function createProxy(subject) {
    return {
        // 프록시된 메소드
        hello: () => (subject.hello() + ' world!'),

        // 델리게이트된 메소드
        goodbye: () => (subject.goodbye.apply(subject, arguments))
    };
}
```

#### 객체 증강(Object augmentation)

<p>
    객체 증강은 객체의 개별 메소드를 프록시하는 가장 실용적인 방법 중 하나로, 메소드를 프록시된 구현체로 대체하여 직접 대상을 수정하는 것으로 이루어진다.
</p>

```javascript
function createProxy(subject) {
    const helloOrig = subject.hello;
    subject.hello = () => (helloOrig.call(this) + ' world!');
    return subject;
}
```

<p>
    이 기법은 몇 개의 메소드만 프록시할 필요가 있을 때 가장 편리한 메소드지만, 대상 객체를 직접 수정하는 단점이 있다.
</p>

### 3-2 다른 기술의 비교

<p>
    컴포지션은 대상을 그대로 두어 원래의 동작을 변경하지 않기 때문에 프록시를 만드는 안전한 방법이다. 유일한 단점은 모든 메소드를 수동으로 위임(delegate)해야 한다는 것이다. 필요한 경우 대상의 속성에 대한 액세스 권한을 위임해야 할 수도 있다.
</p>

<p>
    반면 객체 증강은 대상을 수정하므로 위임과 관련된 작업을 하지 않기 때문에, 객체 증강은 자바스크립트에서 프록시를 구현하는 가장 실용적인 방법이며, 대상을 수정하는 것이 문제가 되지 않는 상황에서 선호되는 기술이다. 하지만 대상을 필요한 경우에만 생성(지연 초기화, lazy initialization)하기 위해 대상의 초기화를 제어하려는 경우에는 컴포지션이 필요하다.
</p>

### 3-3 Writable 스트림 로그 작성

<p>
    다음은 `write()` 메소드에 대한 모든 호출을 가로채고 이러한 상황이 발생할 때마다 메시지를 기록하는 Writable 스트림에 대한 프록시를 수행하는 객체를 만든다. 프록시를 구현하기 위해 객체 컴포지션을 사용한다.
</p>

```javascript
function createLoggingWritable(writableOrig) {
    const proto = Object.getPrototypeOf(writableOrig);

    function LoggingWritable(writableOrig) {
        this.writableOrig = writableOrig;
    }

    LoggingWritable.prototype = Object.create(proto);

    LoggingWritable.prototype.write = function(chunk, encoding, callback) {
        if (!callback && typeof encoding === 'function') {
            callback = encoding;
            encoding = undefined;
        }
        console.log('Writing ', chunk);
        return this.writableOrig.write(chunk, encoding, function() {
            console.log('Finished writing ', chunk);
            callback && callback();
        });
    };

    LoggingWritable.prototype.on = function() {
        return this.writableOrig.on
            .apply(this.writableOrig, arguments);
    };

    LoggingWritable.prototype.end = function() {
        return this.writableOrig.end
            .apply(this.writableOrig, arguments);
    };

    return new LoggingWritable(writableOrig);
}
```

<p>
    위의 코드는 인자로 전달된 Writable 객체가 프록시된 버전을 반환하는 팩토리이다. 호출할 때마다 그리고 비동기 연산이 완료될 때마다 표준 출력에 메시지를 기록하도록 `write()` 메소드를 오버라이드 한다. 이는 비동기 함수의 프록시를 만드는 좋은 예시이기도 하며, Node.js같은 플랫폼에서 고려해야 할 중요한 세부 사항이다. 나머지 메소드인 `on()`과 `end()`는 원래의 writeable 스트림에 위임된다.
</p>

```javascript
// 테스트 코드
const fs = require('fs');
const createLoggingWritable = require('./study');

const writable = fs.createWriteStream('test.txt');
const writableProxy = createLoggingWritable(writable);
writableProxy.write('First chunk');
writableProxy.write('Second chunk');
writable.write('This is not logged');
writableProxy.end();
```

### 3-4 생태계에서의 프록시 - 함수 후크(function hooks) 및 AOP

<p>
    대부분의 경우 프록시를 객체 증강을 사용하여 구현한다. 이 패턴을 함수 후킹이라고도 하며, 때로는 프록시 어플리케이션의 공통 영역인 AOP(Aspect Oriented Programming)라고도 한다. AOP에서 이러한 라이브러리는 대개 개발자가 특정 메소드 전후에 실행 후크를 설정할 수 있도록 한다. 이는 권고된 메소드를 실행하기 전 혹은 후에 커스텀 코드를 실행할 수 있게끔 해준다.
</p>

<p>
    종종 프록시를 미들웨어라고 한다. 미들웨어 패턴처럼 어떤 함수의 입력/출력 전처리와 후처리를 할 수 있기 때문이다. 때로는 미들웨어와 유사한 파이프라인을 사용하여 동일한 메소드에 대해 여러 후크를 등록할 수도 있다.
</p>

### 3-5 ES2015 Proxy

<p>
    ES2015 사양에는 Proxy라는 전역 객체가 도입되었으며, 이 객체는 Node.js 버전 6부터 사용할 수 있다. Proxy API에는 타겟 및 핸들러를 인자로 허용하는 Proxy 생성자가 포함되어 있다.
</p>

```javascript
const proxy = new Proxy(target, handler);
```

<p>
    여기서 타겟은 프록시가 적용되는 객체를 나타내며, handler는 프록시의 동작을 정의하는 특수한 객체이다. 핸들러 객체에는 해당 작업이 프록시 인스턴스에서 수행될 때 자동으로 호출되는 트랩 메소드(예: apply, get, set, has)라는 사전에 정의된 이름을 가진 일련의 선택적 메소드를이 포함되어 있다.
</p>

```javascript
const scientist = {
    name: 'nikola',
    surname: 'tesla'
};

const uppercaseScientist = new Proxy(scientist, {
    get: (target, property) => target[property].toUpperCase()
});

console.log(uppercaseScientist.name, uppercaseScientist.surname); // NIKOLA TESLA
```

<p>
    위의 코드는 프록시 API를 사용하여 target 객체인 scientist의 모든 속성에 대한 액세스를 가로채서 원래의 속성값을 대문자로 변환한다. target 객체 내의 일반 속성에 대한 접근을 가로채는 것을 볼 수 있는데, API가 프록시 객체의 생성을 용이하게 하는 단순한 래퍼가 아니기 때문에 가능한 것이다. 대신 자바스크립트 언어 자체에 통합된 기능으로, 개발자가 객체에서 수행할 수 있는 많은 작업을 가로채서 사용자 정의화할 수 있다. 이를 이용하면 메타 프로그래밍, 연산자 오버로딩 및 객체 가상화 같은 여러 시나리오들이 가능해진다.
</p>

```javascript
const evenNumber = new Proxy([], {
    get: (target, index) => index * 2,
    has: (target, number) => number % 2 === 0
});

console.log(2 in evenNumber); // true
console.log(5 in evenNumber); // false
console.log(evenNumber[7]); // 14
```

- get 트랩: 배열 요소에 대한 접근을 가로채 주어진 인덱스에 해당하는 짝수를 반환
- has 트랩: in 연산자의 사용을 가로채 주어진 숫자가 짝수인지 여부를 검사

<p>
    Proxy API는 set, delete, construct와 같은 여러 트랩을 지원하며 언제든지 폐기될 수 있는 프록시를 생성하여 모든 트랩을 비활성화함으로써 target 객체의 원래 동작을 복원할 수 있도록 해준다.
</p>

### 3-6 실전에서 어떻게 사용되는가

<p>
    Mongoose는 MongoDB에서 널리 사용되는 ODM 라이브러리이다. 내부적으로는 hooks 패키지를 사용하여 Document 객체의 init, validate, save, remove 메소드에 대한 실행 전후 실행 후크를 제공한다.
</p>

## 4. 데코레이터(Decorator)

<p>
    데코레이터는 기존 객체의 동작을 동적으로 증강시키는 구조적 패턴이다. 이 동작은 동일한 클래스의 모든 객체에 추가되지 않고 명시적으로 데코레이트한 인스턴스에만 추가되기 때문에 고전적인 상속과는 다르다.
</p>

![2](https://user-images.githubusercontent.com/38815618/103913115-8a52a080-514b-11eb-866a-08a0243bf278.PNG)

<p>
    구현 방식은 프록시 패턴과 매우 유사하지만, 객체의 기존 인터페이스 동작을 향상하거나 수정하는 대신 새로운 기능으로 기능을 증가시킨다. 위 그림에서 Decorator 객체는 methodC 기능을 추가하여 대상 객체를 확장한다.  기존의 메소드들은 추가적인 처리 없이 데코레이팅된 객체에 위임된다. 기존의 메소드들은 추가적인 처리 없이 데코레이팅된 객체에 위임된다. 필요한 경우 기존 메소드에 대한 호출을 가로채고 조작할 수 있도록 프록시 패턴을 쉽게 결합할 수 있다.
</p>

### 4-1 데코레이터 구현 기법

#### 컴포지션

<p>
    컴포지션을 사용하면 데코레이팅된 컴포넌트가 일반적으로 상속받은 새 객체로 둘러싸여 배치된다. 이 경우 데코레이터는 기존 메소드를 원래 컴포넌트로 위임하면서 새 메소드를 정의하면 된다.
</p>

```javascript
function decorate(component) {
    const proto = Object.getPrototypeOf(component);

    function Decorator(component) {
        this.component = component;
    }
    Decorator.prototype = Object.create(proto);

    // 새 메소드
    Decorator.prototype.greetings = function() {
        return 'Hi!';
    };

    // 위임된 메소드
    Decorator.prototype.hello = function() {
        return this.component.hello.apply(this.component, arguments);
    };

    return new Decorator(component);
}
```

#### 객체 증강

<p>
    아래의 코드처럼 데코레이팅된 객체에 직접 새 메소드를 연결하여 객체 데코레이션을 수행할 수도 있다.
</p>

```javascript
function decorate(component) {
    // 새 메소드
    component.greetings = () => {
        // ...
    }

    return component;
}
```

### 4-2 LevelUP 데이터베이스 장식하기

#### LevelUP 및 LevelDB 소개

<p>
    LevelUP이란 원래 Chrome 브라우저에서 IndexedDB를 구현하기 위해 만들어진 키/값 저장소인 Google LevelDB와 관련한 Node.js 래퍼이다. LevelDB는 Dominic Tar에 의한 최소한의 확장으로 '데이터베이스계의 Node.js'로 정의되었다. 또한, 매우 빠른 성능과 가장 기본적인 기능 세트만을 제공하므로 개발자들은 모든 종류의 데이터베이스를 그 위에 구축할 수 있다.
</p>

<p>
    Node.js는 LevelDB의 래퍼가 탄생한 후 인메모리 저장소에서 Riak, Redis와 같은 NoSQL 데이터베이스 그리고 IndexedDB, LocalStorage 같은 웹 저장소 엔진에 이르기까지 여러 가지 백엔드를 지원하였고, 서버와 클라이언트가 동일한 API를 사용할 수 있게 되었다.
</p>

<p>
    오늘날 LevelUP에는 복제, 보조색인, 실시간 업데이트, 쿼리엔진 등과 같은 기능을 구현하기 위해 작은 코어를 확장한 플러그인 및 모듈들로 구성된 완벽한 생태계가 구축되었다. 또한 ProuchDB와 CouchUP 같은 CouchDB 클론을 비롯하여 Levelgraph와 같은 그래프 데이터베이스까지 Node.js와 브라우저에서 동시에 동작하는 완전한 데이터베이스들이 LevelUP 위에서 구축되었다.
</p>

#### LevelUP 플러그인 구현하기

<p>
    아래의 코드는 데코레이터 패턴을 사용하여 LevelUP을 위한 간단한 플러그인을 생성하는 방법과 오브젝트 증강 기법이다. 가장 단순하지만 추가적인 기능으로 객체를 데코레이트 하는 가장 실용적이고 효과적인 방법이다. 로직은 특정 패턴으로 객체가 데이터베이스에 저장될 때마다 알림을 받을 수 있는 LevelUP용 플러그인이다.
</p>

```javascript
module.exports = function levelSubscribe(db) {
    db.subscribe = (pattern, listener) => { // 1.
        db.on('put', (key, val) => { // 2.
            const match = Object.keys(pattern).every(
                k => (pattern[k] === val[k]) // 3.
            );
        
            if(match) {
                listener(key, val); // 4.
            }
        });
    };
    return db;
};
```

1. `subscribe()`라는 새로운 메소드로 db 객체를 데코레이트 하였다. 간단하게 제공된 db 인스턴스에 이 메소드를 추가하였다(객체 증강).
2. 데이터베이스에서 수행되는 모든 put 연산을 청취(listen)한다.
3. 매우 간단한 패턴 매칭 알고리즘을 수행했는데, 이를 통해 제공된 패턴의 모든 속성을 삽입된 데이터에서도 검사할 수 있다.
4. 일치하는 항목이 있으면 리스너에 통보한다.

```javascript
onst level = require('level'); // 1.
const levelSubscribe = require('./levelSubscribe'); // 2.

let db = level(__dirname + '/db', {valueEncoding: 'json'});

db = levelSubscribe(db);
db.subscribe(
    {doctype: 'tweet', language: 'en'}, // 3.
    (k, val) => console.log(val)
);

db.put('1', {doctype: 'tweet', text: 'Hi', language: 'en'}); // 4.
db.put('2', {doctype: 'company', name: 'ACME Co.'});
```

1. 먼저 LevelUP 데이터베이스를 초기화하고 파일이 저장될 디렉토리와 값의 기본 인코딩을 선택한다.
2. 그후, 원래 db 객체를 데코레이트하는 플러그인을 추가한다.
3. 플러그인에서 제공하는 새로운 기능인 `subscribe()` 메소드를 사용할 준비가 되었다. 여기서 `{doctype: 'tweet', language: 'en'}`을 가진 모든 객체를 리슨한다고 정의한다.
4. 마지막으로 put을 사용하여 데이터베이스에 일부 값을 저장한다. 첫 번째 호출은 구독과 관련된 콜백을 호출하여 저장된 객체를 콘솔에 출력할 것이다. 이것은 객체가 구독하는 객체와 일치하기 때문이다. 대신 두 번째 호출에서는 저장된 객체가 구독 기준과 일치하지 않으므로 저장 객체가 콘솔에 출력되지 않는다.
