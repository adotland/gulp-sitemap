const URLSET_OPEN = '<urlset';
const URLSET_CLOSE = '</urlset>';

const XML_NAMESPACE = {
    sitemap: 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    xhtml: 'xmlns:xhtml="http://www.w3.org/1999/xhtml"',
    image: 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
    video: 'xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"'
}

const DEFAULT_ATTRIBUTES = ['sitemap'];

class UrlSet {

    constructor() {
        this.attributes = [...DEFAULT_ATTRIBUTES];
    }

    // build tag with attributes
    get() {
        return URLSET_OPEN + this.attributes.reduce((prev, curr) => `${prev} ${XML_NAMESPACE[curr]}`, '') + '>';
    }

    // add xmlns attributes with no duplicates
    addXmlns(name) {
        if (XML_NAMESPACE.hasOwnProperty(name) && !this.attributes.includes(name)) {
            this.attributes.push(name);
        } else {
            return false;
        }
    }

    reset() {
        this.attributes = [...DEFAULT_ATTRIBUTES];
    }
}

module.exports = {
    UrlSet,
    URLSET_CLOSE
}
