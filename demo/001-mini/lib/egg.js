'use strict';
const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const KoaRouter = require('koa-router');
const is = require('is-type-of');

const ROUTER = Symbol('EggCore#router');
const EGG_LOADER = Symbol.for('egg#loader');
const methods = [ 'head', 'options', 'get', 'puth', 'patch', 'post', 'delete', 'all' ];

// Router start
class Router extends KoaRouter {
  constructor(opts, app) {
    super(opts);
    this.app = app;
  }
}
// Router end

// EggLoader start
class EggLoader {
  constructor(options) {
    this.options = options;
    this.app = this.options.app;
  }

  loadFile(filepath, ...inject) {
    if (!fs.existsSync(filepath)) {
      return null;
    }

    const extname = path.extname(filepath);
    if (![ '.js', '.node', '.json', '' ].includes(extname)) { // 不能 require 的读取文件返回
      return fs.readFileSync(filepath);
    }

    const ret = require(filepath); // module.exports = app => {
    if (inject.length === 0) inject = [ this.app ]; // 为了注入到下一个模块中，所以其他模块有 .app
    return is.function(ret) ? ret(...inject) : ret;
  }
}

const LoaderMixinRouter = {
  loadRouter() {
    // 加载Egg.js应用工程目录的路由
    this.loadFile(path.join(this.options.baseDir, 'app/router.js')); // 约定好的目录
  },
};
const loaders = [ LoaderMixinRouter ];
for (const loader of loaders) {
  Object.assign(EggLoader.prototype, loader); // TODO  挂在原型链上实例化对象才会有
}
// EggLoader end

// EggCore start
class EggCore extends Koa {
  constructor(options) {
    options.baseDir = options.baseDir || process.cwd();
    options.type = options.type || 'application';
    super(options);

    const loader = this[EGG_LOADER]; // TODO 什么含义
    this.loader = new loader({
      baseDir: options.baseDir,
      app: this, // TODO loader 需要 this 干嘛
    });
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

  beforeStart(fn) {
    process.nextTick(fn); // 微服务中注册，保证实时性
  }
}

// 将 koa router 上的方法绑定到 EggCore 上, 为什么不一开始就命名
methods.concat([ 'resources', 'register', 'redirect' ]).forEach(method => {
  EggCore.prototype[method] = function(...args) {
    this.router[method](...args);
    return this;
  };
});
// EggCore end

// EggApplication start
class AppWorkerLoader extends EggLoader {
  loadAll() {
    this.loadRouter(); // 只加载了路由
  }
}

class EggApplication extends EggCore {
  constructor(options) {
    super(options);
    this.on('error', err => {
      console.error(err);
    });

    this.loader.loadAll(); // APP 实例化的时候加载, EggCore 中实例化
  }

  get [Symbol.for('egg#eggPath')]() {
    return __dirname;
  }

  get [Symbol.for('egg#loader')]() {
    return AppWorkerLoader;
  }
}
// EggApplication end

module.exports = EggApplication;
