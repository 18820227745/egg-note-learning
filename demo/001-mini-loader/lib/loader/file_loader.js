'use strict';

const fs = require('fs');
const path = require('path');
const globby = require('globby');

const FULLPATH = Symbol('EGG_LOADER_ITEM_FULLPATH');
const EXPORTS = Symbol('EGG_LOADER_ITEM_EXPORTS');

/**
 * Load files from directory to target object.
 * @since 1.0.0
 */
class FileLoader {

  constructor(options) {
    this.options = options;
  }

  load() {
    const items = this.parse();
    const target = this.options.target;
    
  }
}

module.exports = FileLoader;
module.exports.EXPORTS = EXPORTS;
module.exports.FULLPATH = FULLPATH;