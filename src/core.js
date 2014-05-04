(function(D) {
    "use strict";

    function List(limit) {
        if (typeof limit === "number") {
            this.limit = limit;
            this.add(_.slice(arguments, 1));
        } else {
            this.add(arguments);
        }
    }

    var _ = {
        version: "<%= pkg.version %>",
        slice: Array.prototype.slice,
        noop: function(){},
        List: List,
        singles: [Element],
        lists: [NodeList, HTMLCollection, List],
        isList: function(o) {
            return (o && typeof o === "object" && 'length' in o && !o.nodeType) ||
                   o instanceof NodeList ||// phantomjs foolishly calls these functions
                   o instanceof HTMLCollection;
        },
        fn: function(name, value, set) {
            if (typeof name !== "string") {
                var o = name;
                for (name in o) {
                    _.fn(name, o[name], value||set);
                }
                return o;
            }
            if (!set) {
                _.fn(name, value, _.singles);
                _.fn(name, value, _.lists);
            } else {
                for (var i=0,m=set.length; i<m; i++) {
                    _.define(set[i].prototype || set[i], name, value);
                }
            }
        },
        define: function(o, key, val) {
            if (!(key in o)) { try {// never redefine, never fail
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
    _.core = {
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
                results[0].toArray ? new _.List(results) : // convert array to DOMx (and combine sub-lists)
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
    };

    // define List functions
    _.fn({
        length: 0,
        limit: -1,
        add: function(item) {
            if (arguments.length > 1 || _.isList(item)) {
                var list = arguments.length > 1 ? arguments : item;
                for (var i=0,m=list.length; i<m; i++) {
                    this.add(list[i]);
                }
            } else if (item !== null && item !== undefined && this.indexOf(item) < 0) {
                this[this.length++] = item;
                if (this.length === this.limit) {
                    this.add = _.noop;
                }
            }
        },
        indexOf: function(item) {
            for (var i=0; i<this.length; i++) {
                if (item === this[i]) {
                    return i;
                }
            }
            return -1;
        }
    }, [List]);

    // extend the DOM!
    _.define(D, '_', _);
    _.define(D, 'extend', function(name, fn) {
        _.fn(name, fn, _.singles);
        _.fn(name, function extendFn() {
            var args = arguments;
            return this.each(function eachFn() {
                return fn.apply(this, args);
            });
        }, _.lists);
    });
    _.fn(_.core);

})(document);
