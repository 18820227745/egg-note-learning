'use strict';

module.exports = app => {

  app.plugin3_app_func();

  app.get('/index', async ctx => {
    ctx.body = 'hello index';
  });
  app.get('/', async ctx => {
    ctx.body = 'hello world';

    ctx.plugin3_app_func();
    ctx.request.plugin3_app_func();
    ctx.response.plugin3_app_func();
  });
};
