
# bloggify-plugin-loader

 [![Version](https://img.shields.io/npm/v/bloggify-plugin-loader.svg)](https://www.npmjs.com/package/bloggify-plugin-loader) [![Downloads](https://img.shields.io/npm/dt/bloggify-plugin-loader.svg)](https://www.npmjs.com/package/bloggify-plugin-loader)

> The Bloggify plugin loader.

This is the default plugin loader for Bloggify.

## :cloud: Installation

```sh
$ npm i --save bloggify-plugin-loader
```


## :memo: Documentation


### `bloggifyPluginLoader(bloggify)`
BloggifyPluginLoader
The Bloggify plugin loader.

#### Params
- **BloggifyCore** `bloggify`: The `BloggifyCore` instance.

#### Return
- **BloggifyPluginLoader** The `BloggifyPluginLoader` instance.

### `getPluginPath(pluginName)`
Fetches the plugin's path.

#### Params
- **BloggifyPlugin** `pluginName`: The plugin's name.

#### Return
- **String** The plugin's path.

### `namesToPaths(names)`
Fetches the path list for each plugin.

#### Params
- **Array** `names`: The list of plugin names.

#### Return
- **Array** The path list.

### `listPluginDirs(names, cb)`
Fetches the list of the plugin's instances.

#### Params
- **Array** `names`: The list of plugin names.
- **Function** `cb`: The callback function.

### `getPlugin(plugin)`
Fetches called plugin's content if it's valid. Otherwise, it fetches a new one.

#### Params
- **BloggifyPlugin** `plugin`: The plugin's name.

#### Return
- **BloggifyPlugin|String** The plugin's name or instance.

### `listPlugins(names, cb)`
Fetches the plugins list.

#### Params
- **Array** `names`: The list of plugin names.
- **Function** `cb`: The callback function.

### `initPlugin(plug, cb)`
Initializes the plugin's instance.

#### Params
- **BloggifyPlugin** `plug`: The plugin instance.
- **Function** `cb`: The callback function.

### `loadAll(names, cb)`
Initializes the plugins that need to be loaded.

#### Params
- **Array** `names`: The list of plugin names.
- **Function** `cb`: The callback function.

### `loadPlugin(plugin, cb)`
Loads the provided plugin.

#### Params
- **BloggifyPlugin** `plugin`: The plugin instance.
- **Function** `cb`: The callback function.

### `get(name, mod)`
If `true`, the raw plugin module will be returned. Otherwise, it will fetch the instance of the plugin.

#### Params
- **String** `name`: The plugin's name.
- **Boolean** `mod`: The plugin's module.

#### Return
- **BloggifyPlugin|String** The plugin's name or instance.



## :yum: How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].



## :scroll: License

[MIT][license] © [Bloggify][website]

[license]: http://showalicense.com/?fullname=Bloggify%20%3Csupport%40bloggify.org%3E%20(https%3A%2F%2Fbloggify.org)&year=2016#license-mit
[website]: https://bloggify.org
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md
