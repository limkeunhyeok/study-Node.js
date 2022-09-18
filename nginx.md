# Nginx

## 1. 개요

> Nginx란 이고르 시쇼브(Igor Sysoev)라는 러시아 개발자가 개발한 동시접속 처리에 특화된 웹 서버 프로그램이다. 아파치보다 동작이 단순하고 전달자 역할만 하기 때문에 동시접속 처리에 특화되어 있다.

- Web Server: 단순히 정적 파일 응답
- Web Application Server(WAS): 클라이언트 요청에 대해 동적 처리가 이뤄진 후 응답

### Web Server

초기 웹 서비스는 대부분 정보 전달이 목적인 문서 위주의 정적 페이지였다. 그렇기 때문에 마크업 언어로 작성된 문서를 서버에서 보내주기만 하면 됐다.

하지만 SPA(Single Page Application)라는 개념이 등장하면서 서버가 분리될 필요성이 생겼다. SPA는 기존의 웹 페이지와는 달리 페이지 갱신에 필요한 데이터만을 전달받아 페이지를 갱신한다. 이때 필요한 데이터는 사용자마다 달라졌고, 복잡한 연산이 필요하기도 하였다.

만약 웹 페이지에 필요한 정적 데이터와 페이지 갱신에 필요한 동적 데이터를 하나의 서버에서 처리한다면, 부하가 커지게 되고 처리가 지연됨에 따라 수행 속도가 느려진다. 이에 Web Server와 WAS 같은 개념이 생겨났다.

Web Server는 클라이언트의 요청을 처리하는 기능을 담당하고, WAS는 DB 조회나 다양한 로직를 처리하는 기능을 담당한다. Nginx는 Web Server의 구축을 도와주는 소프트웨어이다.

### 배경

![apache http server](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FozjFo%2FbtrtXr81A0M%2FvkeZHNvWv4hmeJOYtnFBIk%2Fimg.jpg)

아파치 서버는 요청이 들어오면 커넥션을 형성하기 위해 프로세스를 생성한다. 즉, 새로운 요청이 들어올 때마다 프로세스를 새로 만든다. 프로세스를 만드는 것이 시간이 걸리는 작업이다 보니 요청이 들어오기 전에 프로세스를 미리 만들어 놓는 PREFORK 방식을 사용했다. 그래서 새로운 클라이언트 요청이 들어오면 미리 만들어 놓은 프로세스를 가져다 사용했다. 만약 만들어 놓은 프로세스가 모두 할당되면 추가로 프로세스를 만들었다. 이런 구조는 개발하기 쉽다는 장점이 있었다.(확장성)

![확장성](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FcpSFRJ%2FbtrtWuSslbH%2FJdou81VOGQofCbiXfobg90%2Fimg.jpg)

덕분에 개발자는 다양한 모듈을 만들어서 서버에 빠르게 기능을 추가할 수 있었다. 이런 식으로 아파치 서버는 동적 컨텐츠를 처리할수 있게 되었다. 확장성이 좋다는 장점 덕분에 요청을 받고 응답을 처리하는 과정을 하나의 서버에서 해결하기 좋았다.

![트래픽 문제](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FbHE7RA%2FbtrtIPw8h6a%2FPdhSFNOm4QLKLHNssiDkH1%2Fimg.jpg)

1999년부터는 서버 트래픽량이 높아져서 서버에 동시 연결된 커넥션이 많아졌을 때 더 이상 커넥션을 형성하지 못하는 문제가 생겼다. 이를 C10K 문제(Connection 10000 Problem)라고 한다. 아파치 서버는 다음과 같은 문제점이 있었다.

- 프로세스를 할당하기에 메모리 부족으로 이어진다.
- 확장성이라는 장점이 프로세스의 리소스 양을 늘려서 무거운 프로그램이 된다.
- 많은 커넥션에서 요청이 들어오면 CPU 부하가 높아진다. (컨텍스트 스위칭을 많이함)

