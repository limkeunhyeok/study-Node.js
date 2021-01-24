# Chapter 08 - 웹 어플리케이션을 위한 범용 Javascript

> 자바스크립트는 웹 개발자들에게 직접 브라우저에서 코드를 실행하여 보다 동적이고 상호작용이 뛰어난 웹 사이트를 구축할 수 있도록 한다는 목표를 가지고 1995년에 탄생하였다. 초창기 자바스크립트는 매우 간단하고 제한된 언어였지만, 오늘날 모든 종류의 어플리케이션을 만들기 위해 브라우저 외부에서도 사용할 수 있는 완전한 범용 언어로 간주될 수 있다. 플랫폼과 장치 전반에 걸친 가용성은 동일한 프로젝트의 여러 환경에서 코드의 재사용성을 단순화할 수 있는 새로운 경향을 자바스크립트 개발자들 사이에 촉진시키고 있다. Node.js와 관련하여 가장 의미있는 사례는 서버와 브라우저 사이에 코드를 공유하기 쉬운 웹 어플리케이션을 만들 수 있는 기회에 관한 것이다. 코드 재사용을 위한 이 질문은 원래 동형 자바스크립트(Isomorphic Javascript)로 구분되었지만 이제는 범용 자바스크립트(Universal Javascript)로 널리 인식되고 있다.

## 1. 브라우저와 코드 공유하기

### 1-1 모듈 공유

<p>
    서버에서 사용하는 모듈 시스템과 브라우저에서 사용되는 모듈 시스템은 일치하지 않는다. 브라우저에서는 `require()` 함수 혹은 모듈을 해석할 수 있는 파일 시스템이 없다. 따라서 두 플랫폼에서 작동할 수 있는 시스템을 사용하려면 추가적인 단계를 수헹해야 된다.
</p>

#### 범용 모듈 정의

- 모듈 시스템이 전혀 없는 환경이 있을 수도 있다. 즉, 전역이 다른 모듈들을 액세스하기 위한 주된 메커니즘이다.
- RequireJS와 같이 비동기 모듈 정의 로더 기반의 환경을 가질 수 있다.
- CommonJS 모듈 시스템을 추상화한 환경을 가지고 있을 수도 있다.

#### UMD(Universal Module Definition) 모듈 만들기

<p>
    아래의 코드는 UMD의 다양한 변형들 중 하나로 AMD, CommonJS 및 브라우저 전역과 같은 일반적인 모듈 시스템들을 지원할 수 있다. 간단한 템플릿 엔진인 mustache에 대한 외부 종속성을 가진 모듈을 정의하며, 최종적으로 제공하는 것은 `sayHello()`라는 메소드를 가진 객체로 mustache 템플릿을 렌더링하여 호출자에게 반환한다. UMD의 목표는 다른 환경에서 사용 가능하도록 다른 모듈 시스템과 통합하는 것이다.
</p>

```javascript
(function(root, factory) { // 1.
    if(typeof define === 'function' && define.amd) { // 2.
        define(['mustache'], factory);
    } else if(typeof module === 'object' && // 3.
        typeof module.exports === 'object') {
        var mustache = require('mustache');
        module.exports = factory(mustache);
    } else { // 4.
        root.UmdModule = factory(root.Mustache);
    }
}(this, function(mustache) { // 5.
    var template = '<h1>Hello <i>{{name}}</i></h1>';
    mustache.parse(template);

    return {
        sayHello:function(toWhom) {
            return mustache.render(template, {name: toWhom});
        }
    };
}));
```

1. 노출식 모듈(Revealing Module) 패턴과 매우 유사한 익명의 자체 실행(anoymous self-executing) 함수로 둘러 싸여진다. 이 함수는 시스템에서 사용할 수 있는 전역 네임스페이스 객체인 root를 받는다. 이는 주로 종속성을 글로벌 변수로 등록하는데 필요하다. 두 번째 인수는 모듈의 `factory()`인데, 모듈의 인스턴스를 반환하고 종속성을 입력으로 받아들이는 함수이다.
2. 먼저 AMD가 시스템에서 사용 가능한지 확인한다. define 함수와 AMD 플래그의 존재를 검증함으로써 이를 수행한다. 발견되면 시스템에 AMD 로더가 있음을 의미하므로 define을 사용하여 모듈을 등록하고 `factory()`에 종속성 mustache를 주입해야 한다.
3. `module`과 `module.exports` 객체의 존재를 검사하여 Node.js와 호환성이 있는 CommonJS 환경인지 여부를 확인한다. 이 경우 `require()`를 사용하여 모듈의 종속성을 로드하고 `factort()`에 제공한다. factort의 반환값은 `module.exports`에 할당된다.
4. 마지막으로 AMD나 CommonJS가 없다면 root 객체를 사용하여 전역 변수에 모듈을 할당한다. 브라우저 환경에서 root 객체는 일반적으로 window 객체이다. 또한 글로벌에 존재할 것으로 예상되는 종속성인 mustache를 어떻게 획득하는지도 볼 수 있다.
5. 마지막 단계에서 래퍼 함수 this 객체를 root에 제공하고 두 번째 인자로 모듈 팩토리를 제공하여 자가 호출(self-invoke)된다. 팩토리가 필요한 종속성을 인수로 받아들이는 방식을 볼 수 있을 것이다.

#### UMD 패턴에 대한 고려 사항

<p>
    UMD 패턴은 가장 많이 사용되는 모듈 시스템과 호환성을 갖춘 모듈을 만들 때 사용되는 효과적이고 간단한 기술이다. 하지만 각 환경에서 테스트하기 어렵고 오류가 발생하기 쉬운 많은 상용구들을 필요로 한다. 즉, UMD 상용구를 수동으로 작성한다는 것은 이미 개발 및 테스트된 단일 모듈을 랩핑하는 것이라는 것을 의미한다. 처음부터 새로운 모듈을 작성할 때는 사용하지 않는 것이 좋다. 따라서 이 경우 프로세스를 자동화하는데 도움이 되는 도구에 작업을 맡기는 것이 좋다. 이러한 도구 중 하나는 Webpack이다.
</p>

### 1-2 ES2015 모듈

