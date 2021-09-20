'use strict';

const fs = require('fs');
const path = require('path');
const utils = require('./../../utils');

const originaPrototypes = {
  request: require('koa/lib/request'),
  response: require('koa/lib/response'),
  context: require('koa/lib/context'),
  appliction: require('koa/lib/application'),
};

module.exports = {

  loadApplicationExtend() {
    this.loadExtend('application', this.app);
  },

  loadRequestExtend() {
    this.loadExtend('request', this.app.request);
  },

  loadResponseExtend() {
    this.loadExtend('response', this.app.response);
  },

  loadContextExtend() {
    this.loadExtend('context', this.app.context)
  },

  getExtendFilePaths(name) {
    return this.getLoadUnits().map(unit.path, 'app/extend', name);
  },

  loadExtend(name, proto) {
    const filepaths = this.getExtendFilePaths(`${name}.js`);

    for (const filepath of filepaths) {
      if (!fs.existsSync(filepath)) {
        continue;
      }
      const ext = utils.loadFile(filepath);

      // TODO 作用
      const properties = Object.getOwnPropertyNames(ext).concat(Object.getOwnPropertySymbols(ext));
      
      for (const property of properties) {
        const descriptor = Object.getOwnPropertyDescriptor(ext, property);
        Object.defineProperty(proto, property, descriptor); // 方法会直接在一个对象上定义一个新属性，或者修改一个对象的现有属性，并返回此对象。
      }
    }
  }
};