즉, 수많은 동시 커넥션을 감당하기엔 아파치 서버의 구조가 적합하지 않았다.

![Nginx + Apache](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FoGKo0%2FbtrtWu53ma4%2FoFQc0eJrMzikKXAn28rnq1%2Fimg.jpg)

이렇게 시간이 흐르고 2004년에 새로운 구조를 채택하면서 아파치 서버를 보완하기 위한 소프트웨어가 나왔는데 이것이 NGINX 이다. 초창기에는 아파치 서버와 Nginx는 함께 사용하기 위해 만들어졌다. 수많은 동시 커넥션을 Nginx가 유지하고, 웹서버이기에 정적 파일에 대한 요청은 스스로 처리하여 아파치 서버의 부하를 줄였다. 웹 서버 역할의 Nginx는 클라이언트로부터 동적 파일 요청을 받았을 때만 뒤에 있는 아파치 서버와 커넥션을 형성했다.

## 2. 구조

### Apache

![thread 방식](https://velog.velcdn.com/images%2Fjiselectric%2Fpost%2F405e07de-590b-43b2-9851-3d868cef05ae%2FR1280x0.png)

아파치 서버는 클라이언트로부터 요청마다 프로세스, 스레드가 처리하는 구조로 Prework, Worker 두 가지 방식이 있다.

멀티 프로세스 방식인 Prework 방식은 1개의 자식 프로세스 당 1개의 스레드를 가지는 구조로 1개의 요청이 들어오면 독립적인 메모리 공간을 가지는 1개의 자식 프로세스가 생성된다.

멀티 프로세스 + 멀티 스레드 방식인 Worker 방식은 1개의 자식 프로세스가 여러 개의 스레드를 가지며 하나의 스레드에서 하나의 요청을 처리하는 방식으로 동작한다.

이러한 구조로 요청이 많아질수록 프로세스, 스레드를 생성해서 메모리 & CPU 등 소모가 많아지는 문제가 발생한다. 대략 동시 접속자 수가 만 명 이상이 되면 문제가 발생한다고 한다.

### Nginx

![event-driven programming](https://velog.velcdn.com/images%2Fjiselectric%2Fpost%2Ff971840a-0019-4b1e-8106-4b5c83364278%2FR1280x0-2.png)

Nginx는 멀티 프로세스 싱글 스레드 방식으로 동작한다. 비동기 이벤트 방식으로 동작해서 더 작은 메모리로 운영할 수 있다.

아파치처럼 요청이 들어올 때마다 프로세스, 스레드를 생성하지 않고 N개의 고정된 프로세스로 처리하기 때문에 프로세스, 스레드에 대한 생성 및 제거 비용이 들지 않는다.

## 3. 역할

### 정적 파일을 처리하는 처리하는 HTTP 서버로서의 역할

HTML, CSS, JS 이미지와 같은 정보를 웹 브라우저에 전송하는 역할을 한다.

### 리버스 프록시로서의 역할

클라이언트는 가짜 서버에 요청을 하면 프록시 서버가 배후 서버로부터 데이터를 가져오는 역할을 한다. 클라이언트는 리버스 프록시 서버를 호출하기 때문에 실제 서버의 IP를 감출 수 있고, 이를 통해 보안을 높일 수 있다.

### 로드 밸런싱 역할

요청이 많을 때, 하나의 서버에서 이를 모두 처리하는 것이 아니라 여러 대의 서버를 이용하여 요청을 처리한다. 하나의 서버가 멈추더라도 서비스 중단 없이 다른 서버가 서비스를 계속 유지할 수 있는 무중단 배포가 가능하다.

## 참고

- https://ssdragon.tistory.com/60
- https://whatisthenext.tistory.com/123
- https://tecoble.techcourse.co.kr/post/2021-07-30-web-server-and-nginx/
- https://willseungh0.tistory.com/137
- https://velog.io/@jiselectric/Apache-NginX
