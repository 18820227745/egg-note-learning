'use strict';
const process = require('process');
const fs = require('fs');
const assert = require('assert');
const path = require('path');
const Koa = require('koa');
const is = require('is-type-of');
const Router = require('./utils/router');
const utils = require('./utils');

const EGG_LOADER = Symbol.for('egg#loader');
const ROUTER = Symbol('EggCore#router');
const INIT_READY = Symbol('EggCore#initReady');
const EGG_READY_TIMEOUT_ENV = Symbol('EggCore#eggReadyTimeoutEnv');

class EggCore extends Koa {
  constructor(options = {}) {
    options.baseDir = options.baseDir || process.cwd();
    options.type = options.type || 'applictions';

    super();

    this._options = this.options = options;

    // get app timeout from env or use default timeout 10 second
    const eggReadyTimeoutEnv = process.env.EGG_READY_TIMEOUT_ENV;
    this[EGG_READY_TIMEOUT_ENV] = Number.parseInt(eggReadyTimeoutEnv || 10000);

    const Loader = this[EGG_LOADER];
    this.loader = new Loader({
      baseDir: options.baseDir,
      app: this,
    });

    this[INIT_READY]();
  }

  get [EGG_LOADER]() {
    return require('./loader/egg_loader');
  }

  get router() {
    if (this[ROUTER]) {
      return this[ROUTER];
    }

    const router = this[ROUTER] = new Router({ sensitive: true }, this);
    // register router middleware
    this.beforeStart(() => {
      this.use(router.middleware());
    });

    return router;
  }
}

module.exports = EggCore;
