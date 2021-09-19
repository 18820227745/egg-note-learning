'use strict';

module.exports = app => {

  const router = app.router;
  const controller = app.constroller;

  router.get('/', controller.page.index);
  router.get('/hello', controller.page.hello);
  router.resources('posts', '/api/posts', controller.api);
};
