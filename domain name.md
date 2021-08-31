# what is a domain name

## 개념

- 숫자로 이루어진 IP 주소를 사람이 읽을 수 있는 주소로 변환시킨 것을 말한다.
- 도메인 이름은 도메인 등록 기관에서 관리하며, 현재 등록된 도메인 이름은 약 3억 개 이상이다.
- URL은 도메인 이름과 전송 프로토콜 및 경로를 포함한 기타 정보가 포함된다.
  - ex) https://example.com/post에서 https는 프로토콜, example.com은 도메인 이름, /post는 특정 페이지의 경로이다.

## 도메인 네임 구조

![structure](https://user-images.githubusercontent.com/38815618/131430712-517d9a59-3f36-44a3-8008-5827e41a489c.png)

- TLD(Top-Level Domain)
  - 사용자에게 도메인 이름 뒤에 있는 서버스의 일반적인 목적을 알려준다.
- Label
  - TLD 다음에 온다.
  - TLD 바로 앞에 위치한 label을 SLD(Secondary Level Domain)이라고 한다.
  - 도메인에는 여러 label이 있을 수 있다.

## DNS Request

![2014-10-dns-request2](https://user-images.githubusercontent.com/38815618/131432463-aee49663-a317-47b7-84f9-003561ea7f88.png)

1. 브라우저의 위치 표시줄에 mozilla.org를 입력한다.
2. 브라우저는 도메인 이름에 매치되는 IP 주소를 알고 있는지 컴퓨터에 묻는다(로컬 DNS 캐시 사용).
3. 만일 알지 못하면, DNS 서버에 요청한다. DNS 서버는 도메인 이름과 일치되는 IP 주소를 알려준다.
4. 컴퓨터는 IP 주소를 알고 있으므로 브라우저는 웹 서버와 콘텐츠를 협상할 수 있다.
