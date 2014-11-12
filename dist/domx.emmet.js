/*! domx - v0.13.1 - 2014-11-12
* http://esha.github.io/domx/
* Copyright (c) 2014 ESHA Research; Licensed MIT, GPL */

(function(D, _) {
    "use strict";

// emmet.js
var AE = _.append;
AE.create = function(node, code, ref) {
    var parts = code.split(AE.emmetRE()),
        root = D.createDocumentFragment(),
        el = D.createElement(parts[0]);
    root.appendChild(el);
    for (var i=1,m=parts.length; i<m; i++) {
        var part = parts[i];
        el = AE.emmet[part.charAt(0)].call(el, part.substr(1), root) || el;
    }
    AE.insert(node, root, ref);
    return el;
};
AE.emmetRE = function() {
    var chars = '\\'+Object.keys(AE.emmet).join('|\\');
    return new RegExp('(?='+chars+')','g');
};
AE.emmet = {
    '#': function(id) {
        this.id = id;
    },
    '.': function(cls) {
        var list = this.getAttribute('class') || '';
        list = list + (list ? ' ' : '') + cls;
        this.setAttribute('class', list);
    },
    '[': function(attrs) {
        attrs = attrs.substr(0, attrs.length-1).match(/(?:[^\s"]+|"[^"]*")+/g);
        for (var i=0,m=attrs.length; i<m; i++) {
            var attr = attrs[i].split('=');
            this.setAttribute(attr[0], (attr[1] || '').replace(/"/g, ''));
        }
    },
    '>': function(tag) {
        if (tag) {
            var el = D.createElement(tag);
            this.appendChild(el);
            return el;
        }
        return this;
    },
    '+': function(tag, root) {
        return AE.emmet['>'].call(this.parentNode || root, tag);
    },
    '*': function(count) {
        var parent = this.parentNode,
            els = new XList(this);
        for (var i=1; i<count; i++) {
            els.add(this.cloneNode(true));
            parent.appendChild(els[i]);
        }
        //TODO: numbering for els
        return els;
    },
    '^': function(tag, root) {
        return AE.emmet['+'].call(this.parentNode || root, tag, root);
    },
    '{': function(text) {
        this.appendChild(D.createTextNode(text.substr(0, text.length-1)));
    }
};
// /emmet.js


})(document, document._);
