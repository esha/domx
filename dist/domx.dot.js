/*! domx - v0.17.0 - 2016-09-22
* http://esha.github.io/domx/
* Copyright (c) 2016 ESHA Research; Licensed MIT, GPL */

(function(D) {
    "use strict";

    // shortcuts
    var X = D.x,
        _ = X._;

// dot.js
_.defprop(D, 'html', D.documentElement);
var dot = _.dot = {
    names: { 3: '$text', 8: '$comment', 7: '$procins' },
    fns: {},
    fn: function(type, name) {
        return dot.fns[name] || (dot.fns[name] =
            type === 1 ?
                function elements() {
                    return this.each('children').only(name).dot();
                } :
                function nodes() {
                    return this.each('childNodes').only('nodeType', type);
                }
        );
    },
    init: function() {
        D.queryAll('[x-dot]').each(function(el) {
            el.dot(true);
            if (Observer && !el._observer) {
                (el._observer = new Observer(function(changes) {
                    for (var i=0,m=changes.length; i<m; i++) {
                        changes[i].target.dot(true);
                    }
                })).observe(el, { childList: true, subtree: true });
            }
        });
    }
},
Observer = window.MutationObserver;

_.define(X.containers, 'dot', function(force) {
    var self = this;
    if (force || !self._dotted) {
        self.each('childNodes').each(function(node) {
            var type = node.nodeType,
                name = dot.names[type] || node.tagName.toLowerCase();
            if (!(name in self)) {
                _.defprop(self, name, { get: dot.fn(type, name) });
            }
            if (type === 1) {
                node.dot();
            }
        });
        _.defprop(self, '_dotted', true);
    }
    return self;
});

dot.init();// early availability
D.addEventListener('DOMContentLoaded', dot.init);// eventual consistency
// /dot.js

})(document);
