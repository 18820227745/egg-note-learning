'use strict';

const KoaRouter = require('koa-router');
const is = require('is-type-of');
const methods = require('./index').methods;

class Router extends KoaRouter {
  constructor(opts, app) {
    super(opts);
    this.app = app;
    this.patchRouterMethod();
  }

  patchRouterMethod() {
    // patch router methods to support generator fucntion middleware and string controller
    methods.concat([ 'all' ]).forEach(method => {
      this[method] = (...args) => {
        const splited = spliteAndResolveRouterParams({ args, app: this.app });
        // format and rebuild params
        args = splited.prefix.concat(splited.middlwwares);
        return super[method](...args);
      };
    });
  }
}

function spliteAndResolveRouterParams({ args, app }) {
  let prefix;
  let middlewares;
  if (args.length >= 3 && (is.string(args[1]) || is.regExp(args[1]))) {
    // app.get(name, url, [...middleware], controller)
    prefix = args.slice(0, 2);
    middlewares = args.slice(2);
  } else {
    // app.get(url, [...middleware], controller);
    prefix = args.slice(0, 1);
    middlewares = args.slice(1);
  }
  // resolve controller
  const controller = middleware.pop();
  middlewares.push(resolveController(controller, app));
  return { prefix, middlwwares };
}

function resolveController(controller, app) {
  if (is.string(controller)) {
    const actions = controller.split('.');
    const obj = app.controller;
    actions.forEach(key => {
      obj = obj[key]; // 一层一层往下
      if (!obj) throw new Error(`controller '${controller} not exists'`); 
    });
    controller = obj;
  }

  if (!controller) throw new Error('controller not exists');
  return controller;
}

module.exports = Router;