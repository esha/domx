/*! domx - v0.14.0 - 2014-11-25
* http://esha.github.io/domx/
* Copyright (c) 2014 ESHA Research; Licensed MIT, GPL */

(function(D, X, _) {
    "use strict";

// core.js
_ = {
    slice: Array.prototype.slice,
    zero: function(){ return 0; },
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
    },
    alias: {}
};

// developer tools
X = {
    version: "0.14.0",
    _: _,

    // extension points
    alias: function(short, long) {
        if (long) {
            _.alias[short] = long+'';// only strings allowed
        }
        return _.alias[short] || short;
    },
    add: function(name, fn, nodes, force) {
        if (!Array.isArray(nodes)) {
            force = nodes;
            nodes = X.nodes;
        }
        _.define(nodes, name, fn, force);
        if (typeof fn === "function") {
            _.define(X.lists, name, function listFn() {
                var args = arguments;
                return this.each(function eachFn() {
                    return fn.apply(this, args);
                });
            }, force);
        }
    },

    // type lists (not completed until after X.List is defined)
    nodes: [Element, Text, Comment],
    parents: [Element, DocumentFragment, D]
};

// define X.List type
X.List = function XList(limit) {
    if (typeof limit === "number") {
        this.limit = limit;
        this.add(_.slice(arguments, 1));
    } else {
        this.add(arguments);
    }
};
_.define([X.List], {
    length: 0,
    limit: undefined,
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
    isFull: function() {
        return this.add === _.zero;
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

// finish types now that X.List is defined
X.lists = [NodeList, HTMLCollection, X.List];
X.containers = X.parents.concat(X.lists);

// expose developer tools
_.defprop(D, 'x', X);

// define foundational features on Node and sets
_.define([Node].concat(X.lists), {
    each: function(fn) {
        var self = _.isList(this) ? this : [this],
            results = [],
            prop, args;
        if (typeof fn === "string") {
            prop = X.alias(fn);// e.g. D.x.alias('+class', 'classList.add');
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
            results[0] && results[0].each ? new X.List(results) : // convert to DOMx (combines sub-lists)
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

// /core.js

// traverse.js
_.define(X.containers, {
    queryAll: function(selector, count) {
        var self = _.isList(this) ? this : [this],
            list = new X.List(count);
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

_.define(X.lists, {
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
        return new X.List(arr);
    },
    not: function not() {
        var exclude = this.only.apply(this, arguments);
        return this.only(function(n) {
            return exclude.indexOf(n) < 0;
        });
    }
});

_.estFnArgs = function(node, prop, test, inclusive) {
    prop = X.alias(prop);
    if (!(prop in node)) {
        inclusive = test === undefined ?
            typeof prop === "boolean" ? prop : true :
            test;
        test = prop;
        prop = 'parentElement';
    }
    if (typeof test === "boolean") {
        inclusive = test;
        test = null;
    }
    if (!test) {
        test = function(){ return true; };
    } else if (typeof test === "string") {
        var selector = test;
        test = function(node) {
            return node.matches && node.matches(selector);
        };
    }
    return [prop, test, inclusive||false];
};

_.define(X.nodes, 'farthest', function(prop, test, inclusive) {
    var args = _.estFnArgs(this, prop, test, inclusive);
    return _.farthest(this, args[0], args[1], args[2] && args[1](this) ? this : null);
});
_.farthest = function(node, prop, test, previous) {
    return node && (node = node[prop]) ?
        _.farthest(node, prop, test, test(node) ? node : previous) :
        previous;
};

_.define(X.nodes, 'closest', function(prop, test, inclusive) {
    var args = _.estFnArgs(this, prop, test, inclusive);
    return args[2] && args[1](this) ? this : _.closest(this, args[0], args[1]);
});
_.closest = function(node, prop, test) {
    return node && (node = node[prop]) ?
        test(node) ? node : _.closest(node, prop, test) :
        null;
};

X.add('all', function(prop, fn, inclusive, _list) {
    if (fn === true){ inclusive = fn; fn = undefined; }
    _list = _list || new X.List();

    var value = inclusive ? this : this[X.alias(prop)];
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

X.add('append', function(arg, ref) {
    if (typeof arg === "string") {// turn arg into an appendable
        return A.create(this, arg, ref);
    }
    if (_.isList(arg)) {// list of append-ables
        var list = new X.List();
        for (var i=0,m=arg.length; i<m; i++) {
            list.add(this.append(arg[i], ref));
        }
        return list;
    }
    A.insert(this, arg, ref);// arg is an append-able
    return arg;
}, X.parents);

X.add('remove', function() {
    var parent = this.parentNode;
    if (parent) {
        parent.removeChild(this);
    }
});
// /append.js

var V = _.xValue = {
    /*jshint evil:true */
    resolve: function(context, reference) {
        return eval('context["'+reference+'"]');
    },
    name: function(node) {
        if (node.nodeType === 3 && !node.noSubNames) {
            node.splitOnName();// ensure this is run before node.name
        }
        return node.tagName === 'FORM' ? node.getAttribute('name') : node.name;
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
    stringifyFor: function(el) {
        var stringify = el.getAttribute('xvalue-stringify');
        return stringify && V.resolve(window, stringify) || V.string;        
    },
    nameNodes: function(parent, nameFn, possibleParentFn, attrFn) {
        var done = [];
        for (var i=0; i<parent.childNodes.length; i++) {
            var node = parent.childNodes[i],
                name = V.name(node),
                nodeValue = null;
            if (name && done.indexOf(node) < 0) {
                done.push(node);
                nodeValue = nameFn(name, node);
            } else if (possibleParentFn && !node.useBaseValue()) {
                possibleParentFn(node);
            }
            if (node.useAttrValues) {
                for (var a=0; a < node.attributes.length; a++) {
                    attrFn(node.attributes[a], nodeValue);
                }
            }
        }
    },
    combine: function(oldValue, newValue, rejectNull) {
        if (oldValue === undefined || oldValue === newValue ||
            (rejectNull && oldValue === null)) {
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
            val[attr.name] = attr.baseValue;
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
                attr.baseValue = value;
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
    nameRE: /\$\{([^}]+)\}/,
    changeEvent: window.CustomEvent ? function(node) {
        node.dispatchEvent(new CustomEvent('change', { bubbles:true }));
    } : function(node) {
        var e = D.createEvent('CustomEvent');
        e.initCustomEvent('change', true);
        node.dispatchEvent(e);
    }
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
    baseValue:  {
        get: function(){ return V.parse(this.value); },
        set: function(value) {
            var oldValue = this.value,
                newValue = this.value = V.string(value);
            if (oldValue !== newValue) {
                V.changeEvent(this);
            }
        }
    },
    useBaseValue: function() {
        var kids = !this.noSubNames && this.childNodes.length;
        return !kids || (kids === 1 && !!this.childNodes[0].useBaseValue());
    },
    nameParent: {
        get: function() {
            var node = this,
                parent;
            while ((parent = node.parentNode)) {
                if (V.name(parent)) {
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
                name = V.name(el);
            return name ? el.parentNode ?
                el.nameParent.queryNameAll(name) :
                new X.List(el) :
                null;
        }
    },
    nameValue: {
        get: function() {
            var values;
            if (V.name(this)) {
                this.nameGroup.each(function(node) {
                    values = V.combine(values, node.xValue);
                });
            }
            return values || this.xValue;
        },
        set: function(values) {
            if (V.name(this) && Array.isArray(values)) {
                var group = this.nameGroup;
                if (_.repeat && !values.length && group.length && !group[0].hasAttribute(_.repeat.id)) {
                    _.repeat.init(group[0], true);
                }
                group.each(function(node, i) {
                    if (i < values.length) {
                        node.nameValue = values[i];
                    } else {
                        node.remove();
                    }
                });
                while (group.length < values.length) {
                    var last = group[group.length - 1];
                    group.add(last.repeat(values[group.length]));
                }
            } else {
                this.xValue = values;
            }
        }
    },
    xValue: {
        get: function() {
            return this.useBaseValue() ? this.baseValue : V.getNameValue(this, {});
        },
        set: function(value) {
            if (this.useBaseValue() || typeof value !== "object") {
                this.baseValue = value;
            } else {
                V.setNameValue(this, value);
            }
        }
    }
});
_.define([Attr], {
    useBaseValue: function(){ return true; },
}, true);

_.define([Element], {
    name: {
        get: function(){ return this.getAttribute('name'); },
        set: function(name){ this.setAttribute('name', name); }
    },
    baseProperty: 'value',
    baseValue: {
        get: function() {
            var parser = this.getAttribute('xvalue-parse');
            parser = parser && V.resolve(window, parser) || V.parse;
            return parser.call(this, this[this.baseProperty]);
        },
        set: function(value) {
            var oldValue = this[this.baseProperty],
                newValue = this[this.baseProperty] = V.stringifyFor(this).call(this, value);
            if (oldValue !== newValue) {
                V.changeEvent(this);
            }
        }
    },
    useAttrValues: V.booleanAttr('xvalue-attr'),
    noSubNames: V.booleanAttr('xvalue-none')
}, true);

_.define(X.containers, {
    queryName: function(name) {
        return this.queryNameAll(name, 1)[0];
    },
    queryNameAll: function(name, count, _list) {
        _list = _list || new X.List(count);
        var parents = _.isList(this) ? this : [this];
        for (var s=0; s < parents.length && !_list.isFull(); s++) {
            var parent = parents[s];
            for (var i=0; i < parent.childNodes.length && !_list.isFull(); i++) {
                var node = parent.childNodes[i],
                    nodeName = V.name(node);
                if (nodeName === name && node.tagName !== 'X-REPEAT') {
                    _list.add(node);
                } else if (node.nodeType === 1) {
                    if (nodeName) {
                        if (name.indexOf(nodeName+'.') === 0) {
                            node.queryNameAll(name.substring(nodeName.length+1), count, _list);
                        }
                    } else {
                        node.queryNameAll(name, count, _list);
                    }
                }
            }
            if (parent.useAttrValues && !_list.isFull()) {
                var el = this;
                for (var a=0; a < el.attributes.length; a++) {
                    var attr = el.attributes[a];
                    if (attr.name === name) {
                        attr.parentNode = el;
                        _list.add(attr);
                        break;
                    }
                }
            }
        }
        return _list;
    }
});

_.define([Text], {
    useBaseValue: function() {
        return this.noSubNames || !this.splitOnName();
    },
    splitOnName: function() {
        var text = this,
            match = text.textContent.match(V.nameRE);
        if (match) {
            var start = match.index,
                name = match[0];
            if (start > 0) {
                text.splitText(start);
                text.noSubNames = true;
                text = text.nextSibling;
            }
            if (text.textContent.length > name.length) {
                text.splitText(name.length);
            }
            text.name = match[1];
            text.textContent = '';
        }
        // all have no sub names after splitting
        text.noSubNames = true;
        return !!match;
    }
}, true);

_.define([HTMLInputElement], {
    xValue:  {
        get: function() {
            var input = this;
            return (input.type !== 'radio' && input.type !== 'checkbox') || input.checked ?
                input.baseValue :
                null;
        },
        set: function(value) {
            var input = this;
            if (input.type === 'checkbox' || input.type === 'radio') {
                value = (Array.isArray(value) ? value : [value]).map(V.stringifyFor(this));
                var was = input.checked;
                input.checked = value.indexOf(input.value) >= 0;
                if (was !== input.checked) {
                    V.changeEvent(input);
                }
            } else {
                this.baseValue = value;
            }
        }
    },
    nameValue: {
        get: function() {
            var type = this.type;
            if (type === 'radio' || type === 'checkbox') {
                var group = this.nameGroup,
                    value;
                group.each(function(node) {
                    value = V.combine(value, node.xValue, true);
                });
                return Array.isArray(value) && (this.type === 'radio' || group.length === 1) ?
                    value[0] :
                    value;
            }
            return this.baseValue;
        },
        set: function(value) {
            if (this.type === 'checkbox' || this.type === 'radio') {
                value = (Array.isArray(value) ? value : [value]).map(V.stringifyFor(this));
                var changed = false;
                this.nameGroup.each(function(input) {
                    var was = input.checked;
                    input.checked = value.indexOf(input.value) >= 0;
                    if (was !== input.checked) {
                        changed = true;
                    }
                });
                if (changed) {
                    V.changeEvent(this);
                }
            } else {
                this.baseValue = value;
            }
        }
    }
}, true);

_.define([HTMLSelectElement], {
    xValue: {
        get: function() {
            if (this.multiple) {
                var selected = this.children.only('selected', true);
                return selected.length ? selected.each('xValue') :
                    this.children.length > 1 ? [] : null;
            }
            return V.parse(this.baseValue);
        },
        set: function(value) {
            if (this.multiple) {
                value = (Array.isArray(value) ? value : [value]).map(V.string);
                var changed = false;
                this.children.each(function(option) {
                    var was = option.selected;
                    option.selected = value.indexOf(option.value) >= 0;
                    if (option.select !== was) {
                        changed = true;
                    }
                });
                if (changed) {
                    V.changeEvent(this);
                }
            } else {
                this.baseValue = value;
            }
        }
    }
}, true);

_.define([HTMLLIElement], {
    baseProperty: {
        get: function() {
            // ordered ones use relative index, unordered ones use text
            return this.parentNode instanceof HTMLOListElement ?
                'value' :
                'textContent';
        } 
    }
}, true);

var R = _.repeat = {
    id: 'x-repeat-id',
    count: 0,
    init: function(el, keep) {
        var selector = el.getAttribute('x-repeat'),
            id = R.count++,
            content = selector && D.query(selector).cloneNode(true) || el,
            anchor = D.createElement('x-repeat');
        content.setAttribute(R.id, id);
        anchor.setAttribute(R.id, id);
        for (var i=0,m=el.attributes.length; i<m; i++) {
            var attr = el.attributes[i];
            if (attr.name === 'x-repeat-none') {
                anchor.value = attr.value || el.innerHTML;
            }
            anchor.setAttribute(attr.name, attr.value);
        }
        el.parentNode.insertBefore(anchor, el.nextSibling);
        _.defprop(anchor, 'content', content);
        if (keep !== true) {
            el.remove();
        }
        return id;
    },
    repeat: function(parent, anchor, content, val) {
        var repeat = content.cloneNode(true);
        if (val !== undefined && val !== null) {
            repeat.xValue = val;
        }
        parent.insertBefore(repeat, anchor);
        return repeat;
    },
    style: D.head.append('style')
};

X.add('repeat', function repeat(val) {
    var parent = this.parentNode,
        id = this.getAttribute(R.id) || R.init(this, true),
        selector = '['+R.id+'="'+id+'"]',
        selectAll = selector+':not(x-repeat)';
    if (val === false) {
        return parent.queryAll(selectAll).remove();
    }
    var anchor = parent.query('x-repeat'+selector),
        content = anchor.content;
    if (anchor.hasAttribute('x-repeat-first')) {
        anchor = parent.query(selector+'[x-index]') || anchor;
    }
    var ret = Array.isArray(val) ?
        val.map(function(v){ return R.repeat(parent, anchor, content, v); }) :
        R.repeat(parent, anchor, content, val);
    parent.queryAll(selectAll).each('setAttribute', 'x-index', '${i}');
    return ret;
}, [Element]);

R.style.textContent = '[x-repeat] { display: none }';
D.addEventListener('DOMContentLoaded', function() {
    D.queryAll('[x-repeat]').each(R.init);
    R.style.textContent = "\nx-repeat { display: none }"+
                          "\nx-repeat[x-repeat-none] { display: inline-block; }"+
                          "\n["+R.id+"] + x-repeat[x-repeat-none] { display: none; }";
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
            els = new X.List(this);
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
