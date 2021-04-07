# MongoDB

## 1. 개요

![image](https://user-images.githubusercontent.com/38815618/113827414-3db84900-97be-11eb-8dc3-10702b254db4.png)

> 공식 홈페이지에서 MongoDB를 '모던 애플리케이션 개발자와 클라우드 시대를 위해 구축 된 범용 문서 기반 분산 데이터베이스'라고 소개한다.

- MongoDB는 유연하고 JSON과 유사한 문서에 데이터를 저장한다.
  - 필드는 문서마다 다를 수 있으며 시간에 따라 데이터 구조를 변경할 수 있다.
- 문서 모델은 응용 프로그램 코드의 객체에 매핑 되므로 데이터를 쉽게 사용할 수 있다.
- 임시 쿼리, 인덱싱 및 실시간 집계는 데이터에 액세스하고 분석하는 강력한 방법을 제공한다.
- MongoDB는 기본적으로 분산 데이터베이스이므로 고가용성, 수평 확장 및 지리적 분포가 내장되어 있고 사용하기 쉽다.

## 2. MySQL vs MongoDB

|MySQL|MongoDB|
|:---:|:---:|
|규칙에 맞는 데이터 입력|자유로운 데이터 입력|
|테이블 간 JOIN 지원|컬렉션 간 JOIN 미지원|
|안정성, 일관성|확장성, 가용성|
|용어(테이블, 로우, 컬럼)|용어(컬렉션, 다큐먼트, 필드)|

- 몽고디비에는 고정된 테이블이 없다.
  - 테이블에 상응하는 컬렉션이라는 개념이 있긴 하지만, 컬럼을 따로 정의하지 않는다.
  - 스키마 프리: 사용할 컬럼을 미리 정의하지 않고 언제든지 동적으로 필요한 시점에 데이터를 저장할 수 있다는 것을 의미한다.
- 몽고디비에는 JOIN 기능이 없다.
  - JOIN을 흉내낼 수는 있지만, 하나의 쿼리로 여러 테이블을 합치는 작업이 항상 가능하지는 않으며, 동시에 쿼리를 수행하는 경우 쿼리가 섞여 예상치 못한 결과를 낼 가능성이 있다.
- 몽고디비는 데이터의 일관성을 보장해주는 기능이 약한 대신, 데이터를 빠르게 넣을 수 있고 쉽게 여러 서버에 데이터를 분산할 수 있다.
- 애플리케이션을 만들 때 꼭 한 가지 데이터베이스만 사용해야 하는 것은 아니며, SQL과 NoSQL은 서로 다른 특징을 가지므로 알맞은 곳에 사용하면 됩니다.
- 어떤 데이터베이스를 사용해야 하는 가에 대한 참고 자료: <https://siyoon210.tistory.com/130>

## 3. 용어 비교

|MySQL 용어|MongoDB 용어/개념|
|:---:|:---:|
|database|database|
|table|collection|
|index|index|
|row|JSON document|
|column|JSON field|
|join|embedding and linking|
|primary key|_id field|
|group by|aggregation|

## 4. 구문 비교

|SQL 구문|mongoDB 구문|
|:---:|:---:|
|CREATE TABLE USERS(a Number, b Number)|db.createCollection("mycoll")|
|INSERT INTO USERS VALUES(3, 5)|db.users.insert({a:3, b:5})|
|SELECT * FROM users|db.users.find()|
|SELECT a,b FROM users WHERE age=20|db.users.find({age:20}, {a:1, b:1})|
|SELECT *FROM users WHERE age=20 ORDER BY name|db.users.find({age:20}).sort({name:1})|

## 5. MongoDB 시작하기

```zsh
# 몽고디비 실행
>> mongo
connecting to: mongodb://127.0.0.1:27017/?compressors=disabled&gssapiServiceName=mongodb
Implicit session: session { "id" : UUID("b98e0d5f-7a1f-4ab1-ab5d-bc48f1d8d280") }
MongoDB server version: 4.4.3
>

# 또는 권한 있는 유저 실행
# 권한 있는 유저가 아니면 사용할 수 없는 듯
>> mongo -u user -p password
MongoDB shell version v4.4.3
connecting to: mongodb://127.0.0.1:27017/?compressors=disabled&gssapiServiceName=mongodb
Implicit session: session { "id" : UUID("8f993953-6198-4f45-b6f6-850932140916") }
MongoDB server version: 4.4.3
---
The server generated these startup warnings when booting: 
        2021-04-06T19:08:41.349+09:00: Soft rlimits too low
        2021-04-06T19:08:41.349+09:00:         currentValue: 256
        2021-04-06T19:08:41.349+09:00:         recommendedMinimum: 64000
---
---
        Enable MongoDBs free cloud-based monitoring service, which will then receive and display
        metrics about your deployment (disk utilization, CPU, operation statistics, etc).

        The monitoring data will be available on a MongoDB website with a unique URL accessible to you
        and anyone you share the URL with. MongoDB may use this information to make product
        improvements and to suggest MongoDB products and deployment options to you.

        To enable free monitoring, run the following command: db.enableFreeMonitoring()
        To permanently disable this reminder, run the following command: db.disableFreeMonitoring()
---
>
```

```bash
# 데이터베이스 생성
# use [데이터베이스 명]
> use nodejs
switched to db nodejs
```

```bash
# 데이터베이스 목록 확인
> show dbs
admin 0.000GB
config 0.000GB
local 0.000GB

# 현재 사용 중인 데이터베이스 확인
> db
nodejs
```

- 컬렉션은 따로 생성하지 않아도, 다큐먼트를 넣는 순간 컬렉션도 자동으로 생성된다.
- 하지만 직접 컬렉션을 생성하는 명령어가 있다.

```bash
# 컬렉션 생성
> db.createCollection('users')
{ "ok" : 1 }

> db.createCollection('comments')
{ "ok" : 1 }

# 컬렉션 목록 확인
> show collections
comments
users
```

### Create

- 기본적으로 몽고디비는 자바스크립트 문법을 사용하므로 자바스크립트의 자료형을 따른다.
  - Binary Data, ObjectId, Int, Long, Decimal, Timestamp, JavaScript 등의 추가적인 자료형이 있으며, Undefined와 Symbol은 몽고디비에서 자료형으로 사용하지 않는다.

```bash
# db.컬렉션명.save(다큐먼트)
> db.users.save({name: 'Zero', age: 24, married: false, comment: 'Test Comment', createdAt: new Date()});
WriteResult({ "nInserted" : 1 })

> db.users.save({name: 'Nero', age: 32, married: true, comment: 'Test Comment2', createdAt: new Date()});
WriteResult({ "nInserted" : 1 })
```

### Read

```bash
# 전체 조회
# db.컬렉션명.find() 또는 db.컬렉션명.find({})
> db.users.find({})
{ "_id" : ObjectId("606c848ab713656635f56e20"), "name" : "Zero", "age" : 24, "married" : false, "comment" : "Test Comment", "createdAt" : ISODate("2021-04-06T15:55:54.578Z") }
{ "_id" : ObjectId("606c84b4b713656635f56e21"), "name" : "Nero", "age" : 32, "married" : true, "comment" : "Test Comment2", "createdAt" : ISODate("2021-04-06T15:56:36.870Z") }
```

- 특정 필드만 조회하려면 find() 메서드의 두 번째 인수로 조회할 필드를 넣는다.
  - _id 값은 기본적으로 가져오게 되어 있으며, 이를 생략하려면 '_id: 0' 또는 '_id: false'을 인수로 넣는다.

```bash
# 특정 필드만 조회
# db.컬렉션명.find({}, {조회할 필드명: 1}) 또는 db.컬렉션명.find({}, {조회할 필드명: true})
# 조회하지 않는 필드는 생략하면 되며, 0 또는 false를 작성하면 오류가 발생(_id값 제외)
> db.users.find({}, {_id: 0, name:1, age: 1, comment:1})
{ "name" : "Zero", "age" : 24, "comment" : "Test Comment" }
{ "name" : "Nero", "age" : 32, "comment" : "Test Comment2" }
```

- 특정 조건에 맞는 다큐먼트를 조회하려면 첫 번째 인수에 조건을 넣는다.
  - 자주 쓰이는 연산자로는 $gt(초과), $gte(이상), $lt(미만), $lte(이하), $ne(같지 않음), $or(또는), $in(배열 요소 중 하나) 등이 있다.

```bash
# 특정 조건에 맞는 다큐먼트 조회
# db.컬렉션명.find({필드명:{조건}})
# 아래의 의미는 users 컬렉션에서 age가 30 이상인 다큐먼트의 name, age, comment 필드만 가져와 주세요
> db.users.find({age:{$gt:30}}, {_id:0, name:1, age:1, comment:1})
{ "name" : "Nero", "age" : 32, "comment" : "Test Comment2" }
```

- 몽고디비에서 OR 연산은 $or를 사용한다.
  - $or에 주어진 배열 안의 조건들을 하나라도 만족하는 다큐먼트를 모두 찾는다.

```bash
# 여러 조건에 맞는 다큐먼트 조회
# db.컬렉션명.find({$or: [{필드명:{조건},}]})
# 아래의 의미는 users 컬렉션에서 age가 30 이상이거나 married가 false인 다큐먼트의 name, age 필드만 가져와 주세요
> db.users.find({ $or: [{ age: { $gt: 30 } }, { married: false }] }, { _id: 0, name: 1, age: 1})
{ "name" : "Zero", "age" : 24 }
{ "name" : "Nero", "age" : 32 }
```

- 조회한 다큐먼트의 정렬은 sort()를 사용한다.
  - -1은 내림차순, 1은 오름차순을 의미한다.

```bash
# 특정 필드 기준으로 다큐먼트 정렬
# db.users.find().sort({기준 필드: -1 또는 1})
# 아래의 의미는 users 컬렉션에서 age를 기준 내림차순 정렬한 다큐먼트의 name, age 필드만 가져와 주세요
> db.users.find({}, {_id:0, name:1, age:1}).sort({age: -1})
{ "name" : "Nero", "age" : 32 }
{ "name" : "Zero", "age" : 24 }
```

- 그외 메서드는 <https://docs.mongodb.com/manual/reference/method/db.collection.find/#mongodb-method-db.collection.find> 참고

### Update

```bash
# 특정 필드 수정
# db.컬렉션명.update({수정할 다큐먼트의 정보}, $set:{수정할 내용})
> db.users.update({name: 'Nero'}, {$set: {comment: 'Test Update'}})
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
```

- $set은 어떤 필드를 수정할지 정하는 연산자로, 이를 사용하지 않는다면 다큐먼트가 모두 변경된다.
- 수정에 성공하면 첫 번째 객체에 해당하는 다큐먼트 수(nMatched)와 수정된 다큐먼트 수(nModified)가 나온다.

### Delete

```bash
# 특정 다큐먼트 삭제
# db.컬렉션명.remove({삭제할 다큐먼트의 정보})
> db.users.remove({name: 'Nero'})
WriteResult({ "nRemoved" : 1 })
```

## 6. Mongoose

- mongoose란 mongoDB 데이터베이스를 지원하는 노드의 확장 모듈이다.
- mongoose는 기능이 추가되어 다양한 기능들로 편의성을 높였으나, 속도는 조금 떨어진다.
- mongoose는 ODM(Object Document Mapping)라고도 불린다.
- mongoose는 데이터를 만들고 관리하기 위하여 스키마(Schema)를 만들고, 그 스키마로 모델(Model)을 만든다.
  - 몽고디비는 테이블이 없어서 자유롭게 데이터를 넣을 수 있어 다큐먼트 간 필드가 다를 수도 있으며, mongoose는 몽고디비에 데이터를 넣기 전에 데이터를 필터링하는 역할을 한다.
  - mongoose는 그러한 mongoDB의 구성 철학에 따른 장점을 그대로 가져와, 스키마와 모델을 만드는 것을 통하여 data를 불러온 후에 그 데이터를 객체화시켜 빠르게 수정함으로써 데이터에 접근할 수 있게 해준다.

### 몽고디비 연결

- 몽고디비는 주소를 사용해 연결하며, 주소 형식은 'mongodb://[username:password@]host[:port][/[database][?options]]'이다.
  - [] 부분은 생략 가능하다.

```javascript
const mongoose = require('mongoose');
await mongoose.connect('mongodb://localhost/my_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
});
```

### 모델 정의하기

```javascript
// 스키마 정의
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const BlogPost = new Schema({
  author: ObjectId,
  title: String,
  body: String,
  date: Date
});

// 모델 정의
const BlogPostModel = mongoose.model('BlogPost', BlogPost);
```

- 몽구스는 '_id' 필드를 기본 키로 생성하므로, '_id' 필드를 따로 작성할 필요가 없다.
- 정의한 모델은 앞선 몽고디비와 사용법이 비슷하며, <https://mongoosejs.com/docs/queries.html>를 참고
