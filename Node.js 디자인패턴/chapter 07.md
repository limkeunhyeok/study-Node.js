# Chapter 07 - 모듈 연결

## 1. 모듈과 의존성

<p>
    모든 어플리케이션은 여러 컴포넌트들을 결합한 결과이며, 어플리케이션이 커짐에 따라 이러한 컴포넌트를 연결하는 방식이 중요하다. 컴포넌트들이 너무 밀접하게 연결되어 있는 경우, 리팩토링이나 어플리케이션 전체 부분을 완전히 다시 작성하지 않고는 기능을 추가하거나 변경할 수 없게 된다.
</p>

### 1-1 Node.js의 가장 일반적인 종속성

<p>
    소프트웨어 아키텍처에서는 컴포넌트의 동작이나 구조에 영향을 미치는 엔티티, 상태 또는 데이터 형식을 종속성으로 간주할 수 있다. 종속성의 개념은 매우 광범위하며 때로는 평가하기가 어렵다. 하지만 Node.js에서는 일반적이며 쉽게 식별할 수 있는 필수 유형의 종속성을 바로 식별해낼 수 있다. 모듈은 코드를 구성하고 구조화하는데 필요한 기본적인 메커니즘이다. 실제 모듈의 속성은 다음과 같이 요약할 수 있다.
</p>

- 모듈은 (이성적으로는)보다 집중적이기 때문에 더 가독성이 높고 이해하기 쉽다.
- 별도의 파일로 표현되기 때문에 쉽게 식별할 수 있다.
- 모듈은 다른 어플리케이션보다 쉽게 재사용할 수 있다.

<p>
    모듈은 정보 은닉을 수행하는 완벽한 수준의 세분화된 단위를 나타내며 컴포넌트의 공개 인터페이스 만을 노출하는 효과적인 메커니즘을 제공한다.
</p>

<p>
    단순히 어플리케이션이나 라이브러리의 기능을 여러 모듈에 분산시키는 것만으로는 성공적인 디자인이라 할 수 없다. 잘못된 사용 중 한 가지는 모듈 간의 관계가 매우 강해서 독특한 모놀리식 개체를 만들어 내는 것이며, 그 상태에서 모듈을 제거하거나 교체하는 것이 아키텍처의 대부분을 뒤흔들게 되는 것이다.
</p>

### 1-2 응집력과 결합력

- 응집력(Cohesion)
  - 컴포넌트 기능 간의 상관 관계에 대한 측도
  - 단 한가지의 작업만 하는 모듈은, 모듈의 모든 부분이 그 하나의 단일 업무에서만 역활을 할 경우 높은 응집력을 가짐
  - 모든 유형의 객체를 데이터베이스에 저장하는 함수를 가진 모듈은 낮은 응집력을 가짐
- 결합력(Coupling)
  - 구성 요소가 시스템의 다른 구성 요소에 얼마나 의존하는지에 대한 측도
  - 모듈이 다른 모듈의 데이터를 직접 읽거나 수정한다면 다른 모듈과 밀접하게 연결
  - 전역이나 공유된 상태를 통해 상호작용하는 모듈들은 밀접한 결합(tightly coupled)
  - 매개 변수 전달을 통해서만 두 모듈이 통신한다면 느슨한 결합(loosely coupled)

<p>
    바람직한 시나이로는 높은 응집도와 느슨한 결합을 갖는 것이고, 이는 일반적으로 이해하기 쉽고 재사용 가능하며 확장 가능한 모듈을 만든다.
</p>

### 1-3 상태 저장(Stateful) 모듈

<p>
    자바스크립트에서는 모든 것이 하나의 객체이다. 인터페이스나 클래스와 같은 추상적인 개념이 없다. 동적 타이핑은 이미 인터페이스를 구현에서 분리하는 자연스러운 메커니즘을 제공한다.
</p>

#### Node.js의 싱글톤 패턴

<p>
    Node.js에서 단순히 `module.exports`를 사용하여 인스턴스를 내보내는 것만으로 싱글톤 패턴과 비슷한 것을 얻을 수 있다.
</p>

```javascript
// db.js
module.exports = new Database('my-app-db');
```

<p>
    단순히 데이터베이스의 새로운 인스턴스를 내보내는 것만으로도 현재 패키지 내에서 이미 db 모듈의 인스턴스가 하나만 있다고 가정할 수 있다. Node.js는 `require()`의 첫 번째 호출 이후에 모듈을 캐시할 것이고, 이후의 호출에서 다시 실행하지 않고 캐시된 인스턴스를 반환하기 때문에 가능하다.
</p>

