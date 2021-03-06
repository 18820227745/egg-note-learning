'use strict';

const fs = require('fs');
const path = require('path');
const is = require('is-type-of');
const convert = require('koa-convert');
const co = require('co');

module.exports = {
  // TODO 所有 HTTP 方法的含义
  methods: [ 'head', 'options', 'get', 'put', 'patch', 'post', 'delete', 'all' ],

  middlewate(fn) {
    return is.generatorFunction(fn) ? convert(fn) : fn;
  },

  async callFn(fn, args, ctx) {
    args = args || [];
    if (!is.function(fn)) return;
    if (is.generatorFunction(fn)) fn = co.wrap(fn);

    return ctx ? fn.call(ctx, ...args) : fn(...args);
  },

  loadFile(filepath) {
    try {
      // if not js module, just return content buffer
      const extname = path.extname(filepath);
      if (![ '.js', '.node', '.json', '' ].includes(extname)) {
        return fs.readFileSync(filepath); // TODO  官方是同步获取吗？
      }
      // require js module
      const obj = require(filepath);
      if (!obj) return obj;
      // it is es module
      if (obj.__esModule) return 'default' in obj ? obj.default : obj;
      return obj;
    } catch (error) {
      error.message = `[egg-core] load file: ${filepath}, error: ${error.message}`;
      throw error;
    }
  },
};