<p>
    ES2015 사양에서 소개된 기능 중 하나는 내장(build-in) 모듈 시스템이며, CommonJS 및 AMD 모듈을 최대한 활용하는 것을 목표로 한다. 이 규격은 CommonJS와 마찬가지로 압축된 구문과 단일 exports를 선호하며 종속성 순환 지원을 제공한다. AMD와 마찬가지로 비동기 로드 및 환경 설정 가능한 모듈 로드를 직접 지원한다. 또한 선언적 구문(declarative syntax) 덕분에 정적 분석기(static analyzers)를 사용하여 정적 검사 및 최적화 같은 작업을 수행할 수 있다.
</p>

## 2. Webpack 소개

<p>
    웹팩은 Node.js 모듈 규칙을 사용하여 모듈을 작성한 다음, 컴파일 단계에서 모듈이 브라우저에서 작업하는데 필요한 모든 종속성을 포함하는 변들을 작성한다. 그런 다음 번들을 웹 페이지에 쉽게 불러오고 브라우저 내에서 실행할 수 있다. 웹 팩은 재귀적으로 소스를 스캔하고 `require()` 함수의 참조를 찾아서 해결한 다음 참조된 모듈을 번들에 포함시킨다.
</p>

### 2-1 Webpack 사용의 이점

- 브라우저와 호환되지 않는 모듈이 있는 경우, 이를 빌드에서 제외하거나 빈 객체나 다른 모듈로 대체하거나 브라우저와 호환 구현을 제공하는 다른 모듈로 바꿀 수 있다.
- 웹팩은 다른 모듈에 대한 번들을 생성할 수 있다.
- 웹팩은 서드파티 로더와 플러그인을 사용하여 소스 파일의 추가적인 처리를 가능하게 한다. 컴파일을 위한 CoffeeScript, TypeScript 또는 ES2015로부터 시작하여 AMD 로드를 지원하기 위해 `require()`를 사용하는 Bower와 Component 패키지에 이르기까지, 또 최소화에서 템플릿과 스타일시트와 같은 다른 리소스들의 컴파일과 번들링에 이르기까지 필요한 거의 모든 로더와 플러그인이 존재한다.
- Gulp 및 Grunt와 같은 작업 관리자에서 웹팩을 쉽게 호출할 수 있다.
- 웹팩을 사용하면 자바스크립트 파일뿐 아니라 스타일시트, 이밎, 폰트 및 템플릿과 같은 모든 프로젝트 리소스를 관리하고 전처리할 수 있다.
- 종속 트리를 분할하여 브라우저에서 필요할 때마다 로드할 수 있도록 웹팩을 구성할 수도 있다.

## 3. 크로스 플랫폼 개발의 기본

### 3-1 런타임 코드 분기(branching)

<p>
    호스트의 플랫폼에 따라 다양한 구현을 제공하는 가장 간단하고 직관적인 기술은 코드를 동적으로 분기하는 것이다. 이를 위해선 호스트 플랫폼을 인식한 후 `if ... else ...` 문을 사용하여 구현을 동적으로 전환하는 메커니즘이 필요하다.
</p>

```javascript
if (typeof window !== 'undefined' && window.document) {
    // 클라이언트 측 코드
    console.log('Hey browser!');
} else {
    // Node.js 코드
    console.log('Hey Node.js!');
}
```

<p>
    위의 코드처럼 런타임 분기를 사용하는 것은 가장 직관적이고 간단한 패턴이지만, 다음과 같은 단점이 있다.
</p>

- 두 플랫폼의 코드가 동일한 모듈에 포함됨으로써, 최종적인 번들에 포함되어 감당할 수 없이 코드의 크기가 커진다.
- 너무 광범위하게 사용되면 비즈니스 로직이 플랫폼 간 호환성을 위해 추가한 로직과 뒤섞여 코드의 가독성을 상당히 떨어뜨릴 수 있다.
- 동적 분기를 사용하여 플랫폼에 따라 다른 모듈을 로드하면 대상 플랫폼과 상관없이 모든 모듈이 최종 번들에 추가된다.

### 3-2 빌드 타임 코드 분기

<p>
    로더 외에도 웹팩은 플러그인 지원을 제공하므로, 번들 파일을 작성하는데 사용되는 프로세스 파이프라인을 확장할 수 있다. 빌드 시 코드 분기를 수행하기 위해서는 두 개의 내장된 플러그인으로 DefindPlugin과 UglifyJSPlugin이라는 파이프라인을 사용할 수 있다.
</p>

<p>
    DefindPlugin은 사용자 정의 코드 또는 변수로 소스 파일의 특정 코드 항목을 대처하는데 사용할 수 있다. 대신, UglifyJSPlugin을 사용하면 결과 코드를 압축하고 도달하지 않는 문장(dead code)들을 제거할 수 있다.
</p>

```javascript
const path = require('path');
const webpack = require('webpack');

const definePlugin = new webpack.DefinePlugin({
    "__BROWSER__": "true"
});

const uglify = new webpack.optimize.UglifyJsPlugin({
    beautify: true,
    dead_code: true
});

module.exports = {
    entry:  path.join(__dirname, "src", "main.js"),
    output: {
        path: path.join(__dirname, "dist"),
        filename: "bundle.js"
    },
    plugins: [definePlugin, uglify]
};
```

<p>
    첫 번째 플러그인인 DefindPlugin을 사용하면 소스코드의 특정 부분을 동적 코드 또는 상수 값으로 바꿀 수 있다. 이경우 코드로 코드에서 `__BROWSER__`라는 모든 항목을 찾아서 true로 바꾸도록 플러그인을 구성한다. 모든 환경설정 객체의 값은 빌드 타임에 평가되어 일치하는 코드로 대체하기 위해 사용되는 코드 문장을 나타낸다. 이는 환경 변수의 내용, 현재 타임스탬프 또는 마지막 git commit의 해시를 포함하는 외부의 동적 값들을 번들에 넣을 수 있도록 한다.
</p>

<p>
    두 번째 플러그인인 UglifyJSPlugin은 번들 파일의 자바스크립트 코드를 난독화하고 최소화(minify)하는데 사용된다. dead_code 옵션을 플러그인에 제공하면 모든 dead code를 제거하며, beautify 옵션은 모든 들여쓰기 및 공백을 제거하지 않으므로 결과 번들 파일을 읽어 볼 수 있다. 배포용 번들을 작성할 때 beautify 옵션은 지정하지 않는 것이 좋으며 기본 값은 false이다.
</p>

### 3-3 크로스 플랫폼 개발을 위한 디자인 패턴

