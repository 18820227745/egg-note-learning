'use strict';

const { EggCore, EggLoader } = require('./../egg-core');

class AppWorkerLoader extends EggLoader {
  loadAll() {
    this.loadController();
    this.loadRouter();
  }
}

class EggApplication extends EggCore {
  constructor(options) {
    super(options);
    this.on('error', err => {
      console.error(err);
    });

    this.loader.loadAll();
  }

  get [Symbol.for('egg#eggPath')]() {
    return __dirname;
  }

  get [Symbol.for('egg#loader')]() {
    return AppWorkerLoader;
  }
}

module.exports = EggApplication;

