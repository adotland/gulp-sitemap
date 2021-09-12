/* global it,describe */
'use strict';

require('should');

const sitemap = require('../index');
const Vinyl = require('vinyl');

describe('mappings', function() {

    const dummyFile = {
        cwd: __dirname,
        base: __dirname,
        path: 'test/fixtures/test.html',
        contents: Buffer.from('hello there')
    };

    it('should not be affected if mappings does not match', function(cb) {
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            changefreq: 'daily',
            priority: '0.5',
            mappings: [{
                pages: ['*/*test2222.html'],
                changefreq: 'hourly',
                priority: 0.5
            }]
        });

        stream.on('data', function(data) {
            data.path.should.containEql('sitemap.xml');
            const contents = data.contents.toString();

            contents.should.containEql('test.html');
            contents.should.not.containEql('home.html');
            contents.should.containEql('<loc>http://www.amazon.com/fixtures/test.html</loc>');
            contents.should.containEql('<changefreq>daily</changefreq>');
            contents.should.containEql('<priority>0.5</priority>');
        }).on('end', cb);

        stream.write(new Vinyl(dummyFile));
        stream.end();
    });

    it('should work with mappings for files', function(cb) {
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            changefreq: 'daily',
            mappings: [{
                pages: ['*/*test.html'],
                changefreq: 'hourly',
                priority: 0.4
            }]
        });

        stream.on('data', function(data) {
            data.path.should.containEql('sitemap.xml');
            const contents = data.contents.toString();
            contents.should.containEql('test.html');
            contents.should.not.containEql('home.html');
            contents.should.containEql('<loc>http://www.amazon.com/fixtures/test.html</loc>');
            contents.should.containEql('<changefreq>hourly</changefreq>');
            contents.should.containEql('<priority>0.4</priority>');
        }).on('end', cb);

        stream.write(new Vinyl(dummyFile));
        stream.end();
    });

    it('only the first matching mappings will override a file', function(cb) {
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            mappings: [{
                pages: ['*/*test.html'],
                changefreq: 'hourly',
                priority: 0.4
            }, {
                pages: ['*/*test.html'],
                changefreq: 'yearly',
                priority: 0.2
            }]
        });

        stream.on('data', function(data) {
            const contents = data.contents.toString();
            contents.should.containEql('<changefreq>hourly</changefreq>');
            contents.should.containEql('<priority>0.4</priority>');
        }).on('end', cb);

        stream.write(new Vinyl(dummyFile));
        stream.end();
    });

    it('should not change a matching mapping if property is undefined', function(cb) {
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            mappings: [{
                pages: ['*/*test.html'],
                changefreq: 'hourly'
            }]
        });

        stream.on('data', function(data) {
            const contents = data.contents.toString();
            contents.should.containEql('<changefreq>hourly</changefreq>');
            contents.should.not.containEql('<priority>');
        }).on('end', cb);

        stream.write(new Vinyl(dummyFile));
        stream.end();
    });

    it('should be allowed to set priority 0 in mappings', function(cb) {
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            mappings: [{
                pages: ['*/*test.html'],
                changefreq: 'hourly',
                priority: 0
            }]
        });

        stream.on('data', function(data) {
            const contents = data.contents.toString();
            contents.should.containEql('<changefreq>hourly</changefreq>');
            contents.should.containEql('<priority>0</priority>');
        }).on('end', cb);

        stream.write(new Vinyl(dummyFile));
        stream.end();
    });

    it('should not set last mod with mappings', function(cb) {
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            lastmod: false,
            mappings: [{
                pages: ['*/*test.html'],
                lastmod: false,
            }]
        });

        stream.on('data', function(data) {
            const contents = data.contents.toString();
            contents.should.not.containEql('<lastmod>');
        }).on('end', cb);

        stream.write(new Vinyl(dummyFile));
        stream.end();
    });

    it('should set last mod with mappings', function(cb) {
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            lastmod: false,
            mappings: [{
                pages: ['*/*test.html'],
                lastmod: null,
            }]
        });

        stream.on('data', function(data) {
            const contents = data.contents.toString();
            const time = contents.match(/<lastmod>(.+)<\/lastmod>/i)[1];
            // make sure the tag exists
            contents.should.containEql('<lastmod>' + time + '</lastmod>');
        }).on('end', cb);

        stream.write(new Vinyl(dummyFile));
        stream.end();
    });

    it('should set href lang with mappings', function(cb) {
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            mappings: [{
                pages: ['*/*test.html'],
                hreflang: [{
                    lang: 'ru',
                    getHref: function(siteUrl, file, lang, loc) {
                        // jshint unused:false
                        return 'http://www.amazon.ru/' + file;
                    }
                }, {
                    lang: 'de',
                    getHref: function(siteUrl, file, lang, loc) {
                        // jshint unused:false
                        return 'http://www.amazon.de/' + file;
                    }
                }]
            }]
        });

        stream.on('data', function(data) {
            const contents = data.contents.toString();
            contents.should.match(/hreflang="ru"/i);
            contents.should.match(/www.amazon.ru/i);
            contents.should.match(/hreflang="de"/i);
            contents.should.match(/www.amazon.de/i);
            contents.should.containEql('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">');
        }).on('end', cb);

        stream.write(new Vinyl(dummyFile));
        stream.end();
    });

    it('should modify the loc with mappings', function(cb) {
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            mappings: [{
                pages: ['*/*test.html'],
                getLoc: function(siteUrl, loc) {
                    return loc.substr(0, loc.lastIndexOf('.')) || loc; // Removes the file extension
                }
            }]
        });

        stream.on('data', function(data) {
            const contents = data.contents.toString();
            contents.should.match(/\/test<\/loc>/i);
            contents.should.containEql('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
        }).on('end', cb);

        stream.write(new Vinyl(dummyFile));
        stream.end();
    });

    it('should map images too', function (cb) {

        const dummyFile = {
            cwd: __dirname,
            base: __dirname,
            path: 'test/fixtures/images.html',
            contents: Buffer.from('hello there')
        };

        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            images: true
        });

        stream.on('data', function(data) {
            const contents = data.contents.toString();

            contents.should.containEql('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">');
            contents.should.containEql('<image:loc>https://via.placeholder.com/300/09f/fff.png</image:loc>');
            contents.should.containEql('<image:loc>http://www.amazon.com/assets/images/placeholder.jpg</image:loc>');
            contents.should.containEql('<image:loc>https://via.placeholder.com/300/09f/000.png</image:loc>');
            contents.should.containEql('<image:loc>https://via.placeholder.com/300/09f/f5f.png</image:loc>');
            contents.should.containEql('<image:loc>http://www.amazon.com/assets/images/placeholder_small.jpg</image:loc>');
            contents.should.containEql('<image:loc>http://www.amazon.com/assets/images/placeholder-responsive@250.jpg</image:loc>');
            contents.should.containEql('<image:loc>http://www.amazon.com/assets/images/placeholder.jpg?cache=1&id=2</image:loc>');

        }).on('end', cb);

        stream.write(new Vinyl(dummyFile));

        stream.end();
    });

    it('should not map when not exist images', function (cb) {

        const dummyFile = {
            cwd: __dirname,
            base: __dirname,
            path: 'test/fixtures/test.html',
            contents: Buffer.from('hello there')
        };

        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            images: true
        });

        stream.on('data', function(data) {
            const contents = data.contents.toString();

            contents.should.not.containEql('<image:loc>');
            contents.should.not.containEql('</image:loc>');
            contents.should.not.containEql('<image:image>');
            contents.should.not.containEql('</image:image>');

        }).on('end', cb);

        stream.write(new Vinyl(dummyFile));

        stream.end();
    });

    it('should add propper video xmlns', function (cb) {

        const dummyFile = {
            cwd: __dirname,
            base: __dirname,
            path: 'test/fixtures/videos.html',
            contents: Buffer.from('hello there')
        };

        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            videos: true
        });

        stream.on('data', function(data) {
            const contents = data.contents.toString();

            contents.should.containEql('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">');

        }).on('end', cb);

        stream.write(new Vinyl(dummyFile));

        stream.end();
    });


    it('should add expanded urls for nested file', function (cb) {

        const dummyFile = {
            cwd: __dirname,
            base: __dirname,
            path: 'test/fixtures/videos/index.html',
            contents: Buffer.from('hello there')
        };

        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            expand: {
                'fixtures/videos/index.html': {
                    dataFile: 'test/fixtures/data/test.json',
                    key: 'title'
                }
            }
        });

        stream.on('data', function(data) {
            const contents = data.contents.toString();
            contents.should.containEql('<loc>http://www.amazon.com/fixtures/videos/lorem</loc>');
            contents.should.containEql('<loc>http://www.amazon.com/fixtures/videos/ipsum</loc>');

        }).on('end', cb);

        stream.write(new Vinyl(dummyFile));

        stream.end();
    });

    it('should add expanded urls for file', function (cb) {

        const dummyFile = {
            cwd: __dirname,
            base: __dirname,
            path: 'test/fixtures/videos.php',
            contents: Buffer.from('hello there')
        };

        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            expand: {
                'fixtures/videos.php': {
                    dataFile: 'test/fixtures/data/test.json',
                    key: 'title'
                }
            }
        });

        stream.on('data', function(data) {
            const contents = data.contents.toString();
            contents.should.containEql('<loc>http://www.amazon.com/fixtures/videos/lorem</loc>');
            contents.should.containEql('<loc>http://www.amazon.com/fixtures/videos/ipsum</loc>');

        }).on('end', cb);

        stream.write(new Vinyl(dummyFile));

        stream.end();
    });
});