- 전략(Strategy)과 템플릿(Template): 브라우저와 코드를 공유할 때 가장 유용한 패턴이다. 알고리즘의 공통 단계를 정의하여 일부를 교체할 수 있게 한다. 크로스 플랫폼 개발에서 이러한 패턴을 통해 플랫폼에 제한되지 않는 컴포넌트를 공유할 수 있으며, 이를 통해 플랫폼별 부품이 다른 전략이나 템플릿 메소드를 사용하도록 변경할 수 있다.
- 어댑터(Adapter): 컴포넌트 전체를 교환해야 할 때 가장 유용하다.
- 프록시(Proxy): 서버에서 실행되도록 한 코드를 브라우저에서 실행할 때, 종종 서버에 있는 코드들도 브라우저에서 사용할 수 있기를 기대하는 경우가 많으며, 여기서 원격 프록시 패턴이 적용된다.
- 옵저버(Observer): 이벤트를 발생시키는 컴포넌트와 이벤트를 수신하는 컴포넌트 사이의 자연스러운 추상화를 제공한다.
- DI 및 서비스 로케이터: 주입 순간에 모듈의 구현을 대체하는데 유용하게 사용할 수 있다.

## 4. 리액트(React) 소개

<p>
    리액트란 페이스북에서 발표한 자바스크립트 라이브러리이다. 리액트는 컴포넌트의 개념에 초점을 맞추어 뷰의 추상화를 제공한다. 여기서 컴포넌트는 버튼, 입력 폼, HTML의 div 또는 사용자 인터페이스의 다른 모든 엘리먼트 같은 간단한 컨테이너이다. 이 개념은 특정한 책임을 가진, 고도로 재사용 가능한 컴포넌트를 정의하고 구성하는 것만으로 어플리케이션의 사용자 인터페이스를 구축할 수 있어야 한다는 것이다.
</p>

<p>
    리액트의 모토는 '한번 배우고 모든 곳에 사용하세요(Learn it once, use it everywehere)'로, 모든 다른 상황에 맞도록 특정한 구현이 필요하다는 것을 분명히 함과 동시에 일단 배우고 나면 다양한 환경에 걸쳐 편리한 원리와 도구를 재사용할 수 있다는 뜻이다.
</p>

<p>
    리액트가 범용 자바스크립트 개발과 관련해서 주요 특징은 거의 동일한 코드를 사용하여 서버와 클라이언트 모두에서 뷰 코드를 렌더링할 수 있다. 이는 리액트를 사용하여 사용자가 Node.js 서버에서 직접 요청한 페이지를 표시하는데 필요한 모든 HTML 코드를 렌더링한 후 페이지가 로드될 때 추가적인 상호 작용이나 렌더링을 브라우저에서 직접 수행할 수 있다. 이를 통해 SPA(Single-PageApplication)를 구축할 수 있다. 동시에 사용자가 로드하는 첫 번째 페이지를 서버에서 제공함으로써 로딩 시간이 단축되고 검색 엔진의 콘텐츠 색인 기능이 향상된다. 또한 리액트의 Virtual DOM은 변경 사항이 렌더링되는 방식을 최적화할 수 있다.
</p>

### 4-1 첫 번째 리액트 컴포넌트

```javascript
// src/joyceBooks.js

const React = require('react');

const books = [
    'Dubliners',
    'A Portrait of the Artist as a Young Man',
    'Exiles and poetry',
    'Ulysses',
    'Finnegans Wake'
];

class JoyceBooks extends React.Component {
    render() {
        return (
            <div>
                <h2>James Joyce's major works</h2>
                <ul className="books">{
                    books.map((book, index) => 
                        <li className="book" key={index}>{book}</li>
                    )
                }</ul>
            </div>
        );
    }
}

module.exports = JoyceBooks;
```

<p>
    위의 코드는 브라우저 윈도우에 엘리먼트의 목록을 보여주는 간단한 위젯 컴포넌트이다. 리액트 컴포넌트를 정의하려면 `React.Component`로부터 확장된 클래스를 만들어야 한다. 이 클래스는 반드시 `render()`를 정의해야 하는데, 이 함수는 컴포넌트가 담당하는 DOM의 일부를 표현하는데 사용된다.
</p>

### 4-2 JSX가 뭐지?!

<p>
    고유의 복잡성을 처리하기 위해 리액트는 가상 DOM을 기술하고 조작하기 위해 고안된 중간 형식으로 JSX를 도입했다. JSX는 언어가 아니며, 자바스크립트를 실행하기 위해 일반 자바스크립트로 변환해야 하는 자바스크립트의 슈퍼셋이다. JSX는 웹 컴포넌트를 정의하는 HTML 코드를 기술하는데 사용되며, 향상된 자바스크립트 구문의 일부를 보는 것처럼 JSX 코드의 중간에 직접 HTML 태그를 넣을 수 있다. 이 접근 방식은 빌드 시에 동적으로 검증되며, 어떤 태그를 닫는 것을 잊어 버리는 등의 경우 미리 오류가 발생한다.
</p>

```javascript
render() {
    return (
        <div>
            <h2>James Joyce's major works</h2>
            <ul className="books">{
                books.map((book, index) => 
                    <li className="book" key={index}>{book}</li>
                )
            }</ul>
        </div>
    );
}
```

<p>
    JSX 코드 내 임의의 위치에 특정 표시기나 래퍼를 둘 필요 없이 HTML 코드를 삽입할 수 있다. 위의 코드에서는 div 태그를 정의하며, div 태그는 컴포넌트의 컨테이너 역활을 한다. 또한 HTML 블록 내에 자바스크립트 로직을 넣을 수 있으며, HTML 코드의 일부를 동적으로 정의할 수 있다. 위의 코드에서는 ul 태그 내에서 map 함수를 사용하여 반복을 수행하면서 책 이름을 목록에 추가한다. 중괄호는 HTML 블록 내에서 표현식을 정의하는데 사용되며, 간단한 사용 사례는 변수의 내용을 출력하는데 사용한다. 마지막으로 자바스크립트 콘텐츠 내에 또 다른 HTML 코드 블록을 다시 넣을 수 있으므로, HTML 및 자바스크립트 콘텐츠를 가상 DOM을 표현하는 모든 레벨에서 혼합해서 중첩시킬 수 있다.
</p>

### 4-3 JSX 변환을 위한 Webpack 설정

