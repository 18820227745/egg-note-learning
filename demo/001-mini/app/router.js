'use strict';

module.exports = app => {

  app.router.get('/index', async ctx => {
    ctx.body = 'hello index';
  });
  app.router.get('/', async ctx => {
    ctx.body = 'hello world';
  });

  app.get('/index1', async ctx => {
    ctx.body = 'hello index1';
  });
};
