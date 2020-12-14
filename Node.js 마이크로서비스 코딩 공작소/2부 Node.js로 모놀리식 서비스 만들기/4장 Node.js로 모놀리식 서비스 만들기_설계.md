# 2부 Node.js로 모놀리식 서비스 만들기

## 4장 Node.js로 모놀리식 서비스 만들기: 설계

### 1. 요구 사항 정의

![1](https://user-images.githubusercontent.com/38815618/97281613-12c9e080-1881-11eb-9f6c-e78473631187.PNG)

- 상품 관리, 회원 관리, 구매 관리 기능의 API를 제공한다.
- 형식은 REST API로 제공한다.
- 상품 관리에는 세 가지 기능을 제공한다.
  - 상품 등록
  - 상품 조회
  - 상품 삭제
- 상품 정보는 '상품명', '상품 카테고리', '가격', '상품 설명'으로 구성한다.
- 상품 조회는 모든 상품을 조회한다.
- 회원 관리에는 세 가지 기능을 제공한다.
  - 회원 등록
  - 회원 인증
  - 회원 탈퇴
- 회원 정보는 '사용자명'과 '패스워드'로 구성한다.
- 구매 관리에는 두 가지 기능을 제공한다.
  - 구매
  - 구매 내역 조회
- 구매 정보는 '사용자 정보', '상품 정보', '구매 일자'로 구성한다.

### 2. 시스템 구성 설계

![2](https://user-images.githubusercontent.com/38815618/97281615-12c9e080-1881-11eb-8fa0-cab6b74dd9a3.PNG)

### 3. REST API 설계

#### 3-1 상품 관리 REST API

![3](https://user-images.githubusercontent.com/38815618/97281617-13627700-1881-11eb-9907-d5f5d5d86bd4.PNG)

![4](https://user-images.githubusercontent.com/38815618/97281618-13627700-1881-11eb-9150-36f02311b702.PNG)

#### 3-2 회원 관리 REST API

![5](https://user-images.githubusercontent.com/38815618/97281619-13fb0d80-1881-11eb-8895-eda09febac7f.PNG)

![6](https://user-images.githubusercontent.com/38815618/97281620-1493a400-1881-11eb-9e67-405a92d67d31.PNG)

#### 3-3 구매 관리 REST API

![7](https://user-images.githubusercontent.com/38815618/97281622-1493a400-1881-11eb-9656-d15c8e5488d3.PNG)

![8](https://user-images.githubusercontent.com/38815618/97281611-1198b380-1881-11eb-83d4-78486cd7fff8.PNG)

### 4. 데이터베이스 설계

- 교재에서는 MariaDB를 사용하나, MySQL을 이용해 구현

```SQL
-- 데이터베이스 생성
CREATE DATABASE monolithic;

-- 해당 데이터베이스로 이동
USE monolithic;
```

#### 4-1 상품 관리 테이블 설계

```SQL
CREATE TABLE IF NOT EXISTS `goods` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(128) NOT NULL,
    `category` varchar(128) NOT NULL,
    `price` int NOT NULL,
    `description` text NOT NULL,
    PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

#### 4-2 회원 관리 테이블 설계

```SQL
CREATE TABLE IF NOT EXISTS `members` (
    `id` int NOT NULL AUTO_INCREMENT,
    `username` varchar(128) NOT NULL,
    `password` varchar(128) NOT NULL,
    PRIMARY KEY(`id`),
    UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

#### 4-3 구매 관리 테이블 설계

```SQL
CREATE TABLE IF NOT EXISTS `purchases` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `userId` int NOT NULL,
    `goodsId` int NOT NULL,
    `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

#### 4-4 권한 설정

- 모든 권한을 가진 root 계정을 사용하는 것은 보안상 위험

```SQL
-- micro 계정 생성
create user 'micro'@'%' identified with mysql_native_password by '비번';

-- 해당 계정이 monolithic에서만 권한을 설정
 grant all privileges on monolithic.* to 'micro'@'%';

-- 설정한 권한을 반영
flush privileges;

-- 계정 확인
SELECT host, user, authentication_string FROM user
WHERE user ='micro';

-- 권한 확인
SHOW GRANTS FOR 'micro'@'%';
```
