'use strict';

const path = require('path');

module.exports = {

  loadController(opt) {
    opt = Object.assign({
      directory: path.join(this.options.baseDir, 'app/controller'),
    });
    const controllerBase = opt.directory;
    this.loadToApp(controllerBase, 'controller', opt);
  },

};
