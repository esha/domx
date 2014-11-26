// elements.js
var E = _.elements = {
    protos: [Element, DocumentFragment].concat(X.sets),
    read: function(el) {
        for (var i=0; el && i < el.children.length; i++) {
            var child = el.children[i],
                name = child.tagName.toLowerCase();
            if (!(name in D.head)) {
                E.fn(name, 'children', 'tagName', child.tagName);
            }
            E.read(child);// recurse down the tree
        }
    },
    fn: function(name, set, prop, value) {
        _.define(E.protos, name, {
            get: function nodes() {
                return this.each(set).only(prop, value);
            }
        });
    }
};
E.fn('$text', 'childNodes', 'nodeType', 3);
E.fn('$comment', 'childNodes', 'nodeType', 8);

// early availability
_.defprop(D, 'html', D.documentElement);
E.read(D.head);
E.read(D.body);
// eventual consistency
D.addEventListener('DOMContentLoaded', function() {
    E.read(D.body);
    if (window.MutationObserver) {
        new MutationObserver(function(mutations) {
            for (var i=0,m=mutations.length; i<m; i++) {
                E.read(mutations[i].target);
            }
        }).observe(D.body, { childList: true, subtree: true });
    }
});
// /elements.js