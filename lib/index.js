"use strict";

const fs = require("fs")
    , BloggifyPlugin = require("bloggify-plugin-class")
    , oneByOne = require("one-by-one")
    , bindy = require("bindy")
    , noop = require("noop6")
    , typpy = require("typpy")
    ;

module.exports = class BloggifyPluginLoader {

    /**
     * BloggifyPluginLoader
     * The Bloggify plugin loader.
     *
     * @name bloggifyPluginLoader
     * @function
     * @param {BloggifyCore} bloggify The `BloggifyCore` instance.
     * @return {BloggifyPluginLoader} The `BloggifyPluginLoader` instance.
     */
    constructor (bloggify) {
        this.bloggify = bloggify;
        this.plugins = {};
    }

    /**
     * getPluginPaths
     * Fetches the plugin's path.
     *
     * @param  {BloggifyPlugin} pluginName The plugin instance.
     * @return {String} The plugin's name.
     */
    getPluginPaths (pluginName) {
        return {
            pluginPath: this.bloggify.paths.pluginPath(pluginName)
          , name: pluginName
        };
    }

    /**
     * namesToPaths
     * Fetches the path list for each plugin.
     *
     * @param  {Array} names The list of plugin names.
     * @return {Array} The path list.
     */
    namesToPaths (names) {
        return names.map(pluginName => this.getPluginPaths(pluginName));
    }

    /**
     * listPluginDirs
     * Fetches the list of the plugin's instances.
     *
     * @param  {Array} names The list of plugin names.
     * @param  {Function} cb The callback function.
     */
    listPluginDirs (names, cb) {
        if (typeof names === "function") {
            cb = names;
            names = null;
        }
        cb = cb || noop;
        if (Array.isArray(names)) {
            return cb(null, this.namesToPaths(names));
        }
        let pluginsDir = this.bloggify.paths.plugins;
        fs.readdir(pluginsDir, (err, dirs) => {
            if (err) {
                if (err.code === "ENOENT") {
                    return cb(null, [], err);
                }
                return cb(err, []);
            }
            cb(null, this.namesToPaths(dirs.sort()));
        });
    }

    /**
     * getPlugin
     * Fetches called plugin's content if it's valid. Otherwise, it fetches a new one.
     *
     * @param  {BloggifyPlugin} plugin The plugin's name.
     * @return {BloggifyPlugin}        The plugin instance.
     */
    getPlugin (plugin) {

        if (typpy(plugin, BloggifyPlugin)) {
            return plugin;
        }

        if (typeof plugin === "string") {
            return this.getPlugin(this.getPluginPaths(plugin));
        }

        return new BloggifyPlugin(
            plugin.name
          , plugin.pluginPath
          , this.bloggify
        );
    }

    /**
     * listPlugins
     * Fetches the plugins list.
     *
     * @param  {Array} names The list of plugin names.
     * @param  {Function} cb The callback function.
     */
    listPlugins (names, cb) {
        if (!cb) {
            cb = names;
            names = null;
        }
        cb = cb || noop;
        this.listPluginDirs(names, (err, dirs, warning) => {
            let plugs = dirs.map(pluginName => this.getPlugin(pluginName));
            cb(err, plugs, warning);
        });
    }

    /**
     * initPlugin
     * Initializes the plugin's instance.
     *
     * @param  {BloggifyPlugin} plug The plugin instance.
     * @param  {Function} cb   The callback function.
     */
    initPlugin (plug, cb) {
        if (this.plugins[plug.name]) {
            return cb(null, this.plugins[plug.name]);
        }
        this.plugins[plug.name] = plug;
        plug.init(cb);
    }

    /**
     * loadAll
     * Fetches the list of plugins that need to be loaded.
     *
     * @param  {Array} names The list of plugin names.
     * @param  {Function} cb    The callback function.
     */
    loadAll (names, cb) {
        if (typeof names === "function") {
            cb = names;
            names = null;
        }
        cb = cb || noop;
        if (!names) {
            this.bloggify.log("A list of plugins was not provided, therefore all the plugins in the plugin directory will be loaded.");
        }
        this.listPlugins(names, (err, plugins) => {
            if (err) { return cb(err); }
            oneByOne(bindy(plugins, (pluginName, next) => this.initPlugin(pluginName, next)), cb);
        });
    }

    /**
     * loadPlugin
     * Loads the called plugin's content.
     *
     * @param  {BloggifyPlugin} plugin The plugin instance.
     * @param  {Function} cb   The callback function.
     */
    loadPlugin (plugin, cb) {
        plugin = this.getPlugin(plugin);
        this.initPlugin(plugin, cb);
    }

    /**
     * get
     * Fetches the instance of the plugin.
     *
     * @param  {String} name    The plugin's name.
     * @param  {Boolean} mod    The plugin's module.
     * @return {BloggifyPlugin} The plugin instance.
     */
    get (name, mod) {
        let plug = this.plugins[name]
                 || this.plugins["bloggify-" + name]
                 || this.plugins["_bloggify-" + name]
                 || this.plugins[name.replace(/^_?bloggify\-/g, "")]
                 ;

        if (mod) {
            return plug._module;
        }
        return plug;
    }
};
