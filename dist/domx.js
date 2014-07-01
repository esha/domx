/*! domx - v0.9.1 - 2014-06-30
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
    version: "0.9.1",
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

// append.js
var A = _.append = {
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
            case "string": return node[ref] || node.only(ref);
            case "number": return node.children[ref];
            case "object": return ref;
            case "function": return ref.call(node, node);
        }
    }
};

D.extend('append', function(arg, ref) {
    if (typeof arg === "string") {// turn arg into an appendable
        return A.create(this, arg, ref);
    }
    if (_.isList(arg)) {// list of append-ables
        var list = new DOMxList();
        for (var i=0,m=arg.length; i<m; i++) {
            list.add(this.append(arg[i], ref));
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
// /append.js

var V = _.values = {
    /*jshint evil:true */
    resolve: function(context, reference) {
        return eval('context'+(reference.charAt(0) !== '[' ? '.'+reference : reference));
    },
    parse: function(value) {
        if (typeof value === "string") {
            try {
                value = JSON.parse(value);
            } catch (e) {}
        } else if (Array.isArray(value)) {
            value = value.map(V.parse);
        }
        return value;
    },
    string: function(value) {
        if (value !== undefined && typeof value !== "string") {
            try {
                value = JSON.stringify(value);
            } catch (e) {
                value = value+'';
            }
        }
        return value;
    },
    nameNodes: function(parent, nameFn, possibleParentFn, attrFn) {
        var done = [];
        for (var i=0; i<parent.childNodes.length; i++) {
            var node = parent.childNodes[i],
                name = node.name,
                nodeValue = null;
            if (name && done.indexOf(node) < 0) {
                done.push(node);
                nodeValue = nameFn(name, node);
            } else if (possibleParentFn && !node.useSimpleValue()) {
                possibleParentFn(node);
            }
            if (node.useAttrValues) {
                for (var a=0; a < node.attributes.length; a++) {
                    attrFn(node.attributes[a], nodeValue);
                }
            }
        }
    },
    combine: function(oldValue, newValue) {
        if (oldValue === undefined || oldValue === newValue) {
            return newValue;
        }
        if (Array.isArray(oldValue)) {
            if (oldValue.indexOf(newValue) < 0) {
                oldValue.push(newValue);
            }
            return oldValue;
        }
        return [oldValue, newValue];
    },
    getNameValue: function(parent, value) {
        V.nameNodes(parent, function(name, node) {
            return value[name] = V.combine(value[name], node.nameValue);
        }, function(possibleParent) {
            V.getNameValue(possibleParent, value);
        }, function(attr, nodeValue) {
            var val = nodeValue || value;
            val[attr.name] = attr.simpleValue;
        });
        return value;
    },
    setNameValue: function(parent, values) {
        V.nameNodes(parent, function(name, node) {
            var value = V.resolve(values, name);
            if (value !== undefined) {
                return node.nameValue = value;
            }
        }, function(possibleParent) {
            V.setNameValue(possibleParent, values);
        }, function(attr, node, elValues) {
            var value = V.resolve(elValues || values, attr.name);
            if (value !== undefined) {
                attr.simpleValue = value;
            }
        });
    },
    booleanAttr: function(attr) {
        return {
            get: function() {
                return this.hasAttribute(attr);
            },
            set: function(value) {
                this[value ? 'setAttribute' : 'removeAttribute'](attr, true);
            }
        };
    },
    nameRE: /\$\{([^}]+)\}/
};

_.define([Node], {
    value: {
        get: function() {
            return this.hasAttribute && this.hasAttribute('value') ?
                this.getAttribute('value') :
                this.textContent;
        },
        set: function(value) {
            if (this.hasAttribute && this.hasAttribute('value')) {
                this.setAttribute('value', value);
            } else {
                this.textContent = value;
            }
        }
    },
    simpleValue:  {
        get: function(){ return V.parse(this.value); },
        set: function(value){ this.value = V.string(value); }
    },
    useSimpleValue: function() {
        var kids = !this.noValues && this.childNodes.length;
        return !kids || (kids === 1 && !!this.childNodes[0].useSimpleValue());
    },
    fullValue: {
        get: function() {
            return this.useSimpleValue() ? this.simpleValue : V.getNameValue(this, {});
        },
        set: function(value) {
            if (this.useSimpleValue() || typeof value !== "object") {
                this.simpleValue = value;
            } else {
                V.setNameValue(this, value);
            }
        }
    },
    nameParent: {
        get: function() {
            var node = this,
                parent;
            while ((parent = node.parentNode)) {
                if (parent.name) {
                    return parent;
                }
                node = parent;
            }
            return node === this ? null : node;
        }
    },
    nameGroup: {
        get: function() {
            var el = this,
                name = el.name;
            return name ? el.parentNode ?
                el.nameParent.queryNameAll(name) :
                new DOMxList(el) :
                null;
        }
    },
    nameValue: {
        get: function() {
            var values;
            if (this.name) {
                this.nameGroup.each(function(node) {
                    values = V.combine(values, node.fullValue);
                });
            }
            return values || this.fullValue;
        },
        set: function(values) {
            if (this.name && Array.isArray(values)) {
                this.nameGroup.each(function(node, i) {
                    node.nameValue = values[i];
                    //TODO: declarative opts for repeat/remove when sizes mismatch?
                });
            } else {
                this.fullValue = values;
            }
        }
    }
});
_.define([Attr], {
    useSimpleValue: function(){ return true; },
}, true);

