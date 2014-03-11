(function(window, D, Observer) {
    "use strict";

    var _ = {
        version: "<%= pkg.version %>",
        slice: Array.prototype.slice,
        list: function(list, force) {
            if (list.length === 1){ return _.node(list[0], force); }
            if (force || !list.each) {
                if (!list.slice){ list = _.slice.call(list); }
                _.methods(list);
                if (list.length){ _.children(list[0], list); }// proxy dot-traversal into first element
            }
            return list;
        },
        node: function(node, force) {
            if (force || !node.each) {
                _.methods(node);
                _.children(node);
            }
            return node;
        },
        methods: function(o) {
            for (var method in _.fn) {
                _.define(o, method, _.fn[method]);
            }
        },
        children: function(node, list) {
            var children = node._children = {};
            for (var i=0, m=node.childNodes.length; i<m; i++) {
                var child = node.childNodes[i],
                    key = _.key(child);
                (children[key]||(children[key]=[])).push(child);
                _.define(node, key);
                if (list){ _.define(list, key, undefined, node); }
            }
            return children;
        },
        key: function(node) {
            return node.tagName ? node.tagName.toLowerCase() : '_other';
        },
        define: function(o, key, val, node) {
            if (!(key in o)) { try {// never redefine, never fail
                node = node || o;// children needn't belong to define's target
                Object.defineProperty(o, key,
                    val !== undefined ? { value: val } :
                    {
                        get: function() {
                            if (!node._children){ _.children(node); }
                            return _.list(node._children[key]||[]);
                        }
                    }
                );
            } catch (e) {} }
        },
        mutation: function(e) {
            var node = e.target;// only wipe cache for 3rd party changes
            delete node[node._internal ? '_internal' : '_children'];
        },
        unique: function(node, i, arr){ return arr.indexOf(node) === i; },
        fn: {
            each: function(fn) {
                var self = this.forEach ? this : [this],
                    results = [],
                    prop, args;
                if (typeof fn === "string") {
                    prop = _.resolve[fn] || fn;// e.g. _.resolve['+class'] = 'classList.add';
                    args = _.slice.call(arguments, 1);
                    fn = function(el, i){ return _.resolve(prop, el, args, i); };
                }
                for (var i=0,m=self.length, result; i<m; i++) {
                    result = fn.call(self, _.node(self[i]), i, self);
                    if (result || (prop && result !== undefined)) {
                        if (result.forEach) {
                            results.push.apply(results, result);
                        } else {
                            results.push(result);
                        }
                    }
                }
                return !results[0] && results[0] !== false ? this :
                    results[0].matches ? _.list(results.filter(_.unique)) :
                    //self.length === 1 ? results[0] :
                    results;
            },
            find: function() {
                try{ window.console.warn('find() is deprecated. Please use query().'); }
                finally{ return this.query.apply(this, arguments); }
            },
            query: function(selector, count) {
                var self = this.forEach ? this : [this];
                for (var list=[], i=0, m=self.length; i<m && (!count || list.length < count); i++) {
                    if (count === list.length + 1) {
                        var node = self[i].querySelector(selector);
                        if (node){ list.push(node); }
                    } else {
                        var nodes = self[i].querySelectorAll(selector);
                        for (var j=0, l=nodes.length; j<l && (!count || list.length < count); j++) {
                            list.push(nodes[j]);
                        }
                    }
                }
                return _.list(list);
            },
            only: function(b, e) {
                var self = this.forEach ? this : [this];
                return _.list(
                    b >= 0 || b < 0 ?
                        self.slice(b, e || (b + 1) || undefined) :
                        self.filter(
                            typeof b === "function" ? b :
                            function(el){ return el.matches(b); }
                        )
                );
            }
        },
        resolve: function(_key, _el, args, i) {
            var key = _key, el = _el;// copy prefixed originals so we can recover them if need be
            args = args.length ? _.fill(args, i, el) : null;
            if (key.indexOf('.') > 0) {
                var keys = key.split('.');
                while (keys.length > 1 && (el = el[key = keys.shift()])){}
                // if lookup failed, reset to originals
                el = el || _el;
                key = el ? keys[0] : _key;
            }
            var val = el[key];
            if (val !== undefined) {
                if (typeof val === "function") { return val.apply(el, args); }
                else if (args) { el[key] = args[0]; }
                else { return val; }
            }
            else if (args) {
                if (args[0] === null){ _el.removeAttribute(_key); }
                else { _el.setAttribute(_key, args[0]); }
            } else { return _el.getAttribute(_key); }
        },
        fill: function(args, index, el) {
            var ret = [];
            for (var i=0,m=args.length; i<m; i++) {
                var arg = args[i],
                    type = typeof arg;
                ret[i] = type === "string" ? arg.replace(/\$\{i\}/g, index) :
                         type === "function" ? arg(el, index, args) :
                         arg;
            }
            return ret;
        }
    };

    _.node(D);
    _.define(D, '_', _);
    _.define(D, 'ify', function(o, force) {
        return !o || 'length' in o ? _.list(o||[], force) : _.node(o, force);
    });
    // ensure element.matches(selector) availability
    var Ep = Element.prototype,
        aS = 'atchesSelector';
    _.define(Ep, 'matches', Ep['m'] || Ep['webkitM'+aS] || Ep['mozM'+aS] || Ep['msM'+aS]);
    // watch for changes in children
    if (Observer) {
        new Observer(function(list){ list.forEach(_.mutation); })
            .observe(D, { childList: true, subtree: true });
    } else {
        D.addEventListener("DOMSubtreeModified", _.mutation);
    }
    // export 
    if (typeof define === 'function' && define.amd) {
        define(function(){ return D; });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = D;
    } else {
        window[D.html.getAttribute('data-domx-reference')||'D'] = D;
    }
    // eventual consistency
    D.addEventListener("DOMContentLoaded", function() {
        _.node(D, true);
        _.node(D.html, true);
    });

})(window, document, window.MutationObserver);
