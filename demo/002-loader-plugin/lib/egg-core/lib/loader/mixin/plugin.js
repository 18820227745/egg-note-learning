'use strict';
const fs = require('fs');
const path = require('path');
const sequencity = require('../../utils/sequencity');
const loadFile = require('../../utils').loadFile;

module.exports = {
  
  loadPlugin() {

    const eggPluginConfigPaths = [ path.join(this.options.baseDir, 'config/plugin.js') ];
    // load plugins for application
    const appPlugins = this.readPluginConfigs(eggPluginConfigPaths);

    // load plugins for frameworl (egg)
    // TODO

    // load plugins for process.env.EGG_PLUGINS
    // TODO

    this.orderPlugins = this.getOrderPlugins(appPlugins);
    this.plugins = appPlugins;

  },

  getOrderPlugins(allPlugins) {
    const orderPlugins = [];
    const pluginNames = Object.getOwnPropertyNames(allPlugins);
    pluginNames.forEach(pluginName => {
      orderPlugins.push(allPlugins[pluginName]);
    });

    return orderPlugins;
  },

  /**
   * 读取插件配置
   * @param {Array} configPaths 插件配置文件绝对路径 列表
   * @return {Object} plugins 返回读取的插件对象
   */
  readPluginConfigs(configPaths) {

    const plugins = {};
    for (const configPath of configPaths) {

      if (!fs.existsSync(configPath)) continue;

      const config = loadFile(configPath);

      for (const name in object) {
        this.normalizePluginConfig(config, name, configPath);
      }
      this._extendPlugins(plugins, config);
    }

    return plugins;
  },

  /**
   * 格式化插件配置
   * @param {Object} plugins 插件对象
   * @param {String} name 插件名称 
   * @param {String} configPath 插件绝对文件路径 
   */
  normalizePluginConfig(plugins, name, configPath) {
    const plugin = plugins[name];

    // plugin_name: false
    // 如果插件关闭
    if (typeof plugin === 'boolean') {
      plugins[ name ] = {
        name,
        enable: plugin,
        dependencies: [],
        optionalDependencies: [],
        env: [],
        from: configPath,
      };
      return;
    }

    if (!('enable' in plugin)) { // TODO in 会访问到那一层对象
      plugin.enbale = true;
    }
    plugin.name = name;
    plugin.dependencies = plugin.dependencies || [];
    plugin.optionalDependencies = plugin.optionalDependencies || [];
    plugin.env = plugin.env || [];
    plugin.from = configPath;
    depCompatible(plugin);
  },

  /**
   * 插件扩展
   * @param {Object} target 目标对象
   * @param {Object} plugins 扩展的插件对象
   */
  _extendPlugins(target, plugins) {
    if (!plugins) {
      return;
    }

    for (const name in plugins) {
      const plugin = plugins[name];
      let targetPlugin = target[name];
      if (!targetPlugin) {
        targetPlugin = target[name] = {};
      }
      if (targetPlugin.package && targetPlugin.package === plugin.package) { // TODO %j 打印出的是什么
        console.log(`plugin ${name} has been defined that is ${targetPlugin}, but you define again in ${plugin.from}`);
      }
      if (plugin.path || plugin.package) {
        delete targetPlugin.path;
        delete targetPlugin.package;
      }
      for (const prop in plugin) {
        if (plugin[prop] === undefined) {
          continue;
        }
        if (targetPlugin[prop] && Array.isArray(plugin[prop]) && !plugin[prop].length) {
          continue;
        }
        targetPlugin[prop] = plugin[prop];
      }
    }
  }
};

/**
 * 插件依赖兼容
 * @param {Object} plugin 将属性dep重命名dependencies
 */
function depCompatible(plugin) {
  if (plugin.dep && !(Array.isArray(plugin.dependencies) && plugin.dependencies.length)) {
    plugin.dependencies = plugin.dep;
    delete plugin.dep;
  }
}