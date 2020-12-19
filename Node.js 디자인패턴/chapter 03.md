# Chapter 03 - 콜백을 사용한 비동기 제어 흐름 패턴

## 1. 비동기 프로그래밍의 어려움

### 1-1 간단한 웹 스파이더 만들기

- 웹 URL을 입력으로 받아, 해당 URL의 내용을 로컬 파일로 다운로드하는 콘솔용 어플리케이션인 간단한 웹 스파이더 구현
- npm 라이브러리
  - request: HTTP 호출을 간소화하는 라이브러리
  - mkdirp: 재귀적으로 디렉터리를 만드는 단순한 유틸리티

```javascript
'use strict';

const request = require('request');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const utilities = require('./utilities');

function spider(url, callback) {
    const filename = utilities.urlToFilename(url);
    fs.exists(filename, exists => { // 1.
        if (!exists) {
            console.log(`Downloading ${url}`);
            request(url, (err, response, body) => { // 2.
                if (err) {
                    callback(err);
                } else {
                    mkdirp(path.dirname(filename), err => { // 3.
                        if (err) {
                            callback(err);
                        } else {
                            fs.writeFile(filename, body, err => { // 4.
                                if (err) {
                                    callback(err);
                                } else {
                                    callback(null, filename, true);
                                }
                            });
                        }
                    });
                }
            });
        } else {
            callback(null, filename, false)
        }
    });
}

spider(process.argv[2], (err, filename, downloaded) => {
    if (err) {
        console.log(err);
    } else if (downloaded) {
        console.log(`Completed the download of "${filename}"`);
    } else {
        console.log(`"${filename}" was already downloaded`);
    }
});
```

1. 해당 파일이 이미 생성되어 있는지 확인하여 해당 URL이 이미 다운로드 되었는지를 검사한다.
2. 파일을 찾을 수 없는 경우 URL은 request를 통해 다운로드된다.
3. 파일을 저장할 디렉터리가 있는지 확인한다.
   - mkdirp는 버전 1.0.0 이후로 콜백을 사용하지 않으며, 해당 예제에서는 0.5.1을 사용하였다.
4. HTTP 응답의 내용을 파일 시스템에 쓴다.

<p>
    해당 어플리케이션은 `node spider.js http://www.example.com` 명령어를 통해 실행이 가능하며, 해당 페이지의 내용을 로드한다.
</p>

### 1-2 콜백 헬(The Callback hell)

<p>
    앞선 코드처럼 많은 클로저와 내부 콜백 정의가 코드를 읽을 수 없고 관리할 수 없는 덩어리로 만드는 상황을 콜백 헬이라고 하며, 심각한 안티 패턴 중 하나이다. 이런 식으로 작성된 코드는 깊은 중첩으로 인해 피라미드 같은 모양을 취해서 죽음의 피라미드(pyramid of doom)라고도 한다. 이런 코드의 문제는 가독성이다. 또한 각 스코프에서 사용된 변수의 이름이 중복된다는 점이다. 또한 클로저가 성능 및 메모리 소비 면에서 비용이 적게 들며, 활성 클로저가 참조하는 컨텍스트가 가비지 수집 시 유지되어 식별하기 쉽지 않은 메모리 누수가 발생할 수 있다.
</p>
