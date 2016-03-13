"use strict";

const fs = require("fs")
    , BloggifyPlugin = require("bloggify-plugin-class")
    , oneByOne = require("one-by-one")
    , bindy = require("bindy")
    , noop = require("noop6")
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

    namesToPaths (names) {
        return names.map(c => {
            return {
                pluginPath: this.bloggify.paths.pluginPath(c)
              , configPath: this.bloggify.paths.pluginConfigPath(c)
              , name: c
            };
        });
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

    listPlugins (names, cb) {
        if (!cb) {
            cb = names;
            names = null;
        }
        cb = cb || noop;
        this.listPluginDirs(names, (err, dirs, warning) => {
            let plugs = dirs.map(c => {
                let p = new BloggifyPlugin(
                    c.name
                  , c.pluginPath
                  , c.configPath
                  , this.bloggify
                );
                return this.plugins[p.name] = p;
            });
            cb(err, plugs, warning);
        });
    }

    loadAll (names, cb) {
        if (typeof names === "function") {
            cb = names;
            names = null;
        }
        cb = cb || noop;
        this.listPlugins(names, (err, plugins) => {
            if (err) { return cb(err); }
            oneByOne(bindy(plugins, (c, next) => c.init(next)), cb);
        });
    }

    get (name, mod) {
        let plug = this.plugins[name] || this.plugins[name.replace(/^bloggify\-/g, "")];
        if (mod) {
            return plug._module;
        }
        return plug;
    }
};