```javascript
const path = require('path');

module.exports = {
    entry: path.join(__dirname, "src", "main.js"),
    output: {
        path: path.join(__dirname, "dist"),
        filename: "bundle.js"
    },
    module: {
        loaders: [
            {
                test: path.join(__dirname, "src"),
                loader: 'babel-loader',
                query: {
                    cacheDirectory: 'babel_cache',
                    presets: ['es2015', 'react']
                }
            }
        ]
    }
};
```

<p>
    위의 코드는 JSX 코드를 브라우저에서 실행될 수 있는 자바스크립트 코드로 변환하는데 사용할 수 있는 Webpack의 설정 예시이다. 이전의 ES2015 Webpack 예시와 동일하며 차이점은 다음과 같다.
</p>

- Babel의 react preset을 사용하고 있다.
- cacheDirectory 옵션을 사용하여 Babel은 특정 디렉터리를 캐시 폴더로 사용하고 더 신속하게 번들 파일을 만들 수 있다. 반드시 필요한 것은 아니나 개발 속도를 높이는데 도움이 된다.

### 4-4 브라우저에서 렌더링하기

```javascript
// src/main.js

const React = require('react');
const ReactDOM = require('react-dom');
const JoyceBooks = require('./joyceBooks');

window.onload = () => {
    ReactDOM.render(<JoyceBooks/>, document.getElementById('main'))
};
```

<p>
    위의 코드는 브라우저에서 렌더링한다. 여기서 `ReactDOM.render()` 함수는 JSX 코드 블록과 DOM의 엘리먼트를 인자로 취하여 JSX 블록을 HTML 코드로 렌더링하고 두 번째 인자로 지정된 DOM 노드에 적용한다. 여기서 전달하는 JSX 블록은 사용자 정의 태그 만을 가지고 있다. 컴포넌트가 필요할 때마다 JSX 태그로 사용할 수 있으므로 컴포넌트의 새 인스턴스를 다른 JSX 블록에 쉽게 삽입할 수 있다. 이는 개발자가 화면을 여러 개의 결합된 컴포넌트로 분할할 수 있게 해주는 기본적인 메커니즘이다.
</p>

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>React Example - James Joyce books</title>
    </head>
    <body>
        <div id="main"></div>
        <script src="dist/bundle.js"></script>
    </body>
</html>
```

<p>
    위의 코드는 리액트 어플리케이션의 컨테이너 역활을 담당하는 id가 main인 div를 가지고 있는 일반 HTML 페이지에 bundle.js 파일을 추가한다. 이를 실행하여 사용자가 페이지를 로드할 때, 클라이언트 측 렌더링은 다음과 같이 동작한다.
</p>

1. 페이지의 HTML 코드가 브라우저에 의해 다운로드된 후 렌더링된다.
2. 번들 파일이 다운로드되고 자바스크립트 내용이 평가된다.
3. 평가된 코드는 페이지의 실제 내용을 동적으로 생성하여 DOM을 업데이트하여 표시한다.

<p>
    자바스크립트를 사용하지 않도록 설정한(예: 검색 엔진 봇) 브라우저에서 이 페이지를 로드할 경우, 웹 페이지는 별 내용을 가지지 않은 빈 웹 페이지처럼 보인다. 이는 SEO(Search Engine Optimization) 측면에서 심각한 문제일 수 있다.
</p>

### 4-5 리액트 라우터 라이브러리

```javascript
// src/components/authorsIndex.js
const React = require('react');
const Link = require('react-router').Link;

const authors = [
    {id: 1, name: 'James Joyce', slug: 'joyce'},
    {id: 2, name: 'Herbert George Wells', slug: 'h-g-wells'}
];

class AuthorsIndex extends React.Component {
    render() {
        return (
            <div>
                <h1>List of authors</h1>
                <ul>{
                    authors.map(author =>
                        <li key={author.id}>
                            <Link to={`/author/${author.slug}`}>
                                {author.name}
                            </Link>
                        </li>
                    )
                }</ul>
            </div>
        )
    }
}

module.exports = AuthorsIndex;
```

<p>
    위의 코드는 어플리케이션의 인덱스를 나타낸다. 단숨함을 유지하기 위해 이 컴포넌트를 렌더링하는데 필요한 데이터를 각 작가를 나타내는 일련의 배열 객체인 authors에게 저장한다. Link 컴포넌트는 리액트 라우터 라이브러리를 이용하며 앱의 영역들을 탐색할 수 있도록 클릭 가능한 링크를 렌더링한다. 여기서 Link의 to 속성은 링크를 클릭할 때 표시할 특정 라우트를 나타내는 상대 URI를 지정하는데 사용된다. 일반 a 태그와 크게 다르지 않으며, 단지 전체 페이지를 새로 고침하여 새 페이지로 이동하는 대신 리액트 라우터가 새로운 URI와 관련된 컴포넌트를 표시하기 위해 변경해야 하는 페이지의 부분을 동적으로 새로 고친다.
</p>

```javascript
// src/joyceBooks.js

const React = require('react');
const Link = require('react-router').Link;

const books = [
    'Dubliners',
    'A Portrait of the Artist as a Young Man',
    'Exiles and poetry',
    'Ulysses',
    'Finnegans Wake'
];

class JoyceBooks extends React.Component {
    render() {
        return (
            <div>
                <h2>James Joyce's major works</h2>
                <ul className="books">{
                    books.map((book, key) => 
                        <li className="book" key={key}>{book}</li>
                    )
                }</ul>
                <Link to="/">Go back to index</Link>
            </div>
        );
    }
}

module.exports = JoyceBooks;
```

<p>
    위의 코드는 앞선 joyceBooks.js에서 링크를 추가하고 map 함수 내에서 key 어트리뷰트를 사용한 것이다. 마지막 변경을 통해 리액트에게 특정 엘리먼트가 고유한 키로 식별된다고 알리고 있다. 이를 통해 목록을 다시 렌더링해야 할 때마다 여러 가지 최적화를 수행할 수 있다. 이는 필수적이지는 않지만 대용량 어플리케이션의 경우 권장된다. 이와 유사하게 wellBooks.js나 notFound 컴포넌트를 작성할 수 있다.
</p>

```javascript
const React = require('react');
const ReactRouter = require('react-router');
const Router = ReactRouter.Router;
const Route = ReactRouter.Route;
const hashHistory = ReactRouter.hashHistory;
const AuthorsIndex = require('./components/authorsIndex');
const JoyceBooks = require('./components/joyceBooks');
const WellsBooks = require('./components/wellsBooks');
const NotFound = require('./components/notFound');