<p>
    하지만 모듈은 전체 경로를 검색 키로 사용하여 캐시되므로 현재 패키지 내에서만 싱글톤이 보장된다. 각 패키지가 자신의 node_modules 디렉토리 내에 일련의 자신만의 종속성들을 가질 수 있으며, 이는 동일한 패키지의 다중 인스턴스를 초래할 수 있다. 결국 동일한 모듈의 서로 다른 인스턴스가 될 수도 있으며, 그 결과 더 이상 싱글톤이 아닐 수도 있게 된다.
</p>

```json
// package.json
{
    "name": "mydb",
    "main": "db.js"
}

// 종속성 트리
app/
    node_modules
        packageA
            node_modules
                mydb
        packageB
            node_modules
                mydb
```

<p>
    위에서 pacakgeA와 packageB는 모두 mydb 패키지에 종속성을 가지고 있다. 다음으로 메인 어플리케이션인 app 패키지는 pacakgeA와 packageB에 종속성을 가진다. 이 후에 `require('mydb')`를 호출하면, 필요로 하는 패키지에 따라 다른 디렉토리로 해석되기 때문에 pacakgeA와 packageB는 실제로 싱글톤처럼 보이는 두 개의 서로 다른 인스턴스를 로드한다. 이 시점에서 전역 변수를 사용하여 저장하지 않는 한, 싱글톤 패턴은 Node.js에 존재하지 않는다.
</p>

<p>
    이러한 상황은 피해야 하며, 대부분의 경우 싱글톤 패턴이 필요하지 않다. 또한 인스턴스를 공유하기 위한 다른 패턴이 있다.
</p>

## 2. 모듈 연결 패턴

### 2-1 하드코드된 종속성

#### 하드코드된 종속성을 사용한 인증 서버 구축

