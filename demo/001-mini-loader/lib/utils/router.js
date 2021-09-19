'use strict';

const KoaRouter = require('koa-router');
const is = require('is-type-of');
const inflection = require('inflection');

const utils = require('./index');

const { methods } = utils;

const REST_MAP = {
  index: {
    suffix: '',
    method: 'GET',
  },
  new: {
    namePrefix: 'new_',
    member: true, // 转化为单数
    suffix: 'new',
    method: 'GET',
  },
  create: {
    suffix: '',
    method: 'POST',
  },
  show: {
    member: true,
    suffix: ':id',
    method: 'GET',
  },
  edit: {
    member: true,
    namePrefix: 'edit_',
    suffix: ':id/edit',
    method: 'GET',
  },
  update: {
    member: true,
    namePrefix: '',
    suffix: ':id',
    method: [ 'PATCH', 'PUT' ], // TODO 'PATCH', 'PUT' 的区别
  },
  distroy: {
    member: true,
    namePrefix: 'destroy_',
    suffix: ':id',
    method: 'DELETE',
  },
};

class Router extends KoaRouter {
  constructor(opts, app) {
    super(opts);
    this.app = app;
    this.patchRouterMethod();
  }

  /**
   * 兼容处理路由方法 // TODO 不太明白什么意思
   */
  patchRouterMethod() {
    // patch router methods to support generator function middleware and string controller
    methods.concat([ 'all' ]).forEach(method => {
      this[method] = (...args) => {
        const splited = spliteAndResolveRouterParams({ args, app: this.app });
        // format and rebuild params
        args = splited.prefix.concat(splited.middlewares);
        return super[method](...args);
      };
    });
  }

  /**
   * 兼容处理继承 Koa-router 的 register 方法 // TODO register 方法怎么用
   * create and register a router
   * @param {string} path url path
   * @param {Array} methods Array of HTTP verbs
   * @param {Array} middlewares -
   * @param {Object} opts -
   * @return {Route} this
   */
  register(path, methods, middlewares, opts) {
    // path register to support generator function middleware and string controller // TODO string controller 什么含义
    middlewares = Array.isArray(middlewares) ? middlewares : [ middlewares ];
    middlewares = convertMiddlewares(middlewares, this.app);
    path = Array.isArray(path) ? path : [ path ];
    path.forEach(p => super.register(p, methods, middlewares, opts));

    return this;
  }

  /**
   * restful router api
   * @param  {String} name - Router name 
   * @param  {String} prefix - url prefix
   * @param  {Function} middlewar - middleware or controller
   * @return {Router} return route object.
   */
  resources(...args) {
    const splited = spliteAndResolveRouterParams({ args, app: this.app });
    const middlewares = splited.middlewares;
    // last argument is Controller object
    const controller = splited.middlewares.pop();

    let name = '';
    let prefix = '';
    if (splited.prefix.length === 2) {
      // router.get('users', '/users')
      name = splited.prefix[0];
      prefix = splited.prefix[1];
    } else {
      // router.get('/users')
      prefix = splited.prefix[0];
    }

    for (const key in REST_MAP) {
      const action = controller[key];
      if (!action) continue;

      const opts = REST_MAP[key];
      let formatedName;
      if (opts.member) {
        formatedName = inflection.singularize(name); // 单数
      } else {
        formatedName = inflection.pluralize(name); // 复数
      }
      if (opts.namePrefix) {
        formatedName = opts.namePrefix + formatedName;
      }
      prefix = prefix.replace(/\/$/, ''); // 去掉最后的/ /users/ => /users
      const path = opts.suffix ? `${prefix}/${opts.suffix}` : prefix;
      const method = Array.isArray(opts.method) ? opts.method : [ opts.method ];
      this.register(path, method, middlewares.concat(action), { name: formatedName }); // controller 是最后一个中间件
    }

    return this;
  }
}

/**
 * 统一处理封装 router 的参数
 * @param {Object} options inputs 
 * @param {Object} options.args router params 
 * @param {Object} options.app egg application instance 
 * @return {Object} prefix and middlewares 
 */
function spliteAndResolveRouterParams({ args, app }) {
  let prefix;
  let middlewares;

  if (args.length >= 3 && (is.string(args[1]) || is.regExp(args[1]))) {
    // app.get(name, url, [...middleware], controller)
    prefix = args.slice(0, 2);
    middlewares = args.slice(2);
  } else {
    // app.get(url, [...middleware], controller)
    prefix = args.slice(0, 1);
    middlewares = args.slice(1);
  }

  // resolve controller
  const controller = middlewares.pop();
  middlewares.push(resolveController(controller, app));

  return { prefix, middlewares };
}

/**
 * 封装兼容处理 controller
 * @param {String|Function} controller input controller
 * @param {Appliction} app egg application instance 
 * @return {Function} controller function
 */
function resolveController(controller, app) {
  // ensure controller is exists
  if (!controller) throw new Error('controller not exists');

  if (is.string(controller)) { // TODO 什么情况下 controller 会是 string
    const actions = controller.split('.');
    let obj = app.controller;
    actions.forEach(key => {
      obj = obj[key]; // TODO 这里是不是写错了
      if (!obj) throw new Error(`controller '${controller}' not exists`);
    });
    controller = obj;
  }

  return controller;
}

/**
 * 封装兼容 Generator function 类型的中间件
 * @param {Array} middlewares middlewares and controller(last middleware)
 * @param {Application} app egg application instance
 * @return {Array} middlwwares
 */
function convertMiddlewares(middlewares, app) {
  // ensure controller is resolved
  const controller = resolveController(middlewares.pop(), app);
  // make middleware support genertor function
  const wrappedController = (ctx, next) => {
    return utils.callFn(controller, [ ctx, next ], ctx);
  };

  return middlewares.concat([ wrappedController ]);
}

module.exports = Router;
