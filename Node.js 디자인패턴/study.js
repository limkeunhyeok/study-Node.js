process.on('uncaughtException', (err) => {
    console.error('This will catch at last the JSON parsing exception: ' + err.message);
    // 종료 코드 1(오류)로 어플리케이션을 종료
    // 다음 줄이 없으면 어플리케이션이 계속됨
    process.exit(1);
});