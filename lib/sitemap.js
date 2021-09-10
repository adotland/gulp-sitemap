'use strict';
const fs = require('fs');
const defaults = require('lodash/defaults');
const find = require('lodash/find');
const includes = require('lodash/includes');
const multimatch = require('multimatch');
const slash = require('slash');
const pick = require('lodash/pick');
const { UrlSet, URLSET_CLOSE } = require('./urlset');
const urlset = new UrlSet();

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';

const allowedProperties = ['getLoc', 'lastmod', 'priority', 'changefreq', 'hreflang'];

function getEntryConfig(file, siteConfig) {
    const relativePath = file.relative;
    const mappingsForFile = find(siteConfig.mappings, function(item) {
        return multimatch(relativePath, item.pages).length > 0;
    }) || {};

    const entry = defaults(
        {},
        pick(mappingsForFile, allowedProperties),
        pick(siteConfig, allowedProperties)
    );

    if (siteConfig.images) {
        urlset.addXmlns('image');
    }

    if (siteConfig.videos) {
        urlset.addXmlns('video');
    }

    if (entry.lastmod === null) {
        // calculate mtime manually
        entry.lastmod = file.stat && file.stat.mtime || Date.now();
    } else if (typeof entry.lastmod === 'function') {
        entry.lastmod = entry.lastmod(file);
    }

    //url location. Use slash to convert windows \\ or \ to /
    let normalizedPath = slash(relativePath);

    //turn index.html into -> /
    siteConfig.indexReplace.forEach((ext) => {
        const indexRegex = RegExp(`^(.*)(\/|^)index\.${ext}$`);
        const matches = normalizedPath.match(indexRegex);
        if (matches && matches.length) {
            normalizedPath = matches[1] === '' ? '' : matches[1] + '/';
        }
    })

    entry.loc = siteConfig.siteUrl + normalizedPath;
    entry.file = normalizedPath;
    entry.source = file.history[0];

    return entry;
}

function wrapTag(tag, value) {
    return `
        <${ tag }>${ value }</${ tag }>
    `;
}

function createImageSitemap(imageURL) {
    return `
        <image:image>
            <image:loc>${imageURL}</image:loc>
        </image:image>
    `;
}

function notIsHTTPURL(text) {
    return !(/https?:\/\//ig).test(text);
}

function getImagesUrl(entry, siteConfig) {
    const reImageMatch = /<img\s+src="((https?:\/\/)?[\w\.\/\-@\?=&]+)"/ig;
    const reSourceMatch = /"((https?:\/\/)?[\w\.\/\-@\?=&]+)"/ig;
    const html = fs.readFileSync(entry.source, { encoding : 'utf8'})
    const images = html.match(reImageMatch);

    if (images === null) {
        return [];
    }

    const URLs = images.map(image => {
        let currentURL = image.match(reSourceMatch)[0].replace(/^\"|\"$/ig, '');

        if (notIsHTTPURL(currentURL)) {
            currentURL = currentURL.replace(/^\/|\.\//, '');
            currentURL = siteConfig.siteUrl + currentURL;
        }

        return currentURL;
    });

    return URLs;
}

function generateImagesMap(entry, siteConfig) {
    let imagesURLS = [];
    let XMLImageList = '';

    // Crawling page for images
    imagesURLS = getImagesUrl(entry, siteConfig);

    // if truthy create image sitemap
    if (imagesURLS.length) {
        XMLImageList = imagesURLS.map(imageURL => createImageSitemap(imageURL)).join('')
    }

    return XMLImageList;
}

/**
 * processEntry
 *
 * @param entry
 * @param siteConfig
 * @return {string}
 */
function processEntry(entry, siteConfig) {
    const returnArr = [siteConfig.spacing + '<url>'];

    const loc = entry.getLoc ? entry.getLoc(siteConfig.siteUrl, entry.loc, entry) : entry.loc;
    returnArr.push(siteConfig.spacing + siteConfig.spacing + wrapTag('loc', loc) + (siteConfig.images ? generateImagesMap(entry, siteConfig) : ''));

    let lastmod = entry.lastmod;
    if (lastmod) {
        //format mtime to ISO (same as +00:00)
        lastmod = new Date(lastmod).toISOString();
        returnArr.push(siteConfig.spacing + siteConfig.spacing + wrapTag('lastmod', lastmod));
    }

    const changefreq = entry.changefreq;
    if (changefreq) {
        returnArr.push(siteConfig.spacing + siteConfig.spacing + wrapTag('changefreq', changefreq));
    }

    let priority;

    if (typeof entry.priority === 'function') {
        priority = entry.priority(siteConfig.siteUrl, entry.loc, entry);
    } else if (typeof entry.priority !== 'undefined') {
        priority = entry.priority;
    }
    if (typeof priority !== 'undefined') {
        returnArr.push(siteConfig.spacing + siteConfig.spacing + wrapTag('priority', priority));
    }

    const hreflang = entry.hreflang;
    if (hreflang && hreflang.length > 0) {
        const file = entry.file;
        hreflang.forEach(function(item) {
            const href = item.getHref(siteConfig.siteUrl, file, item.lang, loc);
            const tag = '<xhtml:link rel="alternate" hreflang="' + item.lang + '" href="' + href + '" />';
            returnArr.push(siteConfig.spacing + siteConfig.spacing + tag);
        });
    }

    returnArr.push(siteConfig.spacing + '</url>');
    return returnArr.join(siteConfig.newLine);
}

function prepareSitemap(entries, config) {
    const entriesHref = entries.some(function(entry) {
        return entry && entry.hreflang && entry.hreflang.length;
    });
    if (entriesHref) {
        urlset.addXmlns('xhtml');
    }
    const sitemapStr = [XML_DECLARATION]
        .concat(urlset.get())
        .concat(entries.map(function(entry) {
            return processEntry(entry, config);
        }))
        .concat(URLSET_CLOSE)
        .join(config.newLine)
        .toString();
    urlset.reset();
    return sitemapStr;
}

const VALID_CHANGE_FREQUENCIES = [
    'always',
    'hourly',
    'daily',
    'weekly',
    'monthly',
    'yearly',
    'never'
];

function isChangefreqValid(changefreq) {
    // empty changefreq is valid
    if (!changefreq) {
        return true;
    }
    return includes(VALID_CHANGE_FREQUENCIES, changefreq.toLowerCase());
}

exports.getEntryConfig = getEntryConfig;
exports.isChangefreqValid = isChangefreqValid;
exports.prepareSitemap = prepareSitemap;
exports.processEntry = processEntry;
