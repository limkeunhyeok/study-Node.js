# Swagger

![swagger](https://static1.smartbear.co/swagger/media/assets/images/swagger_logo.svg)

## 개념

> 공식문서에 따르면 `Swagger는 REST API를 설계, 빌드, 문서화 및 사용하는 데 도움이되는 OpenAPI 사양을 중심으로 구축 된 오픈 소스 도구 세트`이다.

- Open API Specification(OAS)를 위한 프레임워크
- API들이 가지고 있는 스펙을 관리할 수 있는 프로젝트/문서

## 특징

![스크린샷 2022-01-21 오후 6 09 37](https://user-images.githubusercontent.com/38815618/150499435-46931663-1ae8-40ee-8439-2dabfee5fc86.png)

- **Design**
  - Model APIs with Accuracy
  - Visualize While You Design
  - Standardize your Design Styles Across Teams
- **Build**
  - Prototype APIs From The Design
  - Generate SDKs to Increase Consumption
  - Virtualize Base Operations
- **Document**
  - Documentation From Your API Design
  - Documenting Existing APIs
  - Maintain Multiple Documentation Versions
- **Test**
  - Validate Functionality During Development
  - Automate Your API Testing
  - Generate Load Tests In One-Click
- **Standardize**
  - Standardize Design Styles Across Teams
  - Manage Different Teams and Projects
  - Collaborate With Stakeholders
  - Manage Common Models

## 기본 구조

- OpenAPI는 YAML 또는 JSON으로 작성할 수 있다.
- 모든 키워드는 대소문자를 구분한다.

```YAML
openapi: 3.0.0
info:
  title: Sample API
  description: Optional multiline or single-line description in [CommonMark](http://commonmark.org/help/) or HTML.
  version: 0.1.9
servers:
  - url: http://api.example.com/v1
    description: Optional server description, e.g. Main (production) server
  - url: http://staging-api.example.com
    description: Optional server description, e.g. Internal staging server for testing
paths:
  /users:
    get:
      summary: Returns a list of users.
      description: Optional extended description in CommonMark or HTML.
      responses:
        '200':    # status code
          description: A JSON array of user names
          content:
            application/json:
              schema: 
                type: array
                items: 
                  type: string
```

### Metadata

```YAML
openapi: 3.0.0
info:
  title: Sample API
  description: Optional multiline or single-line description in [CommonMark](http://commonmark.org/help/) or HTML.
  version: 0.1.9
```

- API 정의에는 기반이 되는 OpenAPI의 버전이 포함되어야 한다.
- title은 API의 제목이며, description은 API에 대한 확잦ㅇ 정보이다.

### Servers

```YAML
servers:
  - url: http://api.example.com/v1
    description: Optional server description, e.g. Main (production) server
  - url: http://staging-api.example.com
    description: Optional server description, e.g. Internal staging server for testing
```

- API 서버 및 기본 URL을 지정한다.
- 하나 이상의 서버를 정의할 수 있다.

### Paths

```YAML
paths:
  /users:
    get:
      summary: Returns a list of users.
      description: Optional extended description in CommonMark or HTML
      responses:
        '200':
          description: A JSON array of user names
          content:
            application/json:
              schema: 
                type: array
                items: 
                  type: string
```

- API의 개별 엔드포인트와 HTTP 메서드를 정의한다.

### Parameters

```YAML
paths:
  /users/{userId}:
    get:
      summary: Returns a user by ID.
      parameters:
        - name: userId
          in: path
          required: true
          description: Parameter description in CommonMark or HTML.
          schema:
            type : integer
            format: int64
            minimum: 1
      responses: 
        '200':
          description: OK
```

- 요청 시에 필수 또는 선택 가능한 매개변수를 정의한다.
- URL path나 query, header, cookie 등을 정의할 수 있다.

### Request Body

```YAML
paths:
  /users:
    post:
      summary: Creates a user.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  type: string
      responses: 
        '201':
          description: Created
```

- request시에 body 내용을 정의한다.

### Responses

```YAML
paths:
  /users/{userId}:
    get:
      summary: Returns a user by ID.
      parameters:
        - name: userId
          in: path
          required: true
          description: The ID of the user to return.
          schema:
            type: integer
            format: int64
            minimum: 1
      responses:
        '200':
          description: A user object.
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: integer
                    format: int64
                    example: 4
                  name:
                    type: string
                    example: Jessica Smith
        '400':
          description: The specified user ID is invalid (not a number).
        '404':
          description: A user with the specified ID was not found.
        default:
          description: Unexpected error
```

- API 작업에 대한 상태 코드 및 응답 본문을 정의한다.


### Input and Output Models

```YAML
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          example: 4
        name:
          type: string
          example: Arthur Dent
      # Both properties are required
      required:  
        - id
        - name
```

- API에서 사용되는 데이터 구조를 정의한다.
- 

### Authentication

```YAML
components:
  securitySchemes:
    BasicAuth:
      type: http
      scheme: basic
security:
  - BasicAuth: []
```

- API에서 사용되는 인증 방법을 정의한다.

## Node.js에서 사용

### install

```bash
npm i swagger-jsdoc swagger-ui-express --save-dev 
```

### options

```javascript
const swaggerUi = require("swagger-ui-express");
const swaggereJsdoc = require("swagger-jsdoc");

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Express API Server Sample",
      version: "1.0.0",
      description: "This is a express api server sample. This document provides api and schema information. This project is intended to demonstrate development skills. In actual development, it has a similar structure and style to this project, and the documentation is similar.",
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Main (production) server"
      },
      {
        url: "http://127.0.0.1:4000",
        description: "Internal starting server for testing"
      },
    ],
  },
  apis: [
    './src/swagger/api/*',
    './src/swagger/schema/*'
  ]
};

const specs = swaggereJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
```

### routing

```javascript
// ...
const { swaggerUi, specs } = require("./lib/swagger");

// ...
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// ...
```

### API definitions

> 나의 경우 swagger라는 폴더 안에 api, schema를 정의하였으며, 개별 파일로 정의하였다.

<img width="201" alt="스크린샷 2022-01-21 오후 6 54 37" src="https://user-images.githubusercontent.com/38815618/150506202-ab299613-2041-41b5-a393-591955001c85.png">

```YAML
# API 정의 예시

paths:
  /api/users/signup:
    post:
      tags:
        - user
      summary: User registration
      description: ""
      requestBody:
        required: true
        content:
          application/json:
            schema:
              properties:
                email:
                  type: string
                password:
                  type: string
                nick:
                  type: string
              required:
                - email
                - password
                - nick
      responses:
        "200":
          description: Successful operation
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  response:
                    type: boolean
                  error:
                    type: string
                    nullable: true
                    default: null
                    example: null
```

```YAML
# Schema 정의 예시

components:
  schemas:
    User:
      type: object
      required:
        - email
        - password
        - nick
      properties:
        email:
          type: string
          format: email
          description: Email for the user, needs to be unique.
        password:
          type: string
        nick:
          type: string
        createdAt:
          type: date
        updatedAt:
          type: date
      example:
        email: example@email.com
        password: $2b$10$Q6XVnrIzh8vYUxwgvBubY.XhxWokGdI0P0vCXEb7d2d7UxmCVmkIu
        nick: example
        createdAt: 2022-01-15T19:43:53.211+00:00
        updatedAt: 2022-01-15T19:43:53.211+00:00
```