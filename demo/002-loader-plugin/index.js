'use strict';
const EggApplication = require('./lib/egg').EggApplication;
const http = require('http');


// 初始化 Egg.js 应用
const app = new EggApplication({
  baseDir: __dirname,
  type: 'application',
});

app.ready(err => {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  const server = http.createServer(app.callback());
  server.once('error', err => {
    console.log('[app_worker] server got error: %s, code: %s', err.message, err.code);
    process.exit(1);
  });

  server.listen(7001, () => {
    console.log('server started at 7001');
  });
});
