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

    getPluginPaths (c) {
        return {
            pluginPath: this.bloggify.paths.pluginPath(c)
          , configPath: this.bloggify.paths.pluginConfigPath(c)
          , name: c
        };
    }

    namesToPaths (names) {
        return names.map(c => this.getPluginPaths(c));
    }

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
          , plugin.configPath
          , this.bloggify
        );
    }

    listPlugins (names, cb) {
        if (!cb) {
            cb = names;
            names = null;
        }
        cb = cb || noop;
        this.listPluginDirs(names, (err, dirs, warning) => {
            let plugs = dirs.map(c => this.getPlugin(c));
            cb(err, plugs, warning);
        });
    }

    initPlugin (plug, cb) {
        if (this.plugins[plug.name]) {
            return cb(null, this.plugins[plug.name]);
        }
        this.plugins[plug.name] = plug;
        plug.init(cb);
    }

    loadAll (names, cb) {
        if (typeof names === "function") {
            cb = names;
            names = null;
        }
        cb = cb || noop;
        debugger
        this.listPlugins(names, (err, plugins) => {
            if (err) { return cb(err); }
            oneByOne(bindy(plugins, (c, next) => this.initPlugin(c, next)), cb);
        });
    }

    loadPlugin (plugin, cb) {
        plugin = this.getPlugin(plugin);
        this.initPlugin(plugin, cb);
    }

    get (name, mod) {
        let plug = this.plugins[name] || this.plugins[name.replace(/^bloggify\-/g, "")];
        if (mod) {
            return plug._module;
        }
        return plug;
    }
};
