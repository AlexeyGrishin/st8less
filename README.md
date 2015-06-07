[![Coverage Status](https://coveralls.io/repos/AlexeyGrishin/st8less/badge.svg?branch=master)](https://coveralls.io/r/AlexeyGrishin/st8less?branch=master)
[![Code Climate](https://codeclimate.com/github/AlexeyGrishin/st8less/badges/gpa.svg)](https://codeclimate.com/github/AlexeyGrishin/st8less)

## What is this

`St8less` allows to extract functions by specified criteria from your source files. These functions could be placed to separate file and will be addressed via some globally accessed object.
It could be useful for hot-swap of those functions, for example - LiveReload.

## How it looks like

File1:
```javascript
var Page1 = {
    controller: function () {
        this.count = 5;
    },
    view: function (c) {
        '__stateless';
        return m('div', 'count is ' + c.count);
    }
};
```

File2:
```javascript
function myRand() {
    '__stateless';
    return Math.random();
};
```

After applying extractor with default settings we get the following:

File1:
```javascript
 var Page1 = {
    controller: function () {
        this.count = 5;
    },
    view: function (c) {
        return MyGlobal.abc.view0.apply(this, [c, m]);
    }
};
```

File2:
```javascript
 function myRand() {
    return MyGlobal.abc.myRand1.apply(this, [Math]);
}
```

Extracted:
```javascript
MyGlobal.abc = {};

MyGlobal.abc.view0 = function (c, m){
    '__stateless';
    return m('div', 'count is ' + c.count);
}

MyGlobal.abc.myRand1 = function (Math){
    '__stateless';
    return Math.random();
}
```

## How to use

```javascript
 * var ex = new Extractor();
 * ex.parse(fs.readFileSync('file1.js'), function (err, changed) {
 *   fs.writeFileSync('file1_changed.js', changed);
 *   ex.parse(fs.readFileSync('file2.js'), function (err, changed) {
 *     fs.writeFileSync('file2_changed.js', changed);
 *     ex.done(function (err, extracted) {
 *       fs.writeFileSync('extracted.js', extracted);
 *     });
 *   });
 * });
```

Extractor options:
 * `criteria` - which functions shall be extracted. Is a function which accepts `functionDefinition` parameter, which is an object with following properties:
   * `name` - function name (or property/variable name that holds the function)
   * `attribute` - attribute defined as string expression at begining of function, like `__stateless` in example above
   * `paramNames` - argument names
   * `externalVariables` - variable/fn names used in function but not declared inside
   By default extractor looks for functions with `__stateless` attribute
 * `objectName` - object ot store extracted functions. Default is `St8less`
 * `globalName` - global object to use in calls. Default is `window`


## Usage

Used by [mithril reload plugin](https://github.com/AlexeyGrishin/gulp-livereload-mithril)