_.define([Element], {
    name: {
        get: function(){ return this.getAttribute('name'); },
        set: function(name){ this.setAttribute('name', name); }
    },
    simpleValue: {
        get: function() {
            var parser = this.getAttribute('data-values-parse');
            parser = parser && V.resolve(window, parser) || V.parse;
            return parser.call(this, this.value);
        },
        set: function(value) {
            var stringify = this.getAttribute('data-values-stringify');
            stringify = stringify && V.resolve(window, stringify) || V.string;
            this.value = stringify.call(this, value);
        }
    },
    useAttrValues: V.booleanAttr('data-values-attr'),
    noValues: V.booleanAttr('data-values-none')
}, true);

_.define(_.parents, {
    queryName: function(name) {
        return this.queryNameAll(name, 1);
    },
    queryNameAll: function(name, _list) {
        _list = _list === false ? _list : new DOMxList();
        for (var i=0; i < this.childNodes.length; i++) {
            var node = this.childNodes[i],
                nodeName = node.name,
                ret;
            if (nodeName === name) {
                if (!_list) {
                    return node;
                } else {
                    _list.add(node);
                }
            } else if (node.nodeType === 1) {
                if (nodeName) {
                    if (name.indexOf(nodeName+'.') === 0) {
                        ret = node.queryNameAll(name.substring(nodeName.length+1), _list);
                        if (_list !== ret) {
                            return ret;
                        }
                    }
                } else {
                    ret = node.queryNameAll(name, _list);
                    if (_list !== ret) {
                        return ret;
                    }
                }
            }
        }
        if (this.useAttrValues) {
            var el = this;
            for (var a=0; a < el.attributes.length; a++) {
                var attr = el.attributes[a];
                if (attr.name === name) {
                    if (!_list) {
                        return attr;
                    } else {
                        attr.parentNode = el;
                        _list.add(attr);
                    }
                }
            }
        }
        return _list;
    }
});

_.define([Text], {
    useSimpleValue: function() {
        return !!this.noValues || !this.splitOnName();
    },
    splitOnName: function() {
        var text = this,
            match = text.value.match(V.nameRE);
        if (match) {
            var start = match.index,
                name = match[0];
            if (start > 0) {
                text.splitText(start);
                text.noValues = true;
                text = text.nextSibling;
            }
            if (text.value.length > name.length) {
                text.splitText(name.length);
            }
            text.name = match[1];
            text.value = '';
            return text;
        } else {
            this.noValues = true;
        }
    }
}, true);

_.define([HTMLInputElement], {
    nameValue: {
        get: function() {
            var type = this.type;
            if (type === 'radio' || type === 'checkbox') {
                var value = this.nameGroup.only('checked', true).each('simpleValue');
                return this.type === 'radio' ? value[0] : value;
            }
            return this.value;
        },
        set: function(value) {
            if (this.type === 'checkbox') {
                value = (Array.isArray(value) ? value : [value]).map(V.string);
                this.nameGroup.each(function(input) {
                    input.checked = value.indexOf(input.value) >= 0;
                });
            } else {
                this.value = V.string(value);
            }
        }
    }
}, true);

_.define([HTMLSelectElement], {
    nameValue: {
        get: function() {
            return this.multiple ?
                this.children.only('selected', true).each('simpleValue') :
                V.parse(this.value);
        },
        set: function(value) {
            if (this.multiple) {
                value = (Array.isArray(value) ? value : [value]).map(V.string);
                this.children.each(function(option) {
                    if (value.indexOf(option.value) >= 0) {
                        option.selected = true;
                    }
                });
            } else {
                this.value = V.string(value);
            }
        }
    }
}, true);

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
        _.defprop(anchor, 'source', source);
        if (keep !== true) {
            el.remove();
        }
        return id;
    },
    repeat: function(parent, anchor, source, val) {
        var repeat = source.cloneNode(true);
        if (val !== undefined && val !== null) {
            repeat.nameValue = val;
        }
        parent.insertBefore(repeat, anchor);
        return repeat;
    },
    style: D.head.append('style')
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
            els = new DOMxList(this);
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
        D.queryAll('[data-domx-dot]').each(function(el) {
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

_.define(_.parents.concat(_.lists), 'dot', function(force) {
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
