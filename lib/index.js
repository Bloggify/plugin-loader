"use strict"

const fs = require("fs")
    , BloggifyPlugin = require("bloggify-plugin-class")
    , oneByOne = require("one-by-one")
    , bindy = require("bindy")
    , noop = require("noop6")
    , typpy = require("typpy")
    , assured = require("assured")
    , Path = require("path")

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
        this.bloggify = bloggify
        this.plugins = {}
    }

    /**
     * getPluginPath
     * Fetches the plugin's path.
     *
     * @param  {BloggifyPlugin} pluginName The plugin's name.
     * @return {String} The plugin's path.
     */
    getPluginPath (plugin) {
        if (plugin.name) { return plugin }
        if (!plugin) { return null }
        plugin = typeof plugin === "string" ? [plugin, {}] : plugin

        let isLocalPlugin = plugin[0].startsWith("/")
        if (isLocalPlugin) {
            plugin[0] = Path.join(this.bloggify.paths.root, plugin[0])
        } else if (!plugin[0].startsWith("bloggify-")) {
            plugin[0] = `bloggify-${plugin[0]}`
        }

        return {
            pluginPath: isLocalPlugin ? plugin[0] : this.bloggify.paths.pluginPath(plugin[0])
          , name: plugin[0]
          , config: plugin[1]
        }
    }

    /**
     * namesToPaths
     * Fetches the path list for each plugin.
     *
     * @param  {Array} names The list of plugin names.
     * @return {Array} The path list.
     */
    namesToPaths (plugins) {
        return plugins.map(plugin => {
            return plugin && this.getPluginPath(plugin)
        }).filter(Boolean)
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
            cb = names
            names = null
        }
        cb = cb || noop
        if (Array.isArray(names)) {
            return cb(null, this.namesToPaths(names))
        }
        let pluginsDir = this.bloggify.paths.plugins
        fs.readdir(pluginsDir, (err, dirs) => {
            if (err) {
                if (err.code === "ENOENT") {
                    return cb(null, [], err)
                }
                return cb(err, [])
            }
            cb(null, this.namesToPaths(dirs.sort()))
        })
    }

    /**
     * getPlugin
     * Fetches called plugin's content if it's valid. Otherwise, it fetches a new one.
     *
     * @param  {BloggifyPlugin} plugin The plugin's name.
     * @return {BloggifyPlugin|String} The plugin's name or instance.
     */
    getPlugin (plugin) {

        if (typpy(plugin, BloggifyPlugin)) {
            return plugin
        }

        plugin = this.getPluginPath(plugin)

        return new BloggifyPlugin(
            plugin.name
          , plugin.pluginPath
          , plugin.config
        )
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
            cb = names
            names = null
        }
        cb = cb || noop
        this.listPluginDirs(names, (err, dirs, warning) => {
            let plugs = dirs.map(pluginName => this.getPlugin(pluginName))
            cb(err, plugs, warning)
        })
    }

    /**
     * initPlugin
     * Initializes the plugin's instance.
     *
     * @param  {BloggifyPlugin} plug The plugin instance.
     * @param  {Function} cb   The callback function.
     */
    initPlugin (plug, cb) {
        plug = this.getPlugin(plug)
        const maybeInitializedAlready = this.plugins[plug.name]
        if (maybeInitializedAlready) {
            cb(null, this.plugins[plug.name])
            return Promise.resolve(maybeInitializedAlready)
        }
        this.plugins[plug.name] = plug
        return plug.init(cb)
    }

    /**
     * loadAll
     * Initializes the plugins that need to be loaded.
     *
     * @param  {Array} names The list of plugin names.
     * @param  {Function} cb    The callback function.
     * @return {Promise} A promise.
     */
    loadAll (names, cb) {
        if (typeof names === "function") {
            cb = names
            names = null
        }
        cb = assured(cb || noop)
        if (!names) {
            this.bloggify.log("A list of plugins was not provided, therefore all the plugins in the plugin directory will be loaded.")
        }
        this.listPlugins(names, (err, plugins) => {
            if (err) { return cb(err); }
            let chain = Promise.resolve()
            plugins.forEach(plugin => {
                chain = chain.then(() => this.initPlugin(plugin))
            })
            chain.then(() => {
                cb()
            }).catch(err => {
                cb(err)
            })
        })
        return cb._
    }

    /**
     * loadPlugin
     * Loads the provided plugin.
     *
     * @param  {BloggifyPlugin} plugin The plugin instance.
     * @param  {Function} cb   The callback function.
     */
    loadPlugin (plugin, cb) {
        plugin = this.getPlugin(plugin)
        return this.initPlugin(plugin, cb)
    }

    /**
     * get
     * If `true`, the raw plugin module will be returned. Otherwise, it will fetch the instance of the plugin.
     *
     * @param  {String} name    The plugin's name.
     * @param  {Boolean} mod    The plugin's module. Default: `true`
     * @return {BloggifyPlugin|String} The plugin's name or instance.
     */
    get (name, mod = true, cb) {

        if (typeof mod === "function") {
            cb = mod
            mod = false
        }

        const names = [
            name
          , "bloggify-" + name
          , "_bloggify-" + name
          , name.replace(/^_?bloggify\-/g, "")
        ]

        let plug = null
        for (var i = 0; i < names.length; ++i) {
            plug = this.plugins[names[i]]
            if (plug) {
                break
            }
        }

        if (mod && plug) {
            plug = plug._module
        }

        if (cb) {
            if (plug) {
                cb(plug)
            } else {
                let events = names.map(c => `plugin-loaded:${c}`)
                let onload = (plug, plugModule, err) => {
                    events.forEach(c => {
                        this.bloggify.removeListener(c, onload)
                    })
                    cb(mod ? plugModule : plug)
                }

                events.forEach(ev => this.bloggify.once(ev, onload))
            }
        }

        return plug
    }
}