class Routes extends React.Component {
    render() {
        return (
            <Router history={hashHistory}>
                <Route path="/" component={AuthorsIndex}/>
                <Route path="/author/joyce" component={JoyceBooks}/>
                <Route path="/author/h-g-wells" component={WellsBooks}/>
                <Route path="*" component={NotFound}/>
            </Router>
        )
    }
}

module.exports = Routes;
```

<p>
    라우터는 모든 라우팅 구성을 보유하는 핵심 컴포넌트이며, 라우트 컴포넌트들의 루트 노드로 사용하는 엘리먼트이다. history 속성은 사용자가 링크를 클릭할 때마다 브라우저 바의 URL을 업데이트하는 방법과 액티브 라우트를 탐지하는데 사용되는 메커니즘을 정의한다. 일반적으로 hashHistory와 browserHistory 두 가지 전략이 있다. hashHistory 전략을 사용하면 `index.html#/author/h-g-wells`로 표시된다. browserHistory 전략을 사용하면 `http://example.com/author/h-g-wells`와 같은 고유한 전체 URI를 가진다.
</p>

<p>
    라우트 컴포넌트를 통해 경로와 컴포넌트 간의 연결을 정의할 수 있다. 이 컴포넌트는 경로가 일치할 경우 렌더링된다. 여기서 라우터 컴포넌트가 HTML과 같은 선언적인 구문과 함께 동작하는 방식을 이해해야 한다.
</p>

- 먼저 이 구문은 컨테이너의 역활을 한다. HTML 코드를 렌더링하지는 않지만 Route 정의 목록을 담는다.
- 모든 라우트 정의는 컴포넌트와 연결된다. 예제의 컴포넌트는 그래픽 컴포넌트로, 페이지의 현재 URL 경로와 일치하는 경우에만 페이지의 HTML 코드로 렌더링된다는 것을 의미한다.
- 특정 URI에 대해 단 하나의 라우트만 일치할 수 있다. 모호한 경우 라우터는 다음으로 포괄적인 경로를 선택하게 된다.
- 다른 모든 경로가 일치하지 않는 경우를 위해서 *를 사용한 포괄 경로를 정의할 수 있다. 예제에서는 not found 메시지를 표시한다.

## 5. 범용 자바스크립트 앱 만들기

> 범용 라우팅 및 렌더링을 추가하여 재사용 가능한 컴포넌트를 생성하고 범용 데이터를 탐색하는 앱

### 5-1 재사용 가능한 컴포넌트 만들기

```javascript
// components/authorPage.js

const React = require('react');
const Link = require('react-router').Link;
const AUTHORS = require('../authors');

class AuthorPage extends React.Component {
    render() {
        const author = AUTHORS[this.props.params.id];
        return (
            <div>
                <h2>{author.name}'s major works</h2>
                <ul className="books">{
                    author.books.map((book, key) =>
                        <li key={key} className="book">{book}</li>
                    )
                }</ul>
                <Link to="/">Go back to index</Link>
            </div>
        );
    }
}

module.exports = AuthorPage;
```

<p>
    앞선 예제들과 유사하나, 컴포넌트 내에서 데이터를 가져오는 방법과 표시할 저자를 나타내는 매개 변수를 받는 방법이 필요하다. 위 코드에선 author.js를 사용한다. 이 모듈은 간단한 데이터베이스로 사용할 저자에 대한 데이터가 들어있는 자바스크립트 객체를 반환한다. 변수 this.props.params.id는 표시해야 하는 저자의 식별자를 나타낸다. 이 매개 변수는 라우터에 의해 채워지며, 이를 사용함으로써 데이터베이스 객체에서 저자를 추출한 후 컴포넌트를 렌더링하는데 필요한 모든 정보가 만들어진다.
</p>

```javascript
// author.js

module.exports = {
    'joyce': {
        'name': 'James Joyce',
        'books': [
        'Dubliners',
        'A Portrait of the Artist as a Young Man',
        'Exiles and poetry',
        'Ulysses',
        'Finnegans Wake'
        ]
    },
    'h-g-wells': {
        'name': 'Herbert George Wells',
        'books': [
        'The Time Machine',
        'The War of the Worlds',
        'The First Men in the Moon',
        'The Invisible Man'
        ]
    }
};
```

<p>
    author.js는 저자들을 니모닉(mnemonic: 연상 기호) 문자열 식별자로 색인화하는 매우 간단한 객체이다.
</p>

```javascript
// route.js

const React = require('react');
const ReactRouter = require('react-router');
const Router = ReactRouter.Router;
const hashHistory = ReactRouter.hashHistory;
const AuthorsIndex = require('./components/authorsIndex');
const AuthorPage = require('./components/authorPage');
const NotFound = require('./components/notFound');

const routesConfig = [
    {path: '/', component: AuthorsIndex},
    {path: '/author/:id', component: AuthorPage},
    {path: '*', component: NotFound}
];

class Routes extends React.Component {
    render() {
        return <Router history={hashHistory} routes={routesConfig}/>;
    }
}

module.exports = Routes;
```

<p>
    위의 코드는 일반화하여 재사용 가능한 새로운 AuthorPage 컴포넌트를 사용한다. routes 컴포넌트의 render 함수 내에 라우트 컴포넌트를 넣는 대신 일반 자바스크립트 배열을 사용하여 Route들을 정의한다. 그후 배열 객체는 Router 컴포넌트의 routes 속성에 전달된다. 여기서 중요한 변화는 `/author/:id` 형식의 경로이다. 이는 새로운 컴포넌트에 연결되며 이전에 지정한 저자에 대한 경로를 대체한다. 이 경로는 매개 변수를 표시하며, 이전의 경로인 `/author/joyce`와 `/author/h-g-wells`와 매치된다. id 매개 변수에 해당하는 문자열은 컴포넌트로 직접 전달된 것이며, 해당 컴포넌트는 props.params.id를 읽어 액세스할 수 있다.
</p>

### 5-2 서버 측 렌더링

<p>
    리액트의 또 다른 특징 중 하나는 서버 측에서도 컴포넌트를 렌더링할 수 있다는 것이다. 모든 컴포넌트는 이전 예제와 동일하며, 서버에서 라우팅 설정에 액세스해야 하므로 작업을 단순화하기 위해 routes.js 파일에서 reoutesConfig.js라는 전용 모듈로 라우팅 설정 객체(routesConfig)를 이관한다.
