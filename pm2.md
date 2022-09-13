# PM2

> PM2는 Node.js 어플리케이션을 쉽게 관리할 수 있게 해주는 Process Manager이다. Node.js 어플리케이션을 cluster mode 로 실행시킨다거나, 메모리가 넘친다거나, 오류로 인해 프로세스가 종료되는 등의 상황에 직면했을 때 각각의 상황을 사용자가 모두 신경 써서 처리해줄 수도 있지만, 너무 복잡하고 신경 써야 할 일들이 많아진다.

PM2를 이용하면 간단한 설정만으로도 이러한 처리를 손쉽게 해결할 수 있다.

## cluster mode

![cluster mode](https://armadillo-dev.github.io/assets/images/pm2-cluster-mode.png)

PM2의 cluster 모드는 Node.js의 cluster module을 이용해 기본적으로 싱글 스레드인 Node.js를 멀티 스레드로 구동시켜준다.

싱글 스레드의 경우 구동 중인 서버의 CPU 개수와 상관없이 1개만 사용할 수 있기에 서버의 성능을 제대로 끌어내지 못한다. 반면, 멀티 스레드는 최대 서버 CPU 수만큼(하이퍼스레딩을 지원한다면 x2) 프로세스를 생성해 최대 성능을 끌어낼 수 있다.

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      script: "app.js",
      instances: "max", // 실행시킬 프로세스의 갯수(max로 입력할 경우 최대 갯수로 설정한다.)
      exec_mode: "cluster", // cluster 모드로 어플리케이션을 구동시킨다.
    },
  ],
};

// ecosystem.config.js 파일은
// pm2 init & pm2 init simple로 생성할 수 있다.
```

## pm2 명령어 목록

<img width="490" alt="스크린샷 2022-09-13 오후 9 48 47" src="https://user-images.githubusercontent.com/38815618/189905376-2bc02f65-6a1c-40d4-97ec-c99642257bb5.png">

## pm2 모니터링

실행된 PM2 프로세스를 모니터링 하려면 pm2 monit 명령어를 입력하면 된다. 해당 명령어를 실행하면 아래 항목들을 실시간으로 확인할 수 있다.

- 각 프로세스의 메모리, CPU 사용률, 현재 상태
- 선택된 프로세스의 로그
- 전체 프로세스의 Heap 사이즈, 사용률
- 어플리케이션 정보

<img width="931" alt="스크린샷 2022-09-13 오후 9 52 54" src="https://user-images.githubusercontent.com/38815618/189906270-4c27f00b-9e8c-4218-8c33-b2ac776bb063.png">

### 참고

- https://pm2.keymetrics.io/
- https://velog.io/@hojin9622/PM2-%EC%A0%95%EB%A6%AC
- https://armadillo-dev.github.io/javascript/nodejs/node-js-pm2/
- https://engineering.linecorp.com/ko/blog/pm2-nodejs
