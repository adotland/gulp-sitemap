'use strict';
const chalk = require('chalk');
const defaults = require('lodash/defaults');
const log = require('fancy-log');
const path = require('path');
const PluginError = require('plugin-error');
const through = require('through2');
const Vinyl = require('vinyl');
const fs = require('fs');
const { promisify } = require('util');
const fsReadFile = promisify(fs.readFile);
const slash = require('slash');

const pluginName = 'gulp-sitemap';
const sitemap = require('./lib/sitemap');

module.exports = function (options = {}) {
    const config = defaults({}, options, {
        changefreq: undefined,
        fileName: 'sitemap.xml',
        lastmod: null,
        mappings: [],
        newLine: '\n',
        priority: undefined,
        spacing: '    ',
        verbose: false,
        noindex: false,
        indexReplace: ['html'],
        expand: {}
    });
    const entries = [];
    let firstFile;
    let msg;

    if (!config.siteUrl) {
        msg = 'siteUrl is a required param';
        throw new PluginError(pluginName, msg);
    }
    if (options.changeFreq) {
        msg = chalk.magenta('changeFreq') + ' has been deprecated. Please use ' + chalk.cyan('changefreq');
        throw new PluginError(pluginName, msg);
    }
    // site url should have a trailing slash
    if (config.siteUrl.slice(-1) !== '/') {
        config.siteUrl = config.siteUrl + '/';
    }

    return through.obj(async function (file, enc, callback) {
            //we handle null files (that have no contents), but not dirs
            if (file.isDirectory()) {
                return callback(null, file);
            }

            if (file.isStream()) {
                msg = 'Streaming not supported';
                return callback(new PluginError(pluginName), msg);
            }

            //skip 404 file
            if (/404\.html?$/i.test(file.relative)) {
                return callback();
            }

            if(options.noindex){
                const contents = file.contents.toString();
                if (/<meta [^>]*?noindex/i.test(contents)) {
                    return callback();
                }
            }

            if (!firstFile) {
                firstFile = file;
            }

            const normalizedPath = slash(file.relative);

            if (Object.keys(config.expand).includes(normalizedPath)) {
                // create an entry for each data object using file name
                try {
                    const pathData = await fsReadFile(config.expand[normalizedPath]['dataFile']);
                    const urlExpandData = JSON.parse(pathData);
                    urlExpandData.forEach(urlExpand => {
                      const urlExtension = urlExpand[config.expand[normalizedPath]['key']];
                      const entry = sitemap.getEntryConfig(file, config, urlExtension);
                      entries.push(entry);
                    });
                } catch (e) {
                    log(`[sitemap] error processing entry: ${file.path}`, e);
                }
            } else {
                const entry = sitemap.getEntryConfig(file, config);
                entries.push(entry);
            }

            callback();
        },
        function (callback) {
            if (!firstFile) {
                return callback();
            }
            const contents = sitemap.prepareSitemap(entries, config);
            if (options.verbose) {
                msg = 'Files in sitemap: ' + entries.length;
                log(pluginName, msg);
            }
            //create and push new vinyl file for sitemap
            this.push(new Vinyl({
                cwd: firstFile.cwd,
                base: firstFile.cwd,
                path: path.join(firstFile.cwd, config.fileName),
                contents: Buffer.from(contents)
            }));
            callback();
        });
};