</p>

```javascript
// src/routesConfig.js

const AuthorsIndex = require('./components/authorsIndex');
const AuthorPage = require('./components/authorPage');
const NotFound = require('./components/notFound');

const routesConfig = [
    {path: '/', component: AuthorsIndex},
    {path: '/author/:id', component: AuthorPage},
    {path: '*', component: NotFound}
];

module.exports = routesConfig;
```

<p>
    또한 ejs를 내부 템플릿 엔진으로 사용할 것이기 때문에 아래와 같이 변환한다.
</p>

```html
<!-- views/index.ejs -->

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>React Example - Authors archive</title>
</head>
<body>
    <div id="main">
        <%- markup -%>
    </div>
    <script src="dist/bundle.js"></script>
</body>
</html>
```

<p>
    `<%- markup -%>` 태그는 페이지를 브라우저에 내보내기 전에 서버 측에서 렌더링할 리액트 콘텐츠로 동적으로 대치될 템플릿의 일부분이다.
</p>

```javascript
// server.js

const http = require('http');
const Express = require('express');
const React = require('react');
const ReactDom = require('react-dom/server');
const Router = require('react-router');
const routesConfig = require('./src/routesConfig');

const app = new Express();
const server = new http.Server(app);

app.set('view engine', 'ejs');

app.get('*', (req, res) => {
    Router.match(
        {routes: routesConfig, location: req.url},
        (error, redirectLocation, renderProps) => {
            if (error) {
                res.status(500).send(error.message)
            } else if (redirectLocation) {
                res.redirect(302, redirectLocation.pathname + redirectLocation.search)
            } else if (renderProps) {
                let markup = ReactDom.renderToString(<Router.RouterContext {...renderProps} />);
                res.render('index', {markup});
            } else {
                res.status(404).send('Not found')
            }
        }
    );
});

server.listen(3000, (err) => {
    if (err) {
        return console.error(err);
    }
    console.info('Server running on http://localhost:3000');
});
```

<p>
    위 코드에서 `app.get('*', (req, res) => {...})`은 서버의 모든 URL에 대해 GET request를 가로채라는 Express 함수이다. 이 route에서는 앞서 클라이언트 측 어플리케이션에서 설정한 라우팅 로직을 React Router에 위임한다.
</p>

<p>
    서버에서 React Router를 적용하기 위해 Router.match 함수를 사용한다. 이 함수는 설정(configuration) 객체와 콜백 함수를 매개 변수로 받는다. 설정 객체에는 두 개의 키가 있어야 한다.
</p>

- routes: React Router의 경로 설정을 전달하는데 사용한다. 여기서는 클라이언트 측 렌더링에 사용한 설정과 완전히 동일한 설정을 전달한다(routesConfig).
- location: 라우터가 앞서 정의된 경로들과 비교할 현재 요청된 URL을 지정하는데 사용된다.

<p>
    코ㅓㄹ백 함수는 경로가 일치할 경우 호출된다. 콜백은 error, redirectLocation, renderProps 세 개의 인자를 받는데, 이는 매치 연산의 결과가 정확히 무엇인지 결정하는데 사용된다. 여기서 처리해야 할 네 가지 경우가 존재한다.
</p>

1. 라우팅 해결(routing resolving) 중에 오류가 발생했을 경우이다. 이 경우에는 브라우저에 500번 내부 서버 오류 응답을 반환한다.
2. 리다이렉션 경로와 일치하는 경우이다. 이 경우에는 브라우저에 새 대상으로 이동하도록 알리는 서버 리다이렉션 메시지(302)를 만들어야 한다.
3. 경로와 일치하고 관련된 컴포넌트를 렌더링해야 하는 경우이다. 이 경우 renderProps 인자는 컴포넌트를 렌더링하는데 사용해야 하는 일부 데이터가 들어있는 객체이다. 이는 서버 측 라우팅 메커니즘의 핵심이며, ReactDOM.renderToString 함수를 사용하여 현재 일치하는 경로와 관련된 컴포넌트를 나타내는 HTML 코드를 렌더링할 수 있다. 그후 브라우저에 보낼 전체 HTML 페이지를 가져오기 위하여 앞서 정의한 index.ejs 템플릿에 결과 HTML을 주입한다.
4. 경로가 일치하지 않는 경우로 404 not found 에러를 보낸다.

<p>
    ReactDOM.renderToString 함수의 동작은 다음과 같다.
</p>

- 이 함수는 모듈 react-dom/server에서 제공되며, React 컴포넌트를 문자열로 렌더링할 수 있다. HTML 코드를 서버에서 렌더링하여 즉시 브라우저로 전송하여 페이지 로드 시간을 단축하고 페이지를 SEO 친화적으로 만드는데 사용된다. `ReactDOM.render()`를 브라우저에 있는 동일한 컴포넌트에 대해 호출하면 react는 다시 렌더링하지 않고 이벤트 리스너를 기존 DOM 노드에 연결한다.
- 렌더링할 컴포넌트는 RouterContext이며, 이 컴포넌트는 주어진 라우터 상태에 대한 컴포넌트 트리를 렌더링하는 작업을 담당한다. 예제에서 일련의 속성들을 이 컴포넌트에 전달하는데, 모두 renderProps 객체의 필드들이다. 이 객체를 확장하기 위해, 객체의 모든 키/값 쌍들을 컴포넌트 속성으로 추출하는 JSXspread attribute 연산자를 사용한다.

### 5-3 범용 렌더링 및 라우팅

<p>
    클라이언트 측 앱(main.js)에서 history 전략을 변경해야 하는데, 클라이언트와 서버 라우팅에서 정확히 동일한 URL이 필요하기 때문에 범용 렌더링에서는 이 hashHistory 전략은 잘 통하지 않는다.
</p>

```javascript
// routes.js

const React = require('react');
const ReactRouter = require('react-router');
const Router = ReactRouter.Router;
const browserHistory = ReactRouter.browserHistory;
const routesConfig = require('./routesConfig');

class Routes extends React.Component {
    render() {
        return <Router history={browserHistory} routes={routesConfig}/>;
    }
}

module.exports = Routes;
```

<p>
    위의 코드는 앞선 예시에서 ReactRouter.browserHistory 함수를 사용하여 Router 컴포넌트에 전달하는 것으로 변경되었다.
