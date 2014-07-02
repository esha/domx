/*! domx - v0.10.0 - 2014-07-02
* http://esha.github.io/domx/
* Copyright (c) 2014 ESHA Research; Licensed MIT, GPL */

(function(D, _) {
    "use strict";

// core.js
window.DOMxList = function DOMxList(limit) {
    if (typeof limit === "number") {
        this.limit = limit;
        this.add(_.slice(arguments, 1));
    } else {
        this.add(arguments);
    }
};

// expose utilities
_ = {
    version: "0.10.0",
    slice: Array.prototype.slice,
    zero: function(){ return 0; },
    nodes: [Element, Text, Comment],
    lists: [NodeList, HTMLCollection, DOMxList],
    isList: function(o) {
        return (o && typeof o === "object" && 'length' in o && !o.nodeType) ||
               o instanceof NodeList ||// phantomjs foolishly calls these functions
               o instanceof HTMLCollection;
    },
    define: function(targets, name, value, force) {
        if (typeof name === "string") {
            for (var i=0,m=targets.length; i<m; i++) {
                _.defprop(targets[i].prototype || targets[i], name, value, force);
            }
        } else {
            for (var key in name) {// name is key/val object, value is force
                _.define(targets, key, name[key], value);
            }
        }
    },
    defprop: function(o, key, val, force) {
        if (force || !(key in o)) { try {// never redefine, never fail
            var opts = val.get || val.set ? val : {value:val, writable:true};
            opts.configurable = true;
            Object.defineProperty(o, key, opts);
        } catch (e) {} }
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
            if (typeof val === "function" && val.apply) {
                return val.apply(el, args);
            }
            else if (args) { el[key] = args[0]; }
            else { return val; }
        }
        else if (_el.nodeType === 1) {
            if (args) {
                if (args[0] === null) {
                    _el.removeAttribute(_key);
                } else {
                    _el.setAttribute(_key, args[0]);
                }
            } else {
                return _el.getAttribute(_key);
            }
        }
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
_.defprop(D, '_', _);

// define foundation on Node and lists
_.define([Node].concat(_.lists), {
    each: function(fn) {
        var self = _.isList(this) ? this : [this],
            results = [],
            prop, args;
        if (typeof fn === "string") {
            prop = _.resolve[fn] || fn;// e.g. _.resolve['+class'] = 'classList.add';
            args = _.slice.call(arguments, 1);
            fn = function(el, i){ return _.resolve(prop, el, args, i); };
        }
        for (var i=0,m=self.length, result; i<m; i++) {
            result = fn.call(self[i], self[i], i, self);
            if (result || (prop && result !== undefined)) {
                results.push(result);
            }
        }
        return !results.length ? this : // no results, be fluent
            !_.isList(this) ? results[0] : // single source, single result
            results[0] && results[0].each ? new DOMxList(results) : // convert to DOMx (combines sub-lists)
            results;
    },
    toArray: function(arr) {
        arr = arr || [];
        if (_.isList(this)) {
            for (var i=0,m=this.length; i<m; i++) {
                arr.push(this[i]);
            }
        } else {
            arr.push(this);
        }
        return arr;
    }
});

// define DOMxList functions
_.define([DOMxList], {
    length: 0,
    limit: -1,
    add: function(item) {
        var l = this.length;
        if (arguments.length > 1 || _.isList(item)) {
            var list = arguments.length > 1 ? arguments : item;
            for (var i=0,m=list.length; i<m; i++) {
                this.add(list[i]);
            }
        } else if (item !== null && item !== undefined && this.indexOf(item) < 0) {
            this[this.length++] = item;
            if (this.length === this.limit) {
                this.add = _.zero;
            }
        }
        return this.length - l;
    },
    indexOf: function(item) {
        for (var i=0; i<this.length; i++) {
            if (item === this[i]) {
                return i;
            }
        }
        return -1;
    }
});

_.defprop(D, 'extend', function(name, fn, singles, force) {
    if (!Array.isArray(singles)) {
        force = singles;
        singles = [Element];
    }
    _.define(singles, name, fn, force);
    _.define(_.lists, name, function listFn() {
        var args = arguments;
        return this.each(function eachFn() {
            return fn.apply(this, args);
        });
    }, force);
});
// /core.js

// traverse.js
_.parents = [Element, DocumentFragment, D];
_.define(_.parents.concat(_.lists), {
    queryAll: function(selector, count) {
        var self = _.isList(this) ? this : [this],
            list = new DOMxList(count);
        for (var i=0, m=self.length; i<m && (!count || count > list.length); i++) {
            list.add(self[i][
                count === list.length+1 ? 'querySelector' : 'querySelectorAll'
            ](selector));
        }
        return list;
    },
    query: function(selector) {
        return this.queryAll(selector, 1)[0];
    }
});

_.define(_.lists, {
    only: function only(b, e) {
        var arr = this.toArray();
        arr = b >= 0 || b < 0 ?
            arr.slice(b, e || (b + 1) || undefined) :
            arr.filter(
                typeof b === "function" ?
                    b :
                    arguments.length === 1 ?
                        function match(n) {
                            return n[n.matches ? 'matches' : 'hasOwnProperty'](b);
                        } :
                        function eachVal(n) {
                            return (n.each ? n.each(b) : n[b]) === e;
                        }
            );
        return new DOMxList(arr);
    },
    not: function not() {
        var exclude = this.only.apply(this, arguments);
        return this.only(function(n) {
            return exclude.indexOf(n) < 0;
        });
    }
});

_.utmost = function(node, prop, previous) {
    return node && (node = node[prop]) ?
        _.utmost(node, prop, node) :
        previous || node;
};
_.define(_.nodes, 'utmost', function(prop) {
    return _.utmost(this, _.resolve[prop] || prop);
});

D.extend('all', function(prop, fn, inclusive, _list) {
    if (fn === true){ inclusive = fn; fn = undefined; }
    _list = _list || new DOMxList();

    var value = inclusive ? this : this[_.resolve[prop] || prop];
    if (value) {
        var result = fn && fn.call(this, value, _list);
        if (result !== null) {
            _list.add(result || value);
        }
        if (value.all && (value.length || !_.isList(value))) {
            value.all(prop, fn, false, _list);
        }
    }
    return _list;
}, [Node]);

// ensure element.matches(selector) availability
var Ep = Element.prototype,
    aS = 'atchesSelector';
_.defprop(Ep, 'matches', Ep['m'] || Ep['webkitM'+aS] || Ep['mozM'+aS] || Ep['msM'+aS]);
// /traverse.js


})(document);
