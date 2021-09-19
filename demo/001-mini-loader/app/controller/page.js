'use strict';

module.exports = {
  async index(ctx) {
    ctx.body = 'this is index page!';
  },

  async hello(ctx) {
    ctx.body = 'this is hello page!';
  },
};