![1](https://user-images.githubusercontent.com/38815618/104470134-b6af6680-55fc-11eb-8d71-0daf95021f57.PNG)

<p>
    위의 그림은 간단한 인증 시스템의 구조를 표현한다. AuthController는 클라이언트로부터 입력을 받아, 요청으로부터 로그인 정보를 추출하고 예비 검증을 수행한다. 그 후에 AuthService를 사용하여 제공된 자격 증명이 데이터베이스에 저장된 정보와 일치하는지 확인한다. 이는 데이터베이스와 통신하는 수단으로 db 모듈을 사용하여 특정 쿼리를 실행함으로써 수행된다. 이 세 가지 컴포넌트가 함께 연결되는 방식은 재사용성, 테스트 편리성 및 유지관리 가능성 수준을 결정한다.
</p>

<p>
    이러한 구성 요소를 연결하는 가장 자연스러운 방법은 AuthService에서 db 모듈을 요구한 다음, AuthController에서 AuthService를 요구하는 것이다. 이것이 하드코딩된 종속성이다. 이를 토대로 인증 서버를 설계할 때, 다음 두 HTTP API를 제공한다.
</p>

- POST '/login': 인증할 사용자의 이름과 암호 쌍을 포함하는 JSON 객체를 받는다. 성공하면 후속 요청에서 사용자의 신원을 확인하는데 사용할 수 있는 JSON 웹 토큰(JWT)을 반환한다.
- GET '/checkToken': GET 쿼리의 매개 변수에서 토큰을 읽고 유효성을 확인한다.

##### db 모듈

```javascript
// lib/db.js
const level = require('level');
const sublevel = require('level-sublevel');

module.exports = sublevel(
    level('example-db', {valueEncoding: 'json'})
);
```

<p>
    위의 코드는 ./example-db 디렉토리에 저장된 LevelDB 데이터베이스에 대한 연결을 생성한 다음, sublevel 플러그인을 사용하여 인스턴스를 데코레이트한다. 이는 데이터베이스에 개별 섹션을 만들고 질의(query)할 수 있도록 돕는다. 모듈에서 내보내는 객체는 데이터베이스 핸들 자체이며, 상태 저장(stateful) 인스턴스이다. 따라서 단일 객체를 생성한다.
</p>

##### authService 모듈

```javascript
// lib/authService.js

// ...
const db = require('./db');
const users = db.sublevel('users');

const tokenSecret = 'SHHH!';

exports.login = (username, password, callback) => {
    users.get(username, function(err, user) {
        // ...
    });
};

exports.checkToken = (token, callback) => {
    // ...
    users.get(userData.username, function(err, user) {
        // ...
    });
};
```

<p>
    위의 코드는 데이터베이스의 정보로 사용자 이름/비밀번호 쌍을 검사하는 `login()` 서비스와 토큰을 가져와서 유효성을 확인하는 `checkToken()` 서비스이다. db 모듈을 require하는 부분은 모듈의 종속성을 하드코드한 것이며, db 변수에는 쿼리를 수행하는데 즉시 사용할 수 있는 미리 초기화된 데이터베이스 핸들이 들어 있다. 여기서 모듈 내 작성된 코드는 모두 직접적으로 db 모듈의 인스턴스를 다루지 않는다. 특정 db 인스턴스에 대한 종속성을 하드코딩했기 때문에 코드를 건드리지 않고는 authService를 다른 데이터베이스 인스턴승와 함께 재사용할 수 없다.
</p>

##### authController 모듈

```javascript
// lib/authController.js
const authService = require('./authService');

exports.login = (req, res, next) => {
    authService.login(req.body.username, req.body.password,
        (err, result) => {
            // ...
        }
    );
};

exports.checkToken = (req, res, next) => {
    authService.checkToken(req.query.token,
        (err, result) => {
            // ...
        }
    );
};
```

<p>
    위의 모듈은 두 개의 Express 라우트를 구현한 모듈인데, 하나는 로그인을 수행하여 해당 인증 토큰을 반환하고, 다른 하나는 토큰에 대한 유효성을 검사한다. 두 라우트 모두 로직의 대부분을 authService에 위임하므로, HTTP 요청 및 응답을 처리하는 것이 유일한 작업이다. 여기서도 authService에 대한 종속성을 하드코딩하고 있다. authService 모듈은 db 모듈에 직접 의존하기 때문에 포함 관계로 인한 이행성(transitivity)으로 상태 유지 모듈이 된다. authController는 authService 모듈에 종속되며 authService는 db 모듈에 의존한다. 이행성은 authController 모듈 자체가 특정 db 인스턴스에 간접적으로 연결됨을 의미한다.
</p>

##### 앱 모듈

```javascript
// app.js
const express = require('express');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const http = require('http');

const authController = require('./lib/authController');

const app = module.exports = express();
app.use(bodyParser.json());

app.post('/login', authController.login);
app.get('/checkToken', authController.checkToken);
app.use(errorHandler());

http.createServer(app).listen(3000, () => {
    console.log('Express server started');
});
```

#### 하드코딩된 종속성의 장단점

- 장점
  - 직관적인 구성으로 이해하기 쉽다.
  - 디버깅하기 쉽다.
  - 각 모듈은 외부에서 개입하지 않아도 초기화되고 연결된다.
- 단점
  - 모듈을 다른 인스턴스에 연결하는 가능성이 제한되어 재사용성이 낮아지며 단위 테스트가 어려워진다.
  - 대부분 상태 유지 인스턴스와 관련되어 있음을 이해하는 것이 중요하다.

### 2-2 의존성 주입(DI, Dependency Injection)

<p>
    DI 패턴의 주요 아이디어는 컴포넌트의 종속성들을 외부 개체에 의해 입력으로 제공하는 것이다. 이러한 개체는 시스템의 모든 모듈의 연결을 중앙 집중화하는 클라이언트 컴포넌트 또는 전역 컨테이너일 수도 있다. 이 접근법의 가장 큰 장점은 특히 상태 저장 인스턴스 모듈에 대해 디커플링이 향상된다는 것이다. DI를 사용하여 각 종속성은 모듈에 하드코딩되지 않고 외부에서 수신된다. 즉 모듈이 어떤 종속성이든 사용하도록 설정할 수 있으므로 다른 컨텍스트에서 재사용할 수 있다.
</p>

#### DI를 사용한 인증 서버 리팩토링

```javascript
// lib/db.js
const level = require('level');
const sublevel = require('level-sublevel');

module.exports = dbName => {
    return sublevel(
        level(dbName, {valueEncoding: 'json'})
    );
}
```

<p>
    위의 코드는 db 모듈을 팩토리로 변경하여, 원하는 만큼의 데이터베이스 인스턴스를 생성할 수 있다. 이는 전체 모듈이 재사용 가능하며 상태 비저장(stateless)임을 의미한다.
</p>

```javascript
// lib/authService.js

const jwt = require('jwt-simple');
const bcrypt = require('bcrypt');

module.exports = (db, tokenSecret) => {
    const users = db.sublevel('users');
    const authService = {};

    authService.login = (username, password, callback) => {
        // 이전 버전과 동일
    };

    authService.checkToken = (token, callback) => {
        // 이전 버전과 동일
    };

    return authService;
};
```

<p>
    위의 코드는 authService 모듈은 이제 상태 비저장이 된다. 특정 인스턴스를 익스포트하는 것이 아니라 단순한 팩토리를 익스포트한다. 이전에 하드코딩된 db 종속성을 제거하고 팩토리 함수의 인수로 주입할 수 있다.
</p>

```javascript
// lib/authController.js
module.exports = (authService) => {
    const authController = {};

    authController.login = (req, res, next) => {
        // 이전 버전과 동일
    };

    authController.checkToken = (req, res, next) => {
        // 이전 버전과 동일
    };

    return authController
}
```

<p>
    authController 모듈에는 하드코딩된 의존성이 전혀 없으며, 상태 비저장도 없다. 유일한 의존성인 authService 모듈은 호출하는 순간 팩토리에 입력으로 제공된다.
</p>

```javascript
// app.js

// ...
const dbFactory = require('./lib/db'); // 1.
const authServiceFactory = require('./lib/authService');
const authControllerFactory = require('./lib/authController');

const db = dbFactory('example-db'); // 2.
const authService = authServiceFactory(db, 'SHHH!');
const authController = authControllerFactory(authService);

app.post('/login', authController.login); // 3.
app.get('/checkToken', authController.checkToken);

// ...
```

1. 서비스의 팩토리들을 로드한다. 이 시점에서 팩토리는 여전히 상태 비저장 객체이다.
2. 필요한 종속성들을 제공하여 각 서비스를 인스턴스화한다. 이는 모든 모듈들이 만들어지고 연결되는 단계이다.
3. authController 모듈의 라우트들을 일반적인 방식으로 Express 서버에 등록한다.

#### 다양한 유형의 DI

- 생성자 인젝션: 의존성이 생성 순간에 생성자에게 전달
- 속성 인젝션: 종속성이 생성된 객체에 첨부

<p>
    속성 인젝션은 객체가 종속성과 연결되지 않기 때문에, 객체가 일관성 없는 상태로 생성된다는 것을 의미하므로 덜 강력하지만, 종속성 간의 순환이 있을 대는 유용할 수 있다.
</p>

#### DI 찬반론

<p>
    앞선 DI를 사용한 인증 서버 예제에서 모듈을 특정 종속성 인스턴스로부터 분리하였다. 이에 최소한의 노력으로 코드를 변경하지 않고 각 모듈을 재사용할 수 있게 되었다. DI 패턴을 사용한 모듈을 테스트하는 작업 또한 매우 간단하다. 간단하게 모형(Mock up)으로 의존성을 제공하여 모듈을 시스템의 나머지 상태와 분리하여 테스트할 수 있다. 또 다른 중요한 점은 의존 관계를 연결하는 책임을 아키텍처의 맨 아래에서 맨 위로 옮겼다. 이는 상위 수준의 컴포넌트가 하위 수준의 컴포넌트보다 재사용성이 낮으며 어플리케이션의 계층이 올라갈수록 컴포넌트가 더 많이 구체화된다는 것에 기반한다.
</p>

<p>
    디커플링 및 재사용성 측면에서 이러한 모든 장점은 비용을 지불해야 한다. 일반적으로 코딩을 할 때 의존성을 해결할 수 없으면 시스템의 다양한 컴포넌트들 간의 관계를 이해하기가 더욱 어려워진다. 또한 앱 모듈의 모든 종속성을 인스턴스화하는 방식을 살펴보면 특정 순서를 따라야 한다. 이는 연결해야 할 모듈 수가 많아질 때 관리하기 어려워질 수 있다.
</p>

### 2-3 서비스 로케이터(Service locator)

<p>
    서비스 로케이터의 핵심 원칙은 시스템의 컴포넌트를 관리하고 모듈이 종속성을 로드해야 할 때마다 중재자 역활을 수행할 수 있도록 중앙의 레지스트리를 갖는 것이다. 방식은 하드코딩을 대신해서 서비스 로케이터에게 종속성을 요청하는 것이다. Node.js에서는 시스템의 컴포넌트들에 연결되는 방식에 따라 세 가지 유형의 서비스 로케이터로 구분할 수 있다.
</p>

- 종속성이 하드코딩된 서비스 로케이터
  - 디커플링 측면에서 가장 적은 장점을 가진 것으로, `require()`를 사용하여 서비스 로케이터의 인스턴스를 직접 참조하는 것으로 구성된다.
  - 디커플링을 제공하기 위해 의도된 특정 컴포넌트와 밀접한 결합을 유도하기 때문에 안티패턴으로 간주된다.
    - 이 경우에 서비스 로케이터는 재사용성 측면에서 어떤 가치도 제공하지 않고 오히려 부정적인 영향과 복잡성만이 추가된다.
- 주입식(injected) 서비스 로케이터
  - DI를 통해 컴포넌트에서 참조된다.
  - 전체 종속성 세트를 하나씩 제공하는 대신 전체 종속성 세트를 한 번에 주입하는 보다 편리한 방법이다.
- 글로벌 서비스 로케이터
  - 전역 범위에서 직접 가져온다.
  - 하드코딩된 서비스 로케이터의 단점과 동일한 단점이 있지만, 전역적이고 실제 싱글톤이므로 패키지 간에 인스턴스를 공유하기 위한 패턴으로 쉽게 사용할 수 있다.

#### 서비스 로케이터를 사용한 인증 서버 리팩토링

```javascript
// lib/serviceLocator.js

module.exports = function() {
    const dependencies = {};
    const factories = {};
    const serviceLocator = {};

    serviceLocator.factory = (name, factory) => { // 1.
        factories[name] = factory;
    };

    serviceLocator.register = (name, instance) => { // 2.
        dependencies[name] = instance;
    };

    serviceLocator.get = (name) => { // 3.
        if (!dependencies[name]) {
            const factory = factories[name];
            dependencies[name] = factory && factory(serviceLocator);
            if (!dependencies[name]) {
                throw new Error('Cannot find module: ' + name);
            }
        }
        return dependencies[name];
    };

    return serviceLocator;
};
```

1. `factory()`는 컴포넌트의 이름을 해당 팩토리와 연결시키기 위해 사용된다.
2. `register()`는 컴포넌트의 이름을 인스턴스와 직접 연관시키는데 사용된다.
3. `get()`은 이름으로 컴포넌트를 검색한다. 인스턴스가 사용 가능하다면 인스턴스를 반환하고, 그렇지 않으면 등록된 팩토리를 호출하여 새 인스턴스를 얻으려고 시도한다. 모듈 팩토리들에 서비스 로케이터의 현재 인스턴스를 주입항여 호출하는 것이 시스템의 의존성 그래프를 자동으로 그리고, 필요 시에 만들 수 있게 해주는 이 패턴의 핵심 메커니즘이다.

```javascript
// lib/db.js
const level = require('level');
const sublevel = require('level-sublevel');

module.exports = (serviceLocator) => {
    const dbName = serviceLocator.get('dbName');

    return sublevel(
        level(dbName, {valueEncoding: 'json'})
    );
}
```

<p>
    위의 db 모듈은 입력으로 전달된 서비스 로케이터를 사용하여 인스턴스화 할 데이터베이스의 이름을 검색한다. 서비스 로케이터는 컴포넌트의 인스턴스를 반환하는 데 사용할 수 있을 뿐만 아니라, 생성하려는 전체 종속성 그래프의 동작을 정의하는 환경 변수를 제공하는데도 사용할 수 있다.
</p>

```javascript
// lib/authService.js

// ...
module.exports = (serviceLocator) => {
    const db = serviceLocator.get('db');
    const tokenSecret = serviceLocator.get('tokenSecret');

    const users = db.sublevel('users');
    const authService = {};

    authService.login = (username, password, callback) => {
        // 이전 버전과 동일
    };

    authService.checkToken = (token, callback) => {
        // 이전 버전과 동일
    };

    return authService;
};
```

<p>
    위의 authService 모듈도 서비스 로케이터를 입력으로 사용하는 팩토리이다. 모듈의 두 가지 종속성인 db 핸들러와 tokenSecret은 서비스 로케이터의 `get()` 메서드를 통해 조회된다.
</p>

```javascript
// lib/authController.js
module.exports = (serviceLocator) => {
    const authService = serviceLocator.get('authService');
    const authController = {};

    authController.login = (req, res, next) => {
        // 이전 버전과 동일
    };

    authController.checkToken = (req, res, next) => {
        // 이전 버전과 동일
    };

    return authController
}
```

<p>
    앞선 모듈들과 유사하게 authController 모듈을 수정한다.
</p>

```javascript
// app.js

// ...
const svcLoc = require('./lib/serviceLocator')(); // 1.

svcLoc.register('dbName', 'example-db'); // 2.
svcLoc.register('tokenSecret', 'SHHH!');
svcLoc.factory('db', require('./lib/db'));
svcLoc.factory('authService', require('./lib/authService'));
svcLoc.factory('authController', require('./lib/authController'));

const authController = svcLoc('authController'); // 3.
app.post('/login', authController.login);
app.get('/checkToken', authController.checkToken);

// ...
```

1. 팩토리를 호출하여 새로운 서비스 로케이터를 인스턴스화한다.
2. 서비스 로케이터에 대해 환경 변수 및 모듈 팩토리를 등록한다. 이 시점에서 모든 종속성은 아직 인스턴스화되지 않으며, 단지 팩토리를 등록한 것 뿐이다.
3. 서비스 로케이터에서 authController를 로드한다. 이는 어플리케이션의 전체 종속성 그래프를 인스턴스화하는 시작점이다. authController 컴포넌트의 인스턴스를 요청하면 서비스 로케이터는 자신의 인스턴스를 주입하여 관련 팩토리를 호출하게 되고, authController 팩토리가 authService 모듈을 로드하려고 시도하여 결과적으로 db 모듈을 인스턴스화하게 된다.

<p>
    위의 코드들은 모든 종속성을 수동으로 미리 수행할 필요없이 자동으로 연결된다. 장점은 모듈을 인스턴스화하고 연결하기 위한 올바른 순서가 무엇인지 미리 알 필요가 없다. 모든 것이 자동 및 필요 시에 발생한다.
</p>

#### 서비스 로케이터의 장단점

- 서비스 로케이터와 DI는 둘 다 의존성 처리의 책임을 컴포넌트의 외부 개체로 이관시킨다. 여기서 서비스 로케이터를 연결하는 방법이 전체 아키텍처의 유연성을 결정하게 된다.
- DI와 마찬가지로 서비스 로케이터를 사용하면 컴포넌트가 런타임에 해결(resolve)되기 때문에 컴포넌트 간의 관계를 식별하기가 더 어려워진다.
- 서비스 로케이터가 DI 컨테이너와 동일한 역활을 공유하기 때문에 이를 잘못 해석하는 경우가 많다.

<p>
    이 두 접근 방식의 차이는 다음 두 가지 이유에서 두드러진다.
</p>

- 재사용성: 서비스 로케이터에 의존하는 컴포넌트는 시스템에서 서비스 로케이터를 사용할 수 있어야 하기 때문에 재사용성이 적다.
- 가독성: 서비스 로케이터는 컴포넌트가 필요로 하는 종속성 식별이 불분명하다.

### 2-4 의존성 주입 컨테이너

<p>
    서비스 로케이터를 DI 컨테이너로 변환하는 단계는 어렵지 않지만 디커플링 측면에서 큰 차이가 있다. 이 패턴으로 인해 사실상 각 모듈은 서비스 로케이터에 의존할 필요가 없다. 필요 종속성을 표현할 수 있으며 DI 컨테이너가 나머지를 원활하게 수행해 준다.
</p>

#### DI 컨테이너에 대한 종속성 선언

<p>
    DI 컨테이너는 본질적으로 모듈을 인스턴스화하기 전에 모듈이 필요로 하는 종속성을 식별하는 기능을 추가한 서비스 로케이터이다. 이를 위해 모듈은 어떤 식으로든 의존성을 선언해야 한다.
</p>

```javascript
module.exports = (db, tokenSecret) => {
    // ...
}
```

<p>
    첫 번째 기법은 팩토리 또는 생성자에서 사용되는 인수의 이름을 기반으로 일련의 종속성을 주입하는 것이다. 위에서 정의한 모듈은 매우 간단하고 직관적인 메커니즘인 db, tokenSecret이라는 종속성 이름을 사용하여 DI 컨테이너에 의해 인스턴스화된다. 하지만 함수 인자의 이름을 읽는데는 약간의 트릭이 필요하다. 자바스크립트에서는 함수를 직렬화하여 런타임에 소스코드를 얻을 수 있다.
</p>

<p>
    이 방법의 가장 큰 문제는 소스코드의 크기를 최소화하기 위해, 클라이언트 측 자바스크립트에서 광범위하게 사용되는 특정 코드로의 변환하는 방식인 최소화(minification)와 잘 맞지 않는다는 점이다. 많은 최소화는 기본적으로 길이를 줄이기 위해 로컬 변수의 이름을 일반적으로 단일 문자로 바꾸는 네임 맹글링(name mangling)으로 알려진 기술을 적용한다. 함수 인자는 일반적으로 지역 변수여서 이 프로세스의 영향을 받음으로써, 종속성을 선언하기 위해 사용하는 이 메커니즘을 무너뜨린다. DI 컨테이너는 다른 기술을 사용하여 어떤 종속성을 주입할 지를 알 수 있다.
</p>

- 팩토리 함수에 추가된 특수한 속성을 사용할 수 있다. 예를 들어, 주입을 위한 모든 종속성을 명시적으로 나열한 배열을 사용할 수 있다.
  - `module.exports = (a, b) => {};`
  - `module.exports._inject = ['db', 'another/dependency'];`
- 모듈을 종속성 이름과 팩토리 함수를 담은 배열로 지정할 수 있다.
  - `module.exports = ['db', 'another/dependency', (a, b) => {}];`
- 함수의 각 인수에 추가되는 주석 어노테이션을 사용할 수 있다.(하지만  최소화와 잘 맞지 않는다.)
  - `module.exports = function(a /*db*/, b /*another/dependency*/) {};`

#### DI 컨테이너를 사용한 인증 서버 리팩토링

```javascript
const fnArgs = require('parse-fn-args');

module.exports = function() {
    const dependencies = {};
    const factories = {};
    const diContainer = {};

    diContainer.factory = (name, factory) => {
        factories[name] = factory;
    };

    diContainer.register = (name, dep) => {
        dependencies[name] = dep;
    };

    diContainer.get = (name) => {
        if (!dependencies[name]) {
            const factory = factories[name];
            dependencies[name] = factory && diContainer.inject(factory);
            if (!dependencies[name]) {
                throw new Error('Cannot find module: ' + name);
            }
        }
        return dependencies[name];
      };
      
    diContainer.inject = (factory) => {
        const args = fnArgs(factory)
            .map(function(dependency) {
                return diContainer.get(dependency);
            });
        return factory.apply(null, args);
    };
    
    return diContainer;
}
```

<p>
    diContainer의 모듈은 이전의 서비스 로케이터와 기능적으로 동일하며 다음과 같은 차이점이 있다.
</p>

- parse-fn-args라는 새로운 모듈이 필요하다. 이 모듈은 함수 인자들의 이름을 추출하는데 사용된다.
- 모듈 팩토리를 직접 호출하는 대신 diContainer 모듈의 `inject()`를 사용한다. 이 메소드는 모듈의 종속성을 해결하고 이를 사용하여 팩토리를 호출한다.

<p>
    `inject()` 메소드는 DI 컨테이너와 서비스 로케이터의 차이점이며, 논리는 매우 간단하다.
</p>

- parse-fn-args 라이브러리를 사용하여 입력으로 받은 팩토리 함수에서 인자들의 목록을 추출한다.
- 그 후에 각 인자 이름을 `get()` 메소드를 사용하여 조회된 해당 종속성 인스턴스에 맵핑한다.
- 마지막으로 방금 생성한 종속성 목록을 제공하여 팩토리를 호출하면 된다.

```javascript
// ...
const diContainer = require('./lib/diContainer')();

diContainer.register('dbName', 'example-db');
diContainer.register('tokenSecret', 'SHHH!');
diContainer.factory('db', require('./lib/db'));
diContainer.factory('authService', require('./lib/authService'));
diContainer.factory('authController', require('./lib/authController'));

const authController = diContainer.get('authController');

app.post('/login', authController.login);
app.get('/checkToken', authController.checkToken);
// ...
```

<p>
    위의 코드처럼 app 모듈의 코드는 이전 섹션에서 서비스 로케이터를 초기화할 때 사용했던 코드와 동일하다. 또한 DI 컨테이너를 로딩하여 전체 종속성 그래프를 시작시키기 위해 여전히 `diContainer.get('authController')`를 호출하여 서비스 로케이터로 사용해야 한다. 이 시점부터 DI 컨테이너에 등록된 모든 모듈이 인스턴스화되고 자동으로 연결된다.
</p>

#### DI 컨테이너의 장단점

<p>
    DI 컨테이너는 모듈이 DI 패턴을 사용하므로 대부분의 장단점을 상속받았다고 할 수 있다. 특히 디커플링과 테스트 가능성이 향상되었지만, 반면에 의존성이 런타임에 해결되기 때문에 복잡성이 더 증가하였다. 또한 DI 컨테이너는 서비스 로케이터 패턴과 많은 특성을 공유하지만 실제로 의존성을 제외한 추가적인 서비스에 의존하도록 모듈을 강제하지는 않는다.
</p>

## 3. 연결(Wiring)을 위한 플러그인

### 3-1 패키지로서의 플러그인

<p>
    종종 Node.js에서 어플리케이션의 플러그인은 프로젝트의 node_modules 디렉터리에 패키지로 설치된다. 이러한 방식은 두 가지 장점이 있다. 첫째는 npm 기능을 활용하여 플러그인을 배포하고 종속성을 관리할 수 있다. 둘째는 패키지에는 자체적인 종속성 그래플가 있을 수 있으므로 플러그인이 상위 프로젝트의 종속성을 사용하는 것과는 달리 종속성 간에 충돌 및 비호환성이 발생할 가능성이 줄어든다.
</p>

<p>
    패키지 사용의 이점은 외부 플러그인에만 국한되지 않는다. 실제로 한 가지 잘 사용되는 패턴은 어플리케이션이 자신의 모든 컴포넌트들을 내부 플러그인인 것처럼 패키지 안에 감싸서 어플리케이션 전체를 빌드하는 것이다. 따라서 어플리케이션의 메인 패키지 내에 모듈들을 구성하는 대신, 기능의 큰 덩어리 별로 별도의 패키지를 만들어 node_modules 디렉토리에 설치할 수 있다.
</p>

<p>
    이러한 패턴을 사용하는 이유는 먼저 편의성이다. 상대 경로 표기법을 사용하여 패키지의 로컬 모듈을 참조하는 것이 너무 장황한 경우가 종종 있는데, 이러한 경우에 유용하다. 두번째는 재사용성이다. 패키지는 자체적인 자체적인 private 의존성을 가질 수 있으며, 이것은 개발자로 하여금 전체 어플리케이션의 디커플링과 정보 은닉에 유익한 영향을 줄 수 있도록 메인 어플리케이션에 무엇을 노출시킬 것인지, 무엇을 사적(private)으로 유지할 것인지를 고려하도록 한다.
</p>

<p>
    이러한 유형의 아키텍처의 문제는 메인 어플리케이션의 일부를 플러그인에 노출시키는 것이다. 사실 상태를 유지하지 않는 플러그인만 생각할 수 는 없다. 물론 이는 완벽한 확장성을 위한 것이다. 왜냐하면, 종종 플러그인이 작업을 수행하기 위해 부모 어플리케이션의 일부 서비스를 사용해야 하기 때문이다. 이 측면은 부모 어플리케이션에서 모듈을 연결하는데 사용되는 기술에 크게 의존한다.
</p>

### 3-2 확장 포인트

<p>
    이벤트 이미터(EventEmitters)를 사용하면 이벤트로 게시(publish)/구독(subscribe) 패턴을 사용하여 컴포넌트를 분리할 수 있다. 또 다른 중요한 기술은 어플리케이션에서 새로운 기능을 추가하거나 기존 기능을 수정할 수 있는 지점을 명시적으로 정의하는 것이다. 어플리케이션의 이러한 지점을 일반적으로 후크(hook)라고 한다. 요약하면 플러그인을 지원하기 위한 가장 중요한 요소는 일련의 확장 포인트(extension point)들이다. 컴포넌트를 연결하는 방식도 플러그인에 어플리케이션의 서비스를 노출시키는 방법에 영향을 줄 수 있으므로 결정적인 역활을 한다.
</p>

### 3-3 플러그인 제어와 어플리케이션 제어 확장

![2](https://user-images.githubusercontent.com/38815618/104808191-e098a100-5827-11eb-9e16-676ef02f2c5e.PNG)

<p>
    명시적인 확장은 인프라를 명시적으로 확장하는 보다 구체적인 컴포넌트(새로운 기능을 제공하는)를 가진다. IoC(Inversion of Control: 제어 반전)를 통한 확장은 새로운 특정 컴포넌트를 로드, 설치 도는 실행하여 확장을 제어하는 인프라이다.
</p>

<p>
    IoC는 어플리케이션 확장성의 문제뿐만 아니라 매우 광범위하게 사용되는 원칙이다. 실제로 인프라 스트럭처를 제어하는 맞춤형 코드 대신 특정 형식의 IoC를 구현하면 인프라 스트럭처가 사용자 지정 코드를 제어하는 것이라고 할 수 있다. IoC를 사용하면 어플리케이션의 다양한 컴포넌트가 흐름을 제어하는 능력을 상실하는 대신 디커플링의 수준을 향상시킨다. 이는 할리우드의 원칙(Hollywood principle) 또는 "연략은 우리가 하겠습니다.(don't call us, we'll call you)"로도 알려져 있다.
</p>

<p>
    플러그인이 제어하는 확장(Plugin-controlled extension)은 필요에 따라 어플리케이션의 컴포넌트를 플러그인에 제공하여 확장하는 플러그인인 반면, 어플리케이션이 제어하는 확장(IoC)은 어플리케이션의 확장 지점 중 한 곳에 플러그인을 통합하여 제어가 어플리케이션에 맡겨진다.
</p>

```javascript
// 어플리케이션에서의 코드
const app = express();
require('thePlugin')(app);

// 플러그인에서의 코드
module.exports = function plugin(app) {
    app.get('/newRoute', function(req, res) {...})
};
```

<p>
    위의 코드는 플러그인이 제어하는 확장을 사용한 것이다.
</p>

```javascript
// 어플리케이션에서의 코드
const app = express();
const plugin = require('thePlugin');
app[plugin.method](plugin.route, plugin.handler);

// 플러그인에서의 코드
module.exports = function plugin() {
    return {
        method: 'get',
        route: '/newRoute',
        handler: function(req, res) {...}
    }
}
```

<p>
    위의 코드는 어플리케이션이 제어하는 확장을 사용한 것이다. 앞선 두 접근 방식 사이의 차이는 다음과 같다.
</p>

- 어플리케이션 내부에 대한 액세스 권한이 있는 경우가 많으므로 플러그인이 제어하는 확장이 더 강력하고 유연하며, 플러그인이 어플리케이션 자체의 일부가 아니어서 자유롭게 이동할 수 있다. 하지만 이는 장점보다는 때때로 책임 문제일 수도 있다. 사실, 어플리케이션의 모든 변경 사항이 플러그인에 보다 쉽게 영향을 미치기 때문에 메인 어플리케이션이 변경됨에 따라 지속적인 플러그인의 업데이트가 필요하다.
- 어플리케이션이 제어하는 확장을 사용하기 위해서는 기본 어플리케이션에 플러그인을 위한 인프라가 필요하다. 플러그인이 제어하는 확장의 경우 유일한 요건은 어플리케이션의 컴포넌트를 어떤 방식으로든 확장할 수 있어야 한다.
- 플러그인이 제어하는 확장을 사용하면 어플리케이션의 내부 서비스를 플러그인과 공유해야 한다. 그렇지 않으면 플러그인을 이용하여 기능을 확장할 수 없다. 어플리케이션이 제어하는 확장을 사용하면, 확장만이 아니라 사용을 위해서라도 어플리케이션의 일부 서비스에 액세스할 수 있어야 한다.
