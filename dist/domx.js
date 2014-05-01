/*! domx - v0.1.0 - 2014-05-01
* http://nbubna.github.io/domx/
* Copyright (c) 2014 ESHA Research; Licensed MIT, GPL */
(function(D) {
    "use strict";

    function List() {
        this.length = 0;
        this.add(arguments);
    }

    var _ = {
        version: "0.1.0",
        slice: Array.prototype.slice,
        List: List,
        singles: [Element],
        lists: [NodeList, HTMLCollection, List],
        isList: function(o) {
            return (o && typeof o === "object" && 'length' in o) ||
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
                var opts = val.get || val.set ? val : { value: val };
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
                result = fn.call(self, self[i], i, self);
                if (result || (prop && result !== undefined)) {
                    results.push(result);
                }
            }
            return !results.length ? this :
                !_.isList(this) ? results[0] :
                results[0] instanceof Node ? new _.List(results) :
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
    _.define(List.prototype, 'add', function(list) {
        list = arguments.length < 2 && _.isList(list) ? list : arguments;
        for (var i=0,m=list.length; i<m; i++) {
            var item = list[i];
            if (_.isList(item)) {
                this.add(item);
            } else if (this.indexOf(item) < 0) {
                this[this.length++] = item;
            }
        }
    });
    _.define(List.prototype, 'indexOf', function(item) {
        for (var i=0; i<this.length; i++) {
            if (item === this[i]) {
                return i;
            }
        }
        return -1;
    });

    // extend the DOM!
    _.define(D, '_', _);
    _.fn(_.core);

})(document);

(function(D) {
    "use strict";

    var _ = D._;
    _.traverse = {
        find: function(selector, count) {
            var self = _.isList(this) ? this : [this],
                list = new _.List();
            for (var i=0, m=self.length; i<m && (!count || list.length < count); i++) {
                if (count === list.length + 1) {
                    var node = self[i].querySelector(selector);
                    if (node){ list.add(node); }
                } else {
                    var nodes = self[i].querySelectorAll(selector);
                    for (var j=0, l=nodes.length; j<l && (!count || list.length < count); j++) {
                        list.add(nodes[j]);
                    }
                }
            }
            return list;
        },
        findOne: function(selector) {
            return this.find(selector, 1)[0];
        },
        only: function(b, e) {
            var arr = this.toArray();
            return new _.List(b >= 0 || b < 0 ?
                arr.slice(b, e || (b + 1) || undefined) :
                arr.filter(
                    typeof b === "function" ? b : function(el){ return el.matches(b); }
                )
            );
        }
    };

    _.define(D, 'find', _.traverse.find);
    _.define(D, 'findOne', _.traverse.findOne);
    _.fn('find', _.traverse.find);
    _.fn('findOne', _.traverse.findOne);
    _.fn('only', _.traverse.only, _.lists);

    // ensure element.matches(selector) availability
    var Ep = Element.prototype,
        aS = 'atchesSelector';
    _.define(Ep, 'matches', Ep['m'] || Ep['webkitM'+aS] || Ep['mozM'+aS] || Ep['msM'+aS]);

})(document);
(function(D) {
    "use strict";

    var _ = D._;
    var A = _.add = {
        fn: function(arg, ref) {
            if (_.isList(this)) {
                return this.each(function(el){ return A.all(el, arg, ref); });
            }
            return A.all(this, arg, ref);
        },
        all: function(node, arg, ref) {
            if (typeof arg === "string") {// turn arg into an appendable
                return A.create(node, arg, ref);
            }
            if (_.isList(arg)) {// list of append-ables
                var list = new _.List();
                for (var i=0,m=arg.length; i<m; i++) {
                    list.add(A.all(node, arg[i], ref));
                }
                return list;
            }
            A.insert(node, arg, ref);// arg is an append-able
            return arg;
        },
        create: function(node, tag, ref) {
            return A.insert(node, D.createElement(tag), ref);
        },
        insert: function(node, child, ref) {
            var sibling = A.find(node, ref);
            if (sibling) {
                node.insertBefore(child, sibling);
            } else {
                node.appendChild(child);
            }
            return child;
        },
        find: function(node, ref) {
            switch (typeof ref) {
                case "string": return node[ref+'Child'];
                case "number": return node.children[ref];
                case "object": return ref;
                case "function": return ref.call(node, node);
            }
        }
    };
    _.fn('add', A.fn);
    _.fn('remove', function(chain) {
        return this.each(function(node) {
            var parent = node.parentNode;
            if (parent) {
                parent.removeChild(node);
                if (chain){ return parent; }
            }
        });
    });

})(document);

(function(D) {
    "use strict";

    var _ = D._,
        A = _.add;
    A.create = function(node, code, ref) {
        var parts = code.split(A.emmetRE()),
            root = D.createDocumentFragment(),
            el = D.createElement(parts[0]);
        root.appendChild(el);
        for (var i=1,m=parts.length; i<m; i++) {
            var part = parts[i];
            el = A.emmet[part.charAt(0)].call(el, part.substr(1), root) || el;
        }
        A.insert(node, root, ref);
        return el;
    };
    A.emmetRE = function() {
        var chars = '\\'+Object.keys(A.emmet).join('|\\');
        return new RegExp('(?='+chars+')','g');
    };
    A.emmet = {
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
            return A.emmet['>'].call(this.parentNode || root, tag);
        },
        '*': function(count) {
            var parent = this.parentNode,
                els = new _.List(this);
            for (var i=1; i<count; i++) {
                els.add(this.cloneNode(true));
                parent.appendChild(els[i]);
            }
            //TODO: numbering for els
            return els;
        },
        '^': function(tag, root) {
            return A.emmet['+'].call(this.parentNode || root, tag, root);
        },
        '{': function(text) {
            this.appendChild(D.createTextNode(text.substr(0, text.length-1)));
        }
    };

})(document);