</p>

```javascript
// server.js

...
app.use('/dist', Express.static('dist'));
...

```

<p>
    서버에서 정적 리소스로 bundle.js 파일을 클라이언트에 제공할 수 있도록 서버 측 앱을 변경한다. Express.static 미들웨어를 사용하여 특정 경로의 폴더 내용을 정적 리소스들로 노출시켰다.
</p>

### 5-4 범용 데이터 조회

<p>
    앞서 예제에서 어느 한 모듈을 일종의 데이터베이스로 사용하고 있는데 다음과 같은 이유로 사용하였다.
</p>

- 앱 상의 어디에서나 JSON 파일을 공유하고, 프론트엔드, 백엔드 및 모든 리액트 컴포넌트에서 데이터를 직접 액세스한다.
- 프론트엔드에서도 데이터에 액세스하려면, 결국 전체 데이터베이스를 프론트엔드 번들에도 넣어주어야 한다. 이는 실수로 민감한 정보가 노출될 수 있기 때문에 위험하며, 번들 파일이 데이터베이스가 커짐에 따라 커질 수 있으며, 데이터를 변경할 때마다 다시 컴파일해야 한다.

#### API 서버

```javascript
const http = require('http');
const Express = require('express');

const app = new Express();
const server = new http.Server(app);

const AUTHORS = require('./src/authors');

app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.url} from ${req.headers['user-agent']}`);
    next();
});

app.get('/authors', (req, res, next) => {
    const data = Object.keys(AUTHORS).map(id => {
        return {
            'id': id,
            'name': AUTHORS[id].name
        };
    });

    res.json(data);
});

app.get('/authors/:id', (req, res, next) => {
    if (!AUTHORS.hasOwnProperty(req.params.id)) {
        return next();
    }

    const data = AUTHORS[req.params.id];
    res.json(data);
});

server.listen(3001, (err) => {
    if (err) {
        return console.error(err);
    }
    console.info('API Server running on http://localhost:3001');
});
```

- 데이터들은 여전히 JSON 파일(src/author.js)로 모듈에 있다. 이는 단숨함을 위해 사용되었으며 예제에서는 작동하지만 실제 시나리오에서는 데이터베이스로 교체되어야 한다. 이 예제에서는 필요한 JSON 객체에서 직접 데이터에 액세스하지만 실제 어플리케이션에서는 데이터를 읽을 때 외부 데이터 소스에 쿼리를 수행할 수 있을 것이다.
- 요청을 받을 때마다, 유용한 정보를 콘솔에 인쇄하는 미들웨어를 사용한다. 나중에 이 로그가 API를 호출하는 사용자를 식별하고 전체 앱이 예상대로 작동하는지 확인하는데 도움이 될 것이다.
- 사용 가능한 모든 저자를 포함하는 JSON 배열을 반환하는 URI/authors 경로에 대한 GET 메소드를 연다. 모든 저자에 대해 id와 name이 공개된다. 여기서도 데이터베이스로 사용하는 JSON 파일에서 직접 데이터를 추출한다. 실제 시나리오에서는 데이터베이스에 대한 쿼리를 여기서 수행하는 것이 좋을 것이다.
- 또 다른 GET 메소드로 URI/authors/:id도 공개한다. 여기서 id는 데이터를 읽으려는 특정 저자의 ID를 가리키는 제너릭 플레이스 홀더(generic placeholder)이다. 지정된 ID가 유효하면 API는 저자의 이름과 책의 배열을 포함하는 객체를 반환한다.

#### 프론트엔드에 대한 프록시 요청

<p>
    앞서 만든 API는 백엔드와 프론트엔드 모두에서 액세스할 수 있어야 한다. 프론트엔드는 AJAX 요청으로 API를 호출해야 한다. 3001번 포트에서 API 서버를 실행하고 3000번 포트에서 웹 서버를 실행하면 실제로 두 개의 다른 도메인을 사용하기 때문에 브라우저에서 해당 API를 직접 호출할 수가 없다. 이를 위해선 아래의 그림과 같이 내부에 임의의 경로를 사용하여 서버를 통해 API 서버에 접근하도록 프록시를 구성해야 한다.
</p>

![1](https://user-images.githubusercontent.com/38815618/105626162-7f994a80-5e71-11eb-91d9-6c8889a58178.PNG)

#### 범용 API 클라이언트

<p>
    현재 환경에서 두 개의 서로 다른 접두사를 사용하여 API를 호출한다.
</p>

- 웹 서버에서 API를 호출할 때: http://localhost:3001
- 브라우저에서 API를 호출할 때: /api

<p>
    또한 브라우저에는 비동기 HTTP 요청을 만들 수 있는 XHR/AJAX 메커니즘만 존재하는 반면, 서버에서는 request와 같은 라이브러리 혹은 내장 http 라이브러리를 사용해야 한다는 것을 고려해야 한다. 이를 위해 axios 라이브러리를 사용한다.
</p>

```javascript
const Axios = require('axios');

const baseURL = typeof window !== 'undefined' ? '/api' : 'http://localhost:3001';
const xhrClient = Axios.create({baseURL});
module.exports = xhrClient;
```

<p>
    이 모듈에서는 기본적으로 브라우저 또는 웹 서버에서 코드를 실행 중인지 탐지하여 API 접두사를 설정하는데, 이를 위해 window 변수가 정의되어 있는지 확인한다. 그 후에 baseURL 값으로 Axios 클라이언트의 새 인스턴스를 내보낸다.
</p>

#### 비동기 React 컴포넌트

```javascript
const React = require('react');
const Link = require('react-router').Link;
const xhrClient = require('../xhrClient');

class AuthorsIndex extends React.Component {
    static loadProps(context, cb) {
        xhrClient.get('authors')
            .then(response => {
                const authors = response.data;
                cb(null, {authors});
            })
            .catch(error => cb(error))
        ;
    }

    render() {
        return (
            <div>
                <h1>List of authors</h1>
                <ul>{
                    this.props.authors.map(author =>
                        <li key={author.id}>
                            <Link to={`/author/${author.id}`}>{author.name}</Link>
                        </li>
                    )
                }</ul>
            </div>
        )
    }
}

