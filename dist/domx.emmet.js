/*! domx - v0.17.0 - 2016-09-22
* http://esha.github.io/domx/
* Copyright (c) 2016 ESHA Research; Licensed MIT, GPL */

(function(D) {
    "use strict";

    // shortcuts
    var X = D.x,
        _ = X._;

// emmet.js
var I = _.insert;
I.create = function(node, code, ref) {
    var parts = code.split(I.emmetRE()),
        root = D.createDocumentFragment(),
        el = D.createElement(parts[0]);
    root.appendChild(el);
    for (var i=1,m=parts.length; i<m; i++) {
        var part = parts[i];
        el = I.emmet[part.charAt(0)].call(el, part.substr(1), root) || el;
    }
    I.insert(node, root, ref);
    return el;
};
I.emmetRE = function() {
    var chars = '\\'+Object.keys(I.emmet).join('|\\');
    return new RegExp('(?='+chars+')','g');
};
I.emmet = {
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
        return I.emmet['>'].call(this.parentNode || root, tag);
    },
    '*': function(count) {
        var parent = this.parentNode,
            els = new X.List(this);
        for (var i=1; i<count; i++) {
            els.add(this.cloneNode(true));
            parent.appendChild(els[i]);
        }
        //TODO: numbering for els
        return els;
    },
    '^': function(tag, root) {
        return I.emmet['+'].call(this.parentNode || root, tag, root);
    },
    '{': function(text) {
        this.appendChild(D.createTextNode(text.substr(0, text.length-1)));
    }
};
// /emmet.js


})(document);
