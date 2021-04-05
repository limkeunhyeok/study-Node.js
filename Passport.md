# Passport.js

## 1. 개요

![image](https://user-images.githubusercontent.com/38815618/113546903-e1232580-9627-11eb-872e-053d04126046.png)

> 공식 홈페이지에서 Passport를 'Node.js를 위한 간단한 인증 미들웨어로, 500개 이상의 전략을 지원한다'며 소개한다.

- Passport란 Node.js의 인증 미들웨어이다.
  - 여권이 소지자가 입출국 자격에 대해 인증하는 역할을 하는 것처럼, 클라이언트가 서버에 요청할 자격이 있는지 인증할 때에 passport 미들웨어를 사용한다.
- Passport는 google이나 facebook 등 OAuth를 제공한다.
- 웹 어플리케이션에서 인증을 구현하기 위한 방법으로 세션과 쿠키를 주로 사용한다.
  1. 서버: 접속한 브라우져 정보를 세션에 저장, 세션 아이디를 브라우져에게 쿠키로 전달한다.
  2. 브라우져: 쿠키에 담긴 세션 아이디를 저장, 다음 요청부터는 헤더에 세션 아이디를 담아 서버로 전송한다.
  3. 서버: 이 값을 가지고 이전에 접속한 브라우져임을 식별할 수 있다.

## 2. Strategies

- 공통의 인증 로직은 Passport가 담당하고 구체적인 방법은 전략이라는 개념으로 분리하여 요청을 인증한다.
  - 전략 패턴(strategy pattern)은 소프트웨어 디자인 패턴 중 하나로, 특정 컨텍스트에서 알고리즘을 별도로 분리하는 설계 방법을 의미한다. 
- 전략은 사용자 이름 및 비밀번호 자격 증명 확인, OAuth를 사용한 위임된 인증 또는 OpenID를 사용한 연합 인증까지 다양하다.
- 인증을 하려면 먼저 전략을 구성해야 한다.

```javascript
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (!user.verifyPassword(password)) { return done(null, false); }
      return done(null, user);
    });
  }
));
```

## 3. Session

- Passport는 로그인 세션을 지속적으로 유지한다.
- 영구 세션이 작동하려면 인증된 사용자를 세션에 직렬화하고 후속 요청이있을때 역직렬화해야 한다.
- serialize(직렬화)
  - 어떤 데이터를 다른 곳에서 사용할 수 있게 다른 포맷의 데이터로 바꾸는 것을 의미한다.
  - Passport에서는 시퀄라이즈 객체를 세션에 저장할 수 있는 데이터로 바꾼다.
- deserialize(역직렬화)
  - 다른 포맷의 데이터로 바뀐 데이터를 원래 포맷으로 복구하는 것이다.
  - Passport에서는 세션에 저장된 데이터를 다시 시퀄라이즈 객체로 바꾸는 작업을 의미한다.

```javascript
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
 
passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
```
