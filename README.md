# [gulp](https://github.com/wearefractal/gulp)-sitemap
> Generate a search engine friendly sitemap.xml using a Gulp stream

[![NPM version](http://img.shields.io/npm/v/gulp-sitemap.svg?style=flat)](https://www.npmjs.org/package/gulp-sitemap)
[![NPM Downloads](http://img.shields.io/npm/dm/gulp-sitemap.svg?style=flat)](https://www.npmjs.org/package/gulp-sitemap)
[![Build Status](http://img.shields.io/travis/pgilad/gulp-sitemap/master.svg?style=flat)](https://travis-ci.org/pgilad/gulp-sitemap)

Easily generate a search engine friendly sitemap.xml from your project.

:bowtie: Search engines love the sitemap.xml and it helps SEO as well.

## Install

Install with [npm](https://npmjs.org/package/gulp-sitemap)

```bash
$ npm install --save-dev gulp-sitemap
```

## Example

```js
var gulp = require('gulp');
var sitemap = require('gulp-sitemap');

gulp.task('sitemap', function () {
    gulp.src('build/**/*.html')
        .pipe(sitemap({
            siteUrl: 'http://www.amazon.com'
        }))
        .pipe(gulp.dest('./build'));
});
```

* `siteUrl` is required.
* `index.html` will be turned into directory path `/`.
* `404.html` will be skipped automatically. No need to unglob it.

Let's see an example of how we can create and output a sitemap, and then return to the original stream files:
```js
var gulp = require('gulp');
var sitemap = require('gulp-sitemap');
var save = require('gulp-save');

gulp.task('html', function() {
    gulp.src('*.html')
        .pipe(save('before-sitemap'))
        .pipe(sitemap({
                siteUrl: 'http://www.amazon.com'
        })) // Returns sitemap.xml
        .pipe(gulp.dest('./dist'))
        .pipe(save.restore('before-sitemap')) //restore all files to the state when we cached them
        // -> continue stream with original html files
        // ...
});
```

## Options

### siteUrl

**required**

Your website's base url. This gets prepended to all documents locations.

Type: `String`

### fileName

Determine the output filename for the sitemap.

Type: `String`

Default: `sitemap.xml`

### changeFreq

Gets filled inside the sitemap in the tag `<changefreq>`.

Type: `String`

Default: `daily`

### priority

Gets filled inside the sitemap in the tag `<priority>`.

Type: `String`

Default: `0.5`

### newLine

How to join line in the target sitemap file.

Type: `String`

Default: Your OS's new line, mostly: `\n`

### spacing

How should the sitemap xml file be spaced. You can use `\t` for tabs, or `  ` with 2
spaces if you'd like.

Type: `String`

Default: `    ` (4 spaces)

## Example usage with default options

```js
var gulp = require('gulp');
var sitemap = require('gulp-sitemap');

gulp.task('sitemap', function () {
    gulp.src('build/**/*.html')
        .pipe(sitemap({
            fileName: 'sitemap.xml',
            newLine: '\n',
            changeFreq: 'daily',
            priority: '0.5',
            siteUrl: '', // no default - this is a required param
            spacing: '    '
        }))
        .pipe(gulp.dest('./build'));
});
```

## Complementary plugins

- [gulp-sitemap-files](https://github.com/adam-lynch/gulp-sitemap-files) - Get all files listed in a sitemap (Perhaps one generated from this plugin)

## Thanks

To [grunt-sitemap](https://github.com/RayViljoen/grunt-sitemap) for the inspiration on writing this.

## License

MIT ©[Gilad Peleg](http://giladpeleg.com)
