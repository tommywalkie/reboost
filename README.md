# Reboost
Reboost your web development workflow.

> ### Experimental.
> Reboost is still in the alpha stage. Some things might not work.

## Motivation
When developing a web app, as your number of modules increases,
your compile-time slows down, it's really a big problem, it takes a lot of precious
time which you could have used to develop your app. Since ES2015 (aka ES6) modules
are supported natively by browsers. If you can connect (or you can say serve) them
up correctly, it will work on browsers without the need for bundling. Here, Reboost
does that for you - the serving part. So you can develop your app faster.

**NOTE:** Reboost only serves your scripts while developing, for production you've to
bundle up your files by yourself using bundlers like Webpack, Rollup, etc.

## Quickstart
First, install it using npm as devDependency
```shell
npm i -D reboost
```
Assume that file structure is like this
```
Project
  public/
    index.html
  src/
    add.js
    subtract.js
    index.js
  package.json
```
Script contents
```js
// src/add.js
export const add = (a, b) => a + b;

// src/subtract.js
export const subtract = (a, b) => a - b;

// src/index.js
import { add } from './add';
import { subtract } from './subtract';

console.log('1 + 3 =', add(1, 3));
console.log('10 - 5 =', subtract(10, 5));
```
and HTML content (`public/index.html`)
```html
<!doctype html>
<html>
  <body>
    <!-- Notice the type is "module" -->
    <script type="module" src="./dist/bundle.js">
  </body>
</html>
```

then create a file named `reboost.js`
```js
const { start } = require('reboost');

start({
  entries: [
    // Format - [inputPath, outputPath]
    ['./src/index.js', './public/dist/bundle.js']
  ],
  contentServer: {
    root: './public'
  }
})
```
after that run the script using `node`, open your terminal in that directory and use the command
```shell
node reboost
```
Now open the address in which the content server is started. You can see your code is working without any problem.

### What if I want to use any other server?
Reboost's content server is basically static, it just serves the file. If you want to use any other server (like browser-sync or your own http server) you can do that, you've to just serve the generated
scripts which are in your output directory. Reboost will handle the rest.

## What's the difference?
- No bundling
- Transforms only the file which is requested or changed
- Caches transformed files, so it can serve fast if the file hasn't changed

## How it works?
1. Reboost starts a proxy server
2. It rewrites scripts so that all imports are served from the proxy server
3. When files are requested from the proxy server, the server checks
if the requested file is available in the cache, it returns the cached file,
if not available it transforms the file so that all imports of the file are served from
the proxy server then it returns the transformed file and saves the transformed file
to cache. Step 3 repeats again for other files and this step continues.


## Options
There are a few options that you can use to customize Reboost. You would use options when starting
Reboost, like so
```js
const { start } = require('reboost');

start({
  // Options
})
```

List of all options

#### `cacheDir`
Type: `string`

Path of the directory to use for storing cached files. Defaults to `./.reboost_cache`.


#### `entries`
Type: `([string, string] | [string, string, string])[]`

File entries which will be served by Reboost. Value is an array of an array containing input
and the output file's path

For single file
```js
const { start } = require('reboost');

start({
  entries: [
    [inputPath, outputPath]
    // Example - ['./src/index.js', './dist/bundle.js']
  ]
})
```

For multiple files
```js
const { start } = require('reboost');

start({
  entries: [
    [inputPath1, outputPath1],
    [inputPath2, outputPath2],
    ...
    [inputPathN, outputPathN],
  ]
})
```

If you're authoring a library and want all your exports to be available through the
`window` object with a name you can pass an extra string in your array

`src/index.js`
```js
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;
```
`reboost.js`
```js
const { start } = require('reboost');

start({
  entries: [
    ['./src/index.js', './dist/library.js', 'coolLib']
    //                                       ^^^ This is the extra string as our library name
  ]
})
```
In browser
```js
window.coolLib // Module { add: (...), subtract: (...) }
```
As you expected, exports are available through the `window` object

#### `rootDir`
Type: `string`

Path of the directory to use as the root directory. Used to resolve relative paths.

#### `resolve`
Type: `object`

Configurations for module and file resolving

##### `resolve.alias`
Type: `{ [aliasName: string]: string }`

Paths to use when resolving aliases, create your own alias to ease importing.

Example

```js
const { start } = require('reboost');

start({
  resolve: {
    alias: {
      Components: './components'
    }
  }
})
```
Instead of using relative paths you can use alias.

Some deeply nested file -
```js
import ProgressBar from '../../../components/progressbar';
```
Now you can do
```js
import ProgressBar from 'Components/progressbar';
```

##### `resolve.extensions`
Type: `string[]`

Extensions to be used for resolving files. Defaults to `['.mjs', '.js', '.json']`.
So that you can write
```js
import mod from './mod';
```
instead of
```js
import mod from './mod.js';
```

It returns the first file with the first matched extension, so ordering matters.

##### `resolve.mainFiles`
Type: `string[]`

File names to use while resolving directories. Defaults to `['index']`.
So that you can write
```js
import main from './subdir';
```
instead of
```js
import main from './subdir/index';
```

##### `resolve.modules`
Type: `string[]`

Directories to use while resolving modules. Defaults to `['node_modules']`.

#### `watchOptions`
Type: `object`

Options to use for watching files

##### `watchOptions.include`
Type: `Matcher`

Files to include in the watch-list. Can be any of [anymatch](https://www.npmjs.com/package/anymatch)
patterns. By default, all files with resolved extensions are watched.

##### `watchOptions.exclude`
Type: `Matcher`

Files to exclude from watch-list. Can be any of [anymatch](https://www.npmjs.com/package/anymatch)
patterns. Defaults to `/node_modules/`, all files which are in `node_modules` are excluded.

#### `sourceMaps`
Type: `object`

Options to use when generating source maps.

##### `sourceMaps.include`
Type: `Matcher`

Files to include in source map generation. Can be any of [anymatch](https://www.npmjs.com/package/anymatch)
patterns. Defaults to `/.*/`, source map is generated for all files.

##### `sourceMaps.exclude`
Type: `Matcher`

Files to exclude from source map generation. Can be any of [anymatch](https://www.npmjs.com/package/anymatch)
patterns. Defaults to `/node_modules/`, all files which are in `node_modules` are excluded.

#### `plugins`
Type: `Plugin[]`

An array of plugins to be used by Reboost.

### Plugins
There are several built-in plugins from Reboost.
[Read more about built-in plugins](https://github.com/sarsamurmu/reboost/blob/master/plugins.md).

---

### Inspired by
Reboost is highly inspired by these awesome projects
- [Vite](https://github.com/vuejs/vite)
- [Snowpack](https://github.com/pikapkg/snowpack)
- [esbuild](https://github.com/evanw/esbuild)

# License
Licensed under the [MIT License](https://github.com/sarsamurmu/reboost/blob/master/LICENSE).