module.exports = AuthorsIndex;
```

<p>
    새로운 버전의 모듈에서는 원시 JSON 데이터가 들어있는 이전 모듈 대신 새로운 xhrClient가 필요하다. 그 후 컴포넌트 클래스에 loadProps라는 새 메소드를 추가한다. 이 메소드는 라우터에서 전달된 컨텍스트 파라미터들을 가진 객체와 콜백 함수를 인자로 받는다. 이 메소드 내에서 컴포넌트를 초기화하는데 필요한 데이터를 조회하기 위한 모든 비동기 작업을 수행할 수 있다. 모든 것이 로드되면 콜백 함수를 호출하여 데이터를 다음으로 전파하고 라우터에 컴포넌트가 준비되었음을 알린다.
</p>

```javascript
const React = require('react');
const Link = require('react-router').Link;
const xhrClient = require('../xhrClient');

class AuthorPage extends React.Component {
    static loadProps(context, cb) {
        xhrClient.get(`authors/${context.params.id}`)
            .then(response => {
                const author = response.data;
                cb(null, {author});
            })
            .catch(error => cb(error))
        ;
    }

    render() {
        return (
            <div>
                <h2>{this.props.author.name}'s major works</h2>
                <ul className="books">{
                    this.props.author.books.map( (book, key) =>
                        <li key={key} className="book">{book}</li>
                    )
                }</ul>
                <Link to="/">Go back to index</Link>
            </div>
        );
    }
}

module.exports = AuthorPage;
```

<p>
    위의 코드는 앞선 코드와 유사하며, 차이점은 authors/:id API를 호출하고 라우터에서 전달된 context.parameters.id 변수에서 ID 파라미터를 가져온다는 것이다.
</p>

```javascript
const React = require('react');
const AsyncProps = require('async-props').default;
const ReactRouter = require('react-router');
const Router = ReactRouter.Router;
const browserHistory = ReactRouter.browserHistory;
const routesConfig = require('./routesConfig');

class Routes extends React.Component {
    render() {
        return <Router
            history={browserHistory}
            routes={routesConfig}
            render={(props) => <AsyncProps {...props}/>}
        />;
    }
}

module.exports = Routes;
```

<p>
    비동기 컴포넌트를 올바르게 로드하려면 클라이언트와 서버 모두에 대한 경로 정의를 업데이트해야 한다. 위의 코드와 앞선 코드와의 차이점은 async-props 모듈을 사용한다는 것과 이를 사용하여 라우터 컴포넌트의 render 함수를 재정의한다는 점이다. 이 접근 방식은 실제로 라우터의 렌더링 로직 내에서 비동기 모듈의 로직을 가로채 비동기 처리에 대한 지원을 가능하게 한다.
</p>

#### 웹 서버

```javascript
const http = require('http');
const Express = require('express');
const httpProxy = require('http-proxy');
const React = require('react');
const AsyncProps = require('async-props').default;
const loadPropsOnServer = require('async-props').loadPropsOnServer;
const ReactDom = require('react-dom/server');
const Router = require('react-router');
const routesConfig = require('./src/routesConfig');

const app = new Express();
const server = new http.Server(app);

const proxy = httpProxy.createProxyServer({
    target: 'http://localhost:3001'
});

app.set('view engine', 'ejs');
app.use('/dist', Express.static('dist'));
app.use('/api', (req, res) => {
    proxy.web(req, res);
});

app.get('*', (req, res) => {
    Router.match({routes: routesConfig, location: req.url}, (error, redirectLocation, renderProps) => {
        if (error) {
            res.status(500).send(error.message)
        } else if (redirectLocation) {
            res.redirect(302, redirectLocation.pathname + redirectLocation.search)
        } else if (renderProps) {
            loadPropsOnServer(renderProps, {}, (err, asyncProps, scriptTag) => {
                const markup = ReactDom.renderToString(<AsyncProps {...renderProps} {...asyncProps} />);
                res.render('index', {markup, scriptTag});
        });
        } else {
            res.status(404).send('Not found')
        }
    });
});

server.listen(3000, (err) => {
    if (err) {
        return console.error(err);
    }
    console.info('WebServer running on http://localhost:3000');
});
```

<p>
    위의 코드는 프록시 서버를 사용하여 클라이언트의 API 호출을 실제 API 서버로 리다이렉션하고 async-props 모듈을 사용하여 라우터를 렌더링하도록 웹 서버를 업데이트한다. 앞선 코드와 변경 사항은 다음과 같다.
</p>

- http-proxy와 asyncprops라는 새로운 모듈을 임포트해야 한다.
- 프록시 인스턴스를 초기화하고 /api에 일치하는 요청에 매핑하기 위한 미들웨어를 통해 웹 서버에 추가한다.
- 서버측 렌더링 로직을 일부 변경한다. 모든 비동기 데이터가 로드되었는지 확인해야 하기 때문에 renderToString 함수를 직접 호출할 수 없다. async-props 모듈인 이 목적을 위해 loadPropsOnServer 함수를 제공한다. 이 함수는 현재 일치하는 컴포넌트의 데이터를 비동기적으로 로드하는데 필요한 모든 로직을 실행한다. 로딩이 끝나면 콜백 함수가 호출되는데, 이 함수 내에서만 renderToString 메소드를 호출하는 것이 안전하다. 또한 RouterContext 대신 AsyncProps 컴포넌트를 렌더링하는데 JSX-spread 구문으로 동기 및 비동기 어트리뷰트들을 전달한다. 또 다른 중요한 사항은 콜백에서 scriptTag라는 인자도 받는다는 것이다. 이 변수에는 HTML 코드에 삽입해야 하는 일부 자바스크립트 코드가 포함된다. 이 코드에서 서버 측 렌더링 프로세스 중 로드된 비동기 데이터의 표현도 포함하고 있으므로, 브라우저가 이 데이터에 직접 액세스할 수 있어서 중복되게 API를 요청할 필요가 없다. 이 스크립트를 결과 HTML 코드에 삽입하기 위해 컴포넌트의 렌더링 프로세스에서 얻은 마크업과 함께 뷰로 전달한다.

```html
<!-- views/index.ejs -->

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>React Example - Authors archive</title>
</head>
<body>
    <div id="main">
        <%- markup -%>
    </div>
    <script src="dist/bundle.js"></script>
    <%- scriptTag %>
</body>
</html>
```

<p>
    index.ejs도 scriptTag 변수를 표시하도록 변경하면 끝이며, 실행한 뒤 localhost:3000에 접속하면 이전과는 다를 것이다.
</p>
