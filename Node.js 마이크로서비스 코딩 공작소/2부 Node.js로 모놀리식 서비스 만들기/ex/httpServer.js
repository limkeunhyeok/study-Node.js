const http = require("http");

var server = http.createServer((req, res) => {
    res.end("hello world!");
});

server.listen(8000);