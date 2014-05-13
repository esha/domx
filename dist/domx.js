/*! domx - v0.7.1 - 2014-05-13
* http://esha.github.io/domx/
* Copyright (c) 2014 ESHA Research; Licensed MIT, GPL */

(function(D, _) {
    "use strict";

// core.js
function XList(limit) {
    if (typeof limit === "number") {
        this.limit = limit;
        this.add(_.slice(arguments, 1));
    } else {
        this.add(arguments);
    }
}

// expose utilities
_ = {
    version: "0.7.1",
    slice: Array.prototype.slice,
    noop: function(){},
    List: XList,
    nodes: [Element, Text, Comment],
    lists: [NodeList, HTMLCollection, XList],
    isList: function(o) {
        return (o && typeof o === "object" && 'length' in o && !o.nodeType) ||
               o instanceof NodeList ||// phantomjs foolishly calls these functions
               o instanceof HTMLCollection;
    },
    fn: function(targets, name, value) {
        if (typeof name === "string") {
            for (var i=0,m=targets.length; i<m; i++) {
                _.define(targets[i].prototype || targets[i], name, value);
            }
        } else {
            for (var key in name) {// name must be a key/val object
                _.fn(targets, key, name[key]);
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
            if (typeof val === "function" && val.apply) {
                return val.apply(el, args);
            }
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
_.define(D, '_', _);

// define foundation on nodes and lists
_.fn(_.nodes.concat(_.lists), {
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
});

// define XList functions
_.fn([XList], {
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
});

_.define(D, 'extend', function(name, fn, singles) {
    _.fn(singles || [Element], name, fn);
    _.fn(_.lists, name, function listFn() {
        var args = arguments;
        return this.each(function eachFn() {
            return fn.apply(this, args);
        });
    });
});
// /core.js

// traverse.js
_.parents = [Element, DocumentFragment, D];
_.fn(_.parents.concat(_.lists), {
    queryAll: function(selector, count) {
        var self = _.isList(this) ? this : [this],
            list = new _.List(count);
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
_.fn(_.lists, 'only', function only(b, e) {
    var arr = this.toArray(),
        num = b >= 0 || b < 0,
        solo = arguments.length === 1;
    arr = num ? arr.slice(b, e || (b + 1) || undefined) :
                arr.filter(
                    typeof b === "function" ? b :
                    solo ? function match(el){ return el.matches(b); } :
                           function eachVal(el){ return el.each(b) === e; }
                );
    return num && solo ? arr[0] : new _.List(arr);
});

// ensure element.matches(selector) availability
var Ep = Element.prototype,
    aS = 'atchesSelector';
_.define(Ep, 'matches', Ep['m'] || Ep['webkitM'+aS] || Ep['mozM'+aS] || Ep['msM'+aS]);
// /traverse.js

// alter.js
var A = _.add = {
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

D.extend('add', function(arg, ref) {
    if (typeof arg === "string") {// turn arg into an appendable
        return A.create(this, arg, ref);
    }
    if (_.isList(arg)) {// list of append-ables
        var list = new _.List();
        for (var i=0,m=arg.length; i<m; i++) {
            list.add(this.add(arg[i], ref));
        }
        return list;
    }
    A.insert(this, arg, ref);// arg is an append-able
    return arg;
}, _.parents);

D.extend('remove', function() {
    var parent = this.parentNode;
    if (parent) {
        parent.removeChild(this);
    }
}, _.nodes);
// /alter.js

_.fn(_.nodes, 'value', {
    get: function() {
        var value = (_.get[this.tagName] || _.get).call(this, this);
        if (value) {
            try{ value = JSON.parse(value); }catch(e){}
        }
        return value;
    },
    set: function(value) {
        if (value && typeof value !== "string") {
            try{ value = JSON.stringify(value); }catch(e){}
        }
        return (_.set[this.tagName] || _.set).call(this, this, value);
    }
});
_.get = function(node) {
    return node.nodeValue ||
        (node.hasAttribute && node.hasAttribute('value') ?
            node.getAttribute('value') :
            (node.children && node.children.length ?
                node.innerHTML :
                node.textContent
            )
        );
};
_.set = function(node, value) {
    if (!node.hasAttribute) {
        node.nodeValue = value;
    } else if (node.hasAttribute('value')) {
        node.setAttribute('value', value);
    } else if (value && value.trim().charAt(0) === '<') {
        node.innerHTML = value;
    } else {
        node.textContent = value;
    }
};
var R = _.repeat = {
    id: 'data-repeat-id',
    count: 0,
    init: function(el, keep) {
        var selector = el.getAttribute('data-repeat'),
            id = R.count++,
            source = selector && D.query(selector).cloneNode(true) || el,
            anchor = D.createElement('x-repeat');
        source.setAttribute(R.id, id);
        anchor.setAttribute(R.id, id);
        for (var i=0,m=el.attributes.length; i<m; i++) {
            var attr = el.attributes[i];
            if (attr.name === 'data-repeat-none') {
                anchor.value = attr.value || el.innerHTML;
            }
            anchor.setAttribute(attr.name, attr.value);
        }
        el.parentNode.insertBefore(anchor, el);
        _.define(anchor, 'source', source);
        if (keep !== true) {
            el.remove();
        }
        return id;
    },
    repeat: function(parent, anchor, source, val) {
        var repeat = source.cloneNode(true);
        if (val !== undefined && val !== null) {
            repeat.value = val;
        }
        parent.insertBefore(repeat, anchor);
        return repeat;
    },
    style: D.head.add('style')
};

D.extend('repeat', function repeat(val) {
    var parent = this.parentNode,
        id = this.getAttribute(R.id) || R.init(this, true),
        selector = '['+R.id+'="'+id+'"]',
        selectAll = selector+':not(x-repeat)';
    if (val === false) {
        return parent.queryAll(selectAll).remove();
    }
    var anchor = parent.query('x-repeat'+selector),
        source = anchor.source;
    if (anchor.hasAttribute('data-repeat-first')) {
        anchor = parent.query(selector+'[data-index]') || anchor;
    }
    var ret = Array.isArray(val) ?
        val.map(function(v){ return R.repeat(parent, anchor, source, v); }) :
        R.repeat(parent, anchor, source, val);
    parent.queryAll(selectAll).each('setAttribute', 'data-index', '${i}');
    return ret;
});

R.style.value = '[data-repeat] { display: none }';
D.addEventListener('DOMContentLoaded', function() {
    D.queryAll('[data-repeat]').each(R.init);
    R.style.value = "\nx-repeat { display: none }"+
                    "\nx-repeat[data-repeat-none] { display: inline-block; }"+
                    "\n["+R.id+"] + x-repeat[data-repeat-none] { display: none; }";
});

// emmet.js
var AE = _.add;
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
            els = new D._.List(this);
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

// elements.js
var E = _.elements = {
    protos: [Element, DocumentFragment].concat(_.lists),
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
        _.fn(E.protos, name, {
            get: function nodes() {
                return this.each(set).only(prop, value);
            }
        });
    }
};
E.fn('$text', 'childNodes', 'nodeType', 3);
E.fn('$comment', 'childNodes', 'nodeType', 8);

// early availability
_.define(D, 'html', D.documentElement);
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


})(document);
