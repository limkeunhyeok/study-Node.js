# ESLint

## 1. 개요

![1](https://user-images.githubusercontent.com/38815618/111063924-96186580-84f4-11eb-8d83-27036d040cec.jpg)

> 공식 홈페이지에서 ESLint를 'Find and fix problems in your JavaScript code'라고 소개하며, Find Problems, Fix Automatically, Customize가 가능하다.

### ES + Lint

- ES: ECMAScript
- Lint: 보푸라기
- 옷에 보푸라기가 많으면 보기 좋지 않은데, 코드에서도 보푸라기가 있다(ex: 들여쓰기가 맞지 않거나 선언한 변수를 사용하지 않는 등).
- 보푸라기가 많은 코드는 가독성이 떨어지고, 유지보수도 어려워진다.
- 코드의 오류나 버그, 스타일 따위를 점검하는 것을 Lint 또는 Linter라고 부른다.

### 개념

- ECMAScript 코드에서 문제점을 검사하고 일부는 더 나은 코드로 정정하는 린트 도구 중의 하나이다.
- 코드의 가독성을 높이고 잠재적인 오류와 버그를 제거해 단단한 코드를 만드는 것이 목적이다.
- 코드에서 검사하는 항목은 크게 포맷팅과 코드 품질이다.
    - 포맷팅: 일관된 코드 스타일을 유지하도록 하고 개발자로 하여금 쉽게 읽히는 코드를 만들어 준다(ex: 들여쓰기 규칙).
    - 코드 품질: 어플리케이션의 잠재적인 오류나 버그를 예방하기 위함이다(ex: 글로벌 스코프 사용 자제).

## 2. 설치 및 사용

### 설치

```bash
# ESLint 설치
npm install eslint --save-dev

# 설정 파일 생성
npx eslint --init

# 해당 코드 검사
npx eslint yourfile.js
```

### Configuring ESLint

- 공식 홈페이지 자료: https://eslint.org/docs/user-guide/configuring/
- ESLint는 use case에 맞게 유연하고 구성 할 수 있도록 설계되었다.
- 기본 구문 유효성 검사로만 실행하거나 번들 규칙과 사용자 지정 규칙을 혼합하여 프로젝트 요구 사항에 맞출 수 있다.
- ESLint를 구성하는 두 가지 방식
    - Configuration Comments: 자바스크립트 주석을 사용하여 구성 정보를 파일에 직접 포함한다.
    - Configuration Files: 자바스크립트, JSON 또는 YAML 파일을 사용하여 전체 디렉터리 및 모든 하위 디렉터리에 대한 구성 정보를 지정한다.

```JSON
{
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true
    },
    "extends": [
        "airbnb-base"
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "plugins": [
        
    ],
    "rules": {
    }
}
```

- **env**: 프로젝트가 실행되도록 설계된 환경
- **globals**: 프로젝트가 실행 중에 접근하는 추가 전역 변수
- **rules**: 규칙 및 오류 수준
- **plugins**: ESLint가 사용할 추가 규칙, 환경, 구성 등을 정의하는 타사 플러그인
- **extends**: 확장 설정, 미리 정해 놓은 규칙
    - airbnb 스타일 가이드: https://github.com/airbnb/javascript
    - 제공 패키지: https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb-base

### rules

- 공식 홈페이지 자료: https://eslint.org/docs/rules/
- 규칙 설정 값
    - off 또는 0: 끔
    - warn 또는 1: 경고
    - error 또는 2: 오류
- 일부 오류는 --fix 옵션을 통해 자동으로 수정한다.

## 3. Prettier

![2](https://user-images.githubusercontent.com/38815618/111063922-94e73880-84f4-11eb-93d1-43c48b05b45d.jpg)

> 공식 홈페이지에서 Prettier를 독보적인 코드 포맷터로, 다양한 언어를 지원하며 대부분의 에디터와 통합되고 옵션이 적다고 소개한다.

- 프리티어는 코드를 "더" 예쁘게 만든다.
- ESLint의 역할 중 포매팅과 겹치는 부분이 있지만 프리티터는 좀 더 일관적인 스타일로 코드를 다듬는다.

### 설치 및 사용

```bash
# Prettier 설치
npm install prettier --save-dev

# 해당 코드 검사, --write 옵션은 파일을 재작성
npx prettier yourfile.js
```

- 프리티어는 ESLint와 달리 규칙이 미리 세팅되어 있기 때문에 설정 없이도 바로 사용할 수 있다.

### 통합

- 포맷팅은 프리티어에게 맡기더라도 코드 품질과 관련된 검사는 ESLint의 몫이기 때문에, 이 둘을 같이 사용하는 것이 최선이다.
- eslint-config-prettier는 프리티어와 충돌하는 ESLint 규칙을 끄는 역할을 한다.
    - 참고: https://github.com/prettier/eslint-config-prettier
- eslint-plugin-prettier는 프리티어 규칙을 ESLint 규칙으로 추가하는 플러그인이다.
- 프리티어의 모든 규칙이 ESLint로 들어오기 때문에 ESLint만 실행하면 된다.
    - 참고: https://github.com/prettier/eslint-plugin-prettier

## 4. 자동화

- 린트는 코딩할 때마다 수시로 실행해야 하기 때문에 자동화를 하는 것이 좋다.

### 에디터 확장 도구

- vs-code의 eslint와 prettier 익스텐션은 코딩할 때 실시간으로 검사해준다.
- 참고: https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint
