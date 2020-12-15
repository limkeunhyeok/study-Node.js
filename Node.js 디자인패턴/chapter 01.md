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
