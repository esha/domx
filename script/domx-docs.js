/*! domx - v0.12.0 - 2014-10-28
* http://esha.github.io/domx/
* Copyright (c) 2014 ESHA Research; Licensed MIT, GPL */

(function(D, _) {
    "use strict";

// core.js
window.XList = function XList(limit) {
    if (typeof limit === "number") {
        this.limit = limit;
        this.add(_.slice(arguments, 1));
    } else {
        this.add(arguments);
    }
};

// expose utilities
_ = {
    version: "0.12.0",
    slice: Array.prototype.slice,
    zero: function(){ return 0; },
    nodes: [Element, Text, Comment],
    lists: [NodeList, HTMLCollection, XList],
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
            results[0] && results[0].each ? new XList(results) : // convert to DOMx (combines sub-lists)
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
_.define([XList], {
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
            list = new XList(count);
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
        return new XList(arr);
    },
    not: function not() {
        var exclude = this.only.apply(this, arguments);
        return this.only(function(n) {
            return exclude.indexOf(n) < 0;
        });
    }
});

_.estFnArgs = function(node, prop, test, inclusive) {
    prop = _.resolve[prop] || prop;
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

_.define(_.nodes, 'farthest', function(prop, test, inclusive) {
    var args = _.estFnArgs(this, prop, test, inclusive);
    return _.farthest(this, args[0], args[1], args[2] && args[1](this) ? this : null);
});
_.farthest = function(node, prop, test, previous) {
    return node && (node = node[prop]) ?
        _.farthest(node, prop, test, test(node) ? node : previous) :
        previous;
};

_.define(_.nodes, 'closest', function(prop, test, inclusive) {
    var args = _.estFnArgs(this, prop, test, inclusive);
    return args[2] && args[1](this) ? this : _.closest(this, args[0], args[1]);
});
_.closest = function(node, prop, test) {
    return node && (node = node[prop]) ?
        test(node) ? node : _.closest(node, prop, test) :
        null;
};

D.extend('all', function(prop, fn, inclusive, _list) {
    if (fn === true){ inclusive = fn; fn = undefined; }
    _list = _list || new XList();

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
        var list = new XList();
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
        return eval('context["'+reference+'"]');
    },
    name: function(node) {
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
        var stringify = el.getAttribute('data-values-stringify');
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
        var kids = !this.noValues && this.childNodes.length;
        return !kids || (kids === 1 && !!this.childNodes[0].useBaseValue());
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
                new XList(el) :
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
    baseValue: {
        get: function() {
            var parser = this.getAttribute('data-values-parse');
            parser = parser && V.resolve(window, parser) || V.parse;
            return parser.call(this, this.value);
        },
        set: function(value) {
            var oldValue = this.value,
                newValue = this.value = V.stringifyFor(this).call(this, value);
            if (oldValue !== newValue) {
                V.changeEvent(this);
            }
        }
    },
    useAttrValues: V.booleanAttr('data-values-attr'),
    noValues: V.booleanAttr('data-values-none')
}, true);

_.define(_.parents, {
    queryName: function(name) {
        return this.queryNameAll(name, false);
    },
    queryNameAll: function(name, _list) {
        _list = _list === undefined ? new XList() : _list;
        for (var i=0; i < this.childNodes.length; i++) {
            var node = this.childNodes[i],
                nodeName = V.name(node),
                ret;
            if (nodeName === name && node.tagName !== 'X-REPEAT') {
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
    useBaseValue: function() {
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
        el.parentNode.insertBefore(anchor, el.nextSibling);
        _.defprop(anchor, 'source', source);
        if (keep !== true) {
            el.remove();
        }
        return id;
    },
    repeat: function(parent, anchor, source, val) {
        var repeat = source.cloneNode(true);
        if (val !== undefined && val !== null) {
            repeat.xValue = val;
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

R.style.textContent = '[data-repeat] { display: none }';
D.addEventListener('DOMContentLoaded', function() {
    D.queryAll('[data-repeat]').each(R.init);
    R.style.textContent = "\nx-repeat { display: none }"+
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
            els = new XList(this);
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

/*! Eventi - v1.3.6 - 2014-10-21
* https://github.com/esha/Eventi
* Copyright (c) 2014 ESHA Research; Licensed MIT */

(function(global, document) {
    "use strict";

    try {
        new CustomEvent('test');
    } catch (err) {
        // polyfill CustomEvent constructor
        global.CustomEvent = function CustomEvent(type, args) {
            args = args || {};
            var e = document.createEvent('CustomEvent');
            e.initCustomEvent(type, !!args.bubbles, !!args.cancelable, args.detail);
            return e;
        };
    }

function Eventi(text){
    if (typeof text === "string") {
        return _.create.apply(_, arguments);
    }
    return Eventi.fy(this);
}
Eventi.toString = Eventi.prototype.toString = function(){ return 'Eventi, v'+_.version; };
Eventi.fy = function fy(o) {
    for (var p in _.fns) {
        Object.defineProperty(o, p, {value:Eventi[p], writable:true, configurable:true});
    }
    return o;
};

var _ = Eventi._ = {
    version: "1.3.6",
    global: new Function('return this')(),
    noop: function(){},
    slice: function(a, i){ return Array.prototype.slice.call(a, i); },
    copy: function(a, b, p) {
        if (typeof a === "object"){ for (p in a){ if (a.hasOwnProperty(p)){ b[p] = a[p]; }}}
    },
    async: (global.setImmediate && setImmediate.bind(global)) ||
           function async(fn){ return setTimeout(fn, 0); },
    resolveRE: /^([\w\$]+)?((\.[\w\$]+)|\[(\d+|'(\\'|[^'])+'|"(\\"|[^"])+")\])*$/,
    resolve: function(reference, context, tested) {
        if (tested || _.resolveRE.test(reference)) {
            context = context || global;
            try {
                return eval('context'+(reference.charAt(0) !== '[' ? '.'+reference : reference));
            } catch (e) {}
        }
    },

    create: function(type, copyThese) {
        var props = { text: type+'' };
        type = _.parse(props.text, props, props);
        _.copy(copyThese, props);
        if (!('bubbles' in props)) {
            props.bubbles = true;// we bubble by default around here
        }

        var event = new CustomEvent(type, props);
        for (var prop in props) {
            if (_.skip.indexOf(prop) < 0) {
                event[_.prop(prop)] = props[prop];
            }
        }
        return event;
    },
    skip: 'bubbles cancelable detail type'.split(' '),
    prop: function(prop){ return prop; },// only an extension hook
    parse: function(type, event, handler) {
        _.parsers.forEach(function(parser) {
            type = type.replace(parser[0], function() {
                var args = _.slice(arguments, 1);
                args.unshift(event, handler);
                return parser[1].apply(event, args) || '';
            });
        });
        return type ? event.type = type : type;
    },
    parsers: [
        [/^(\W*)_/, function(event, handler, other) {
            event.bubbles = false;
            return other;
        }],
        [/\((.*)\)/, function(event, handler, val) {
            try {
                event.detail = _.resolve(val) || JSON.parse(val);
            } catch (e) {
                event.detail = val;
            }
        }],
        [/#(\w+)/g, function(event, handler, tag) {
            (event.tags||(event.tags=[])).push(tag);
            event[tag] = true;
        }],
        [/^(\w+):/, function(event, handler, cat) {//
            event.category = cat;
        }]
    ],

    fn: function(name, dataIndex) {
        Eventi[name] = _.fns[name] = function wrapper(target) {
            var args = _.slice(arguments);
            if (!target || typeof target === "string" || target instanceof Event) {// ensure target
                args.unshift(target = !this || this === Eventi ? _.global : this);
            }
            if (args.length > dataIndex) {// gather ...data the old way
                args[dataIndex] = args.slice(dataIndex);
                args = args.slice(0, dataIndex+1);
            }
            if (!args[1] || typeof args[1] === "string") {
                args[1] = _.split.ter(args[1]);
            }
            var fn = _[name], ret;
            if (!target.nodeType && target !== _.global && 'length' in target) {// apply to each target
                for (var i=0,m=target.length; i<m; i++) {
                    ret = fn.apply(args[0] = target[i], args);
                }
            } else {
                ret = fn.apply(target, args);
            }
            return ret === undefined ? this : ret;// be fluent
        };
    },
    fns: {},
    split: {
        guard: { '(':')' },
        ter: function(texts, delims) {
            var parts = [],
                text = '',
                guard;
            if (texts) {
                delims = _.slice(arguments, 1);
                delims.unshift(' ');
                for (var i=0,m=texts.length; i<m; i++) {
                    var c = texts.charAt(i);
                    if (!guard && delims.indexOf(c) >= 0) {
                        if (text) {
                            parts.push(text);
                        }
                        text = '';
                    } else {
                        text += c;
                        if (guard) {
                            if (guard === c) {
                                if (text.charAt(text.length-2) === '\\') {
                                    text = text.replace("\\"+c, c);
                                } else {
                                    guard = null;
                                }
                            }
                        } else {
                            guard = _.split.guard[c];
                        }
                    }
                }
                if (text) {
                    parts.push(text);
                }
            } else {
                parts.push('');
            }
            return parts;
        }
    }
};

_.parsers.unshift([/^(\W*)\//, function(event, handler, other) {
    handler.global = true;
    return other;
}]);
_.fire = function(target, events, data) {
    if (events instanceof Event) {
        events.data = data;
        _.dispatch(target, events);
        return events;
    }
    return _.fireAll(target, events, {data:data});
};
_.fireAll = function(target, events, props) {
    var event;
    for (var i=0; i<events.length; i++) {
        event = _.create(events[i], props);
        _.dispatch(target, event);
    }
    return event;
};
_.dispatch = function(target, event, objectBubbling) {
    if (event.global){ target = _.global; }
    (target.dispatchEvent || target[_key] || _.noop).call(target, event);
    if (target.parentObject && event.bubbles && !event.propagationStopped) {
        _.dispatch(target.parentObject, event, true);
    }
    // icky test/call, but lighter than wrapping or firing internal event
    if (!objectBubbling && event.singleton) {
        _.singleton(target, event);
    }
};
_.fn('fire', 2);
_.parsers.unshift([/^(\W*)\!/, function(e, handler, other) {//
    handler.important = true;
    return other;
}]);
_.on = function(target, events, fn, data) {
    if (target !== _.global && events.length === 1 && events[0] === '') {
        events = target; target = _.global;
    }
    if (!Array.isArray(events)) {
        if (fn !== undefined) {
            data = data ? data.unshift(fn) && data : [fn];
        }
        for (var event in events) {
            _.handler(target, event, events[event], data);
        }
    } else {
        for (var i=0,m=events.length; i<m; i++) {
            _.handler(target, events[i], fn, data);
        }
    }
};
_.handler = function(target, text, fn, data) {
    var handler = { target:target, fn:fn, data:data, text:text, event:{} };
    _.parse(text, handler.event, handler);
    delete handler.event.tags;// superfluous for handlers
    if (target !== _) {// ignore internal events
        Eventi.fire(_, 'on:handler', handler);
    }
    // allow on:handler listeners to change these things
    if (handler.fn !== _.noop) {
        target = handler.global === true ? _.global : handler.target;
        _.handlers(target, handler.event.type).push(handler);
    }
    return handler;
};
_.handlers = function(target, type) {
    var listener = _.listener(target),
        handlers = listener.s[type];
    if (!handlers) {
        handlers = listener.s[type] = [];
        if (target.addEventListener) {
            target.addEventListener(type, listener, _.capture.indexOf(type) >= 0);
        }
    }
    return handlers;
};
_.capture = ['focus','blur'];

var _key = _._key = '_eventi'+Date.now();
_.listener = function(target) {
    var listener = target[_key];
    if (!listener) {
        listener = function(event) {
            var handlers = listener.s[event.type];
            if (handlers){ _.handle(event, handlers); }
        };
        listener.s = {};
        Object.defineProperty(target, _key, {
            value:listener, writeable:false, configurable:true
        });
    }
    return listener;
};
_.handle = function(event, handlers) {
    for (var i=0, handler; i<handlers.length; i++) {
        if (_.matches(event, (handler = handlers[i]).event)) {
            _.execute(event, handler);
            if (event.immediatePropagationStopped){ break; }
        }
    }
};
_.execute = function(event, handler) {
    var args = [event],
        fn = handler.fn,
        call = { target: handler.target, args:args };
    if (event.data){ args.push.apply(args, event.data); }
    if (handler.data){ args.push.apply(args, handler.data); }
    if (handler.filters) {
        for (var i=0,m=handler.filters.length; i<m && call.target; i++) {
            handler.filters[i].call(call, event, handler);
        }
    }
    if (call.target) {
        try {
            fn.apply(call.target, call.args);
        } catch (e) {
            _.async(function(){ throw e; });
        }
        if (handler.end && handler.end.apply(call.target, call.args)) {
            _.unhandle(handler);
        }
    }
};
_.filter = function(handler, fn) {
    handler.filters = handler.filters || [];
    handler.filters.push(fn);
};
_.unhandle = function noop(handler){ handler.fn = _.noop; };
_.matches = function(event, match) {
    for (var key in match) {
        if (match[key] !== event[key]) {
            return false;
        }
    }
    return true;
};
_.fn('on', 3);

_.split.guard['<'] = '>';
_.parsers.unshift([/<(.+)>/, function(event, handler, selector) {
    handler.selector = selector;
    if (_.delegate && event !== handler) {
        _.filter(handler, _.delegate);
    }
}]);
if (global.Element) {
    _.delegate = function delegate(event, handler) {
        this.target = _.closest(event.target, handler.selector);
    };
    _.closest = function(el, selector) {
        while (el && el.matches) {
            if (el.matches(selector)) {
                return el;
            }
            el = el.parentNode;
        }
    };

    var Ep = Element.prototype,
        aS = 'atchesSelector';
    if (!Ep['matches']) {
        Object.defineProperty(Ep, 'matches', {value:Ep['webkitM'+aS]||Ep['mozM'+aS]||Ep['msM'+aS]});
    }
}   

_.parsers.unshift([/=>(\w+)$/, function(event, handler, alias) {
    handler.alias = alias;
    if (handler !== event) {
        handler.data = handler.data || [];
        handler.data.push(alias);
    }
}]);
_.alias = function(alias, text, context) {
	return function aliased(target) {
		var args = _.slice(arguments),
			index = (typeof target !== "object" || !(target.dispatchEvent || target[_key])) ? 0 : 1;
		args.splice(index, 0, text);
		return this.apply(context, args);
	};
};
Eventi.alias = function(context, text) {
	if (typeof context === "string") {
		text = context; context = Eventi;
	}
	var texts = _.split.ter(text),
		props;
	for (var prop in _.fns) {
		for (var i=0,m=texts.length; i<m; i++) {
			props = {};
			_.parse(texts[i], props, props);
			props.alias = props.alias || props.type;
			context[prop][props.alias] = _.alias(props.alias, texts[i], context);
		}
	}
	return props;
};
if (document) {
    _.init = function init() {
        var nodes = document.querySelectorAll('[eventi],[data-eventi]');
        for (var i=0,m=nodes.length; i<m; i++) {
            var target = nodes[i],
                mapping = target.getAttribute('data-eventi') ||
                          target.getAttribute('eventi');
            if (mapping !== target.eventi) {
                if (_.off && target.eventi) {
                    Eventi.off(target, target.eventi, _.declared);
                }
                target.eventi = mapping;
                _.declare(target, mapping);
            }
        }
        if (nodes.length || document.querySelector('[click],[data-click]')) {
            Eventi.on('click keyup', _.check);
        }
    };
    _.declare = function(target, mapping) {// register listener
        var texts = _.split.ter(mapping);
        for (var i=0,m=texts.length; i<m; i++) {
            Eventi.on(target, texts[i], _.declared);
        }
    };
    _.declared = function(e, alias) {// lookup handlers
        alias = typeof alias === "string" ? alias : e.type;
        var nodes = _.declarers(this, alias, e.target);
        for (var i=0,m=nodes.length; i<m; i++) {
            _.respond(nodes[i], alias, e);
        }
    };
    _.declarers = function(node, alias, target) {
        var query = '['+alias+'],[data-'+alias+']',
            // gather matching targets up to and including the listening node
            nodes = [],
            descendant = false;
        while (target && target.matches) {
            if (target.matches(query)) {
                nodes.push(target);
            }
            if (target === node) {
                descendant = true;
                break;
            }
            target = target.parentNode;
        }
        // if target isn't a descendant of node, handler must be global
        return descendant ? nodes : node.querySelectorAll(query);
    };
    _.respond = function(node, alias, e) {// execute handler
        var response = node.getAttribute('data-'+alias)||node.getAttribute(alias)||alias;
        if (response) {
            var fn = _.resolve(response, node) || _.resolve(response);
            if (typeof fn === "function") {
                fn.call(node, e);
            } else {
                Eventi.fire(node, response, e);
            }
        }
    };
    _.check = function(e) {
        var click = e.target.getAttribute &&
                    ((e.type === 'click' && _.click(e.target)) ||
                     (e.keyCode === 13 && _.click(e.target, true)));
        if (click) {
            _.declared.call(document.documentElement, e, 'click');
            if (click === 'noDefault' && !_.allowDefault(e.target)) {
                e.preventDefault();
            }
        }
    };
    _.allowDefault = function(el) {
        return el.type === 'radio' || el.type === 'checkbox';
    };
    _.click = function(el, enter) {
        // click attributes with non-false value override everything for clicks, but not enters
        var click = el.getAttribute('click');
        if (!enter && click && click !== "false") {
            return 'noDefault';
        }
        // editables, select, textarea, non-button inputs all use click to alter focus w/o action
        // textarea and editables use enter to add a new line w/o action
        // a[href], buttons, button inputs all automatically dispatch 'click' on enter
        // in all three situations, dev must declare on element, not on parent to avoid insanity
        if (!el.isContentEditable) {
            var name = el.nodeName.toLowerCase();
            return name !== 'textarea' &&
                   (name !== 'select' || enter) &&
                   (enter ? (name !== 'a' || !el.getAttribute('href')) &&
                            name !== 'button' &&
                            (name !== 'input' || !_.buttonRE.test(el.type))
                          : name !== 'input' || _.buttonRE.test(el.type));
        }
    };
    _.buttonRE = /^(submit|button|reset)$/;

    Eventi.on('DOMContentLoaded', _.init);
}

_.split.guard['['] = ']';
_.parsers.push([/\[([^ ]+)\]/, function(event, handler, key) {//'
    var dash;
    while ((dash = key.indexOf('-')) > 0) {
        event[key.substring(0, dash)+'Key'] = true;
        key = key.substring(dash+1);
    }
    if (key) {
        event.keyCode = _.codes[key] || parseInt(key, 10) || key;
    }
}]);
_.codes = {
    backspace:8, tab:9, enter:13, shift:16, ctrl:17, alt:18, capsLock:20, escape:27, start:91, command:224,
    pageUp:33, pageDown:34, end:35, home:36, left:37, up:38, right:39, down:40, insert:45, 'delete':46,
    multiply:106, plus:107, minus:109, point:110, divide:111, numLock:144,// numpad controls
    ';':186, '=':187, ',':188, '-':189, '.':190, '/':191, '`':192, '[':219, '\\':220, ']':221, '\'':222, space:32// symbols
};
for (var n=0; n<10; n++){ _.codes['num'+n] = 96+n; }// numpad numbers
for (var f=1; f<13; f++){ _.codes['f'+f] = 111+f; }// function keys
'abcdefghijklmnopqrstuvwxyz 0123456789'.split('').forEach(function(c) {
    _.codes[c] = c.toUpperCase().charCodeAt(0);// ascii keyboard
});
Eventi.on(_, 'on:handler', function(e, handler) {
    if (handler.event.keyCode && !handler.event.type) {
        handler.event.type = 'keyup';
    }
});
_.split.guard['@'] = '@';
_.parsers.unshift([/@([^@]+)(@|$)/, function(event, handler, uri) {
    handler.location = uri;
    if (_.location && event !== handler) {
        _.locationHandler(uri, handler);
    }
}]);
if (global.history && global.location) {
    var intercept = function(name) {
        _[name] = history[name];
        history[name] = function() {
            var ret = _[name].apply(this, arguments);
            _.dispatch(_.global, new CustomEvent('pushstate'));
            return ret;
        };
    };
    intercept('pushState');
    intercept('replaceState');

    var current;
    _.location = function(e) {
        var uri = _.getLocation();
        if (uri !== current) {
            _.dispatch(_.global, new Eventi('location', {
                oldLocation: current,
                location: current = uri,
                srcEvent: e
            }));
        }
    };
    _.getLocation = function() {
        return decodeURI(location.pathname + location.search + location.hash);
    };
    _.setLocation = function(e, uri, fill) {
        // user-fired set events should not have oldLocation prop
        if (!e.oldLocation) {
            if (typeof uri !== "string") {
                fill = uri;
                uri = e.location;
            }
            if (uri) {
                var keys = _.keys(uri);
                if (keys) {
                    uri = keys.reduce(function(s, key) {
                        return s.replace(new RegExp('\\{'+key+'\\}',"g"),
                                         fill[key] || location[key] || '');
                    }, uri);
                }
                // don't share this event with other handlers
                e.stopPropagation();
                e.stopImmediatePropagation();
                history.pushState(null, null, encodeURI(uri));
            }
        }
    };
    _.keys = function(tmpl) {
        var keys = tmpl.match(/\{\w+\}/g);
        return keys && keys.map(function(key) {
            return key.substring(1, key.length-1);
        });
    };
    _.locationHandler = function(uri, handler) {
        var re = uri;
        if (uri.charAt(0) === '`') {
            re = re.substring(1, re.length-1);
        } else {
            re = re.replace(/([.*+?^=!:$(|\[\/\\])/g, "\\$1");// escape uri/regexp conflicts
            if (handler.keys = _.keys(re)) {
                re = re.replace(/\{[\w@\-\.]+\}/g, "([^\/?#]+)");
            } else {
                re.replace(/\{/g, '\\{');
            }
        }
        handler.uriRE = new RegExp(re);
        _.filter(handler, _.locationFilter);
    };
    _.locationFilter = function(event, handler) {
        var matches = (event.location || current).match(handler.uriRE);
        if (matches) {
            this.args.splice.apply(this.args, [1,0].concat(matches));
            if (handler.keys) {
                // put key/match object in place of full match
                this.args[1] = handler.keys.reduce(function(o, key) {
                    o[key] = matches.shift();
                    return o;
                }, { match: matches.shift() });
            }
        } else {
            this.target = undefined;
        }
    };
    var historyTypes = ['popstate','hashchange','pushstate'];
    Eventi.on('!'+(historyTypes.join(' !')), _.location)
    .on('!location', _.setLocation)
    .on(_, 'on:handler', function location(e, handler) {
        var type = handler.event.type;
        if (handler.location && !type) {
            type = handler.event.type = 'location';
        }
        if (type === 'location') {
            handler.global = true;
            // try immediately for current uri match
            if (!current) {
                current = _.getLocation();
            }
            _.execute(new Eventi('location',{location:current, srcEvent:e}), handler);
        } else if (historyTypes.indexOf(type) >= 0) {
            handler.global = true;
        }
    });
}
_.off = function(target, events, fn) {
    var listener = target[_key];
    if (listener) {
        for (var i=0, m=events.length; i<m; i++) {
            var filter = { event:{}, handler:{}, fn:fn, text:events[i] };
            _.parse(events[i], filter.event, filter.handler);
            // delete superfluous properties
            delete filter.event.tags;
            delete filter.handler.filters;
            delete filter.handler.end;
            if (target !== _) {
                Eventi.fire(_, 'off:filter', filter);
            }
            if (filter.event.type) {
                _.clean(filter.event.type, filter, listener, target);
            } else {
                for (var type in listener.s) {
                    _.clean(type, filter, listener, target);
                }
            }
        }
        if (_.empty(listener.s)) {
            delete target[_key];
        }
    }
};
_.unhandle = function off(handler) {
    _.off(handler.target, [handler.text], handler.fn);
};
_.empty = function(o){ for (var k in o){ return !k; } return true; };
_.clean = function(type, filter, listener, target) {
    var handlers = listener.s[type];
    if (handlers) {
        for (var i=0, m=handlers.length; i<m; i++) {
            if (_.cleans(handlers[i], filter)) {
                var cleaned = handlers.splice(i--, 1)[0];
                if (target !== _) {// ignore internal events
                    Eventi.fire(_, 'off:cleaned', cleaned);
                }
                m--;
            }
        }
        if (!handlers.length) {
            if (target.removeEventListener) {
                target.removeEventListener(type, listener, _.capture.indexOf(type) >= 0);
            }
            delete listener.s[type];
        }
    }
};
_.cleans = function(handler, filter) {
    return _.matches(handler.event, filter.event) &&
           _.matches(handler, filter.handler) &&
           (!handler.important || (filter.handler.important &&
                                   _.matches(filter.event, handler.event))) &&
           (!filter.fn || filter.fn === handler.fn);
};
_.fn('off', 3);
// add singleton to _.parse's supported event properties
_.parsers.unshift([/^(\W*)\^/, function(event, handler, other) {
	handler.singleton = true;
	if (event !== handler) {
		_.filter(handler, _.before);
	}
	return other;
}]);

// _.fire's _.dispatch will call this when appropriate
_.singleton = function(target, event) {
	_.remember(target, event);
	if (event.bubbles && !event.propagationStopped && target !== _.global) {
		_.singleton(target.parentNode || target.parentObject || _.global, event);
	}
};
var _skey = _._skey = '^'+_key;
_.remember = function remember(target, event) {
	var saved = target[_skey] || [];
	if (!saved.length) {
		Object.defineProperty(target, _skey, {value:saved,configurable:true});
	}
	event[_skey] = true;
	saved.push(event);
};
_.before = function singleton(event, handler) {
	_.unhandle(handler);
	handler.fn = _.noop;// tell _.handler not to keep this
	if (!event[_skey]) {// remember this non-singleton as singleton for handler's sake
		_.remember(this.target, event);
	}
};

Eventi.on(_, 'on:handler', function singleton(e, handler) {
	if (handler.singleton) {
		// search target's saved singletons, execute handler upon match
		var saved = handler.target[_skey]||[];
		for (var i=0,m=saved.length; i<m; i++) {
			var event = saved[i];
			if (_.matches(event, handler.event)) {
				_.execute(event, handler);
				break;
			}
		}
	}
});

if (document) {
	Eventi.on('DOMContentLoaded', function ready(e) {
		Eventi.fire(document.documentElement, '^ready', e);
	});
}
_.parsers.unshift([/\$(\!?\w+(\.\w+)*)/, function(event, handler, condition) {
    handler.endtest = condition;
    handler.end = _.endTest(condition);
}]);
_.endTest = function(condition) {
    var callsLeft = parseInt(condition, 10);
    if (callsLeft) {
        return function(){ return !--callsLeft; };
    }
    var not = condition.charAt(0) === '!';
    if (not){ condition = condition.substring(1); }
    if (condition && _.resolveRE.test(condition)) {
        return function endRef() {
            var value = _.resolve(condition, this, true);
            if (value === undefined) {
                value = _.resolve(condition, true);
            }
            if (typeof value === "function") {
                value = value.apply(this, arguments);
            }
            return not ? !value : value;
        };
    }
};
// overwrite fire.js' _.fireAll to watch for combo events
_.fireAll = function(target, events, props, _resumeIndex) {
    var event, sequence;
    for (var i=0; i<events.length; i++) {
        sequence = props.sequence = _.split.ter(events[i], '+', ',');
        for (var j=_resumeIndex||0; j < sequence.length && (!event||!event.isSequencePaused()); j++) {
            if (sequence[j]) {
                props.index = j;
                event = props.previousEvent = _.create(sequence[j], props);
                _.sequence(event, props, target);
                _.dispatch(target, event);
            } else {
                sequence.splice(j--, 1);
            }
        }
    }
    return event;
};
_.sequence = function(event, props, target, paused) {
    event.resumeSequence = function(index) {
        if (paused) {
            paused = false;
            _.fireAll(target, [props.sequence.join(',')], props, index||props.index+1);
        }
    };
    event.pauseSequence = function(promise) {
        if (paused !== false) {// multiple pauses is nonsense
            paused = true;
            return promise && promise.then(this.resumeSequence);
        }
    };
    event.isSequencePaused = function(){ return !!paused; };
};
_.combo = {
    convert: function(handler, text, texts) {
        handler.event = _.combo.event(text);
        if (handler.data && typeof handler.data[0] === "number") {
            handler.timeout = handler.data.shift();
        }
        delete handler.singleton;
        delete handler.selector;
        delete handler.location;
        delete handler.filters;
        delete handler.endtest;
        delete handler.end;
        // set up combo event handlers
        handler.texts = texts;
        handler.ordered = texts.ordered;
        handler.reset = _.combo.reset.bind(handler);
        handler.handlers = texts.map(function(text, index) {
            return _.handler(handler.target, text, _.combo.eventFn.bind(handler, index));
        });
        handler.reset();
    },
    event: function(text) {
        return _.combo[text] || (_.combo[text] = {
            category: 'combo',
            type: '_'+(++_.combo.count)
        });
    },
    split: function(text) {
        var parts = _.split.ter(text, '+');
        if (parts.length > 1) {
            parts.ordered = false;
        } else {
            parts = _.split.ter(text, ',');
            if (parts.length > 1) {
                parts.ordered = true;
            }
        }
        return parts;
    },
    count: 0,
    reset: function() {
        if (this.clear){ clearTimeout(this.clear); }
        this.unfired = this.texts.slice();
        this.events = [];
    },
    eventFn: function(index, e) {
        if (this.timeout && !this.clear) {
            this.clear = setTimeout(this.reset, this.timeout);
        }
        if (this.events.indexOf(e) < 0 &&
            (!this.ordered || index-1 === this.unfired.lastIndexOf(''))) {
            this.unfired[index] = '';
            this.events.push(e);
            if (!this.unfired.join('')) {
                var event = _.create('combo:'+this.event.type);
                event.events = this.events;
                event.text = this.text;
                _.dispatch(this.target, event);
                this.reset();
            }
        }
    }
};
Eventi.on(_, 'on:handler', function comboHandler(e, handler) {
	var text = handler.text,
		texts = _.combo.split(text);
	if (texts.length > 1) {
        _.combo.convert(handler, text, texts);
	}
}).on(_, 'off:filter', function comboFilter(e, filter) {
    if (_.combo.split(filter.text).length > 1) {
        filter.event = _.combo.event(filter.text);
    }
}).on(_, 'off:cleaned', function comboOff(e, handler) {
    if (handler.handlers) {
        handler.handlers.forEach(_.unhandle);
    }
});

    var sP = Event.prototype.stopPropagation || _.noop,
        sIP = Event.prototype.stopImmediatePropagation || _.noop;
    CustomEvent.prototype.stopPropagation = function() {
        this.propagationStopped = true;
        sP.call(this);
    };
    CustomEvent.prototype.stopImmediatePropagation = function() {
        this.immediatePropagationStopped = true;
        sIP.call(this);
    };

    // export Eventi (AMD, commonjs, or window/env)
    var define = global.define || _.noop;
    define((global.exports||global).Eventi = Eventi);

})(this, this.document);

/*! Vista - v2.0.1 - 2014-10-21
* https://github.com/esha/vista
* Copyright (c) 2014 ESHA Research; Licensed MIT */
(function(window, document, location, history) {
    'use strict';

    var init = function() {
        init = false;

        _._list = [];

        _.style = document.createElement('style');
        document.head.appendChild(_.style);

        window.addEventListener('hashchange', _.update);
        window.addEventListener('popstate', _.update);
        var intercept = function(name) {
            var fn = _['_'+name] = history[name];
            history[name] = function() {
                var ret = fn.apply(this, arguments);
                _.update();
                return ret;
            };
        };
        intercept('pushState');
        intercept('replaceState');

        _.define('start');
        _.update();
    },
    html = document.documentElement,
    _ = {
        version: '2.0.1',
        define: function(name, test, style) {
            if (init) {
                init();
            }
            switch (typeof test) {
                case "undefined":
                    test = name;
                    /* falls through */
                case "string":
                    test = new RegExp(test);
                    /* falls through */
                case "object":
                    test = test.test.bind(test);// haha!
            }
            _._list.push({ name: name, test: test });
            _.style.textContent += _.rules(name, style);
        },
        rules: function(name, style) {
            return '[vista~="'+name+'"],\n'+
                   '[vista-'+name+'] [vista~="!'+name+'"] {\n'+
                   '  display: none !important;\n'+
                   '}\n'+
                   '[vista-'+name+'] [vista~="'+name+'"] {\n'+
                   '  display: block !important;\n'+
                   '  display: '+(style||'initial')+' !important;\n'+
                   '}\n';
        },
        update: function() {
            var url = location+'',
                start = true;
            _._list.forEach(function(vista) {
                var show = vista.test(url);
                _.toggle(vista.name, show);
                if (show) {
                    start = false;
                }
            });
            _.toggle('start', start);
        },
        active: function(name) {
            return html.hasAttribute('vista-'+name);
        },
        toggle: function(name, active) {
            active = active === undefined ? !_.active(name) : active;
            html[active ? 'setAttribute' : 'removeAttribute']('vista-'+name, 'active');
        },
        config: function() {
            var meta = document.querySelectorAll('meta[itemprop=vista]');
            for (var i=0,m=meta.length; i<m; i++) {
                var el = meta[i],
                    definitions = (el.getAttribute('define')||'').split(' '),
                    style = el.getAttribute('style');
                for (var j=0,n=definitions.length; j<n; j++) {
                    var definition = definitions[j],
                        eq = definition.indexOf('=');
                    if (eq > 0) {
                        _.define(definition.substring(0, eq), definition.substring(eq+1), style);
                    } else {
                        _.define(definition, undefined, style);
                    }
                }
                el.setAttribute('itemprop', definitions.length ? 'vista-done' : 'vista-fail');
            }
            if (meta.length) {
                _.update();
            }
        }
    };

    _.config();
    document.addEventListener('DOMContentLoaded', _.config);

    // export Vista (AMD, commonjs, or window)
    var define = window.define || function(){};
    define((window.exports||window).Vista = _);

})(window, document, window.location, window.history);

/*! domx - v0.12.0 - 2014-10-28
* http://esha.github.io/domx/
* Copyright (c) 2014 ESHA Research; Licensed MIT, GPL */

(function(D, _) {
    "use strict";

var S = _.stringify = {
    map: Array.prototype.map,
    specialPrefix: '_',
    markup: {
        '\n': '<br>',
        '<': '<span class="markup">&lt;</span>',
        '>': '<span class="markup">&gt;</span>',
        '</': '<span class="markup">&lt;/</span>',
        '\t': '&nbsp;&nbsp;&nbsp;&nbsp;'
    },
    plain: {
        '\n': '\n',
        '<': '<',
        '>': '>',
        '</': '</',
        '/>': '/>',
        '\t': '    '
    },
    type: {
        attr: 'attr',
        string: 'string',
        tag: 'tag',
    },
    print: function(el, markup, indent) {
        var tag = el.tagName.toLowerCase(),
            code = markup ? S.markup : S.plain,
            line = S.isInline(el) ? '' : code['\n'],
            content = S.content(el, markup, indent+code['\t'], line),
            attrs = S.attrs(el, markup),
            special = markup ? S.special(el) : [];

        if (markup) {
            tag = S.mark(tag, S.type.tag);
        }
        var open = S.mark(code['<'] + tag + (attrs ? ' '+attrs : '') + code['>'], special),
            close = S.mark(code['</'] + tag + code['>'], special);
        if (content && line) {
            content = line + content + line + indent;
        }
        return indent + open + content + close;
    },
    isInline: function(el) {
        return (el.currentStyle || window.getComputedStyle(el,'')).display === 'inline' ||
            el.tagName.match(/^(H\d|LI|EM|A)$/i);
    },
    content: function(el, markup, indent, line) {
        var s = [];
        for (var i=0, m= el.childNodes.length; i<m; i++) {
            var node = el.childNodes[i];
            if (node.tagName) {
                s.push(S.print(node, markup, line ? indent : ''));
            } else if (node.nodeType === 3) {
                var text = node.textContent.replace(/^\s+|\s+$/g, ' ');
                if (text.match(/[^\s]/)) {
                    s.push(text);
                }
            }
        }
        return s.join(line);
    },
    attrs: function(el, markup) {
        return S.map.call(el.attributes, function(attr) {
            var name = attr.nodeName,
                value = attr.value;
            if (!markup || name.indexOf(S.specialPrefix) !== 0) {
                return markup ? S.mark(name+'=', S.type.attr) + S.mark('"'+value+'"', S.type.string)
                              : name+'="'+value+'"';
            }
        }).filter(S.notEmpty).join(' ');
    },
    special: function(el) {
        return S.map.call(el.attributes, function(attr) {
            var name = attr.nodeName;
            if (name.indexOf(S.specialPrefix) === 0) {
                return name.substr(1)+'="'+attr.value+'"';
            }
        }).filter(S.notEmpty);
    },
    mark: function(value, attrs) {
        if (attrs.length) {
            if (typeof attrs === "string"){ attrs = ['class="'+attrs+'"']; }
            return '<span '+attrs.join(' ')+'>'+value+'</span>';
        }
        return value;
    },
    notEmpty: function(s) {
        return s !== undefined && s !== null && s !== '';
    }
};
D.extend('stringify', function(markup, indent) {
    var s = '';
    this.each(function(el) {
        s += S.print(el, markup||false, indent||'');
    });
    return s;
});


})(document, document._);

/**
 * Sintax - An extremely lightweight Javascript syntax highlighter.
 * Highlights the text within <pre>'s on document load. Just include
 * and it'll do it's job.
 */
var Sintax = {
	highlight: function(pre) {
		if(pre) pre.innerHTML = Sintax.syntaxHighlight(pre.innerText || pre.textContent);
		else Array.prototype.forEach.call(document.getElementsByTagName("pre"), function(pre) {
			pre.innerHTML = Sintax.syntaxHighlight(pre.innerText || pre.textContent);
		});
	},

	syntaxHighlight: function(text) {
		var rules = {
			//Quotes
			"((?:\"|')[^\"']*(?:\"|'))": "<span class=\"quote\">$1</span>",

			//Match numbers
			"\\b([0-9]+)\\b": "<span class=\"number\">$1</span>",

			//Operators
			"(\\+|\\-|\\*|\\^)": "<span class=\"operator\">$1</span>",
		};

		var keywords = {
			//Javascript keywords
			"js": ["var", "new", "function", "return"],
			"element": ["document", "window"],

			//Types
			"type": ["Object", "Number", "String", "Array", "Boolean"],

			//Boolean
			"bool": ["true", "false"],

			"reserved": ["if", "for", "in", "while", "switch", "try", "catch", "else"]
		};

		for(var rule in rules) {
			text = text.replace(new RegExp(rule, "g"), rules[rule]);
		}

		//And replace the keywords
		for(var replace in keywords) {
			keywords[replace].forEach(function(keyword) {
				text = text.replace(new RegExp("\\b(" + keyword + ")\\b", "g"), "<span class=\"keyword " + replace + "\">$1</span>");
			})
		}

		//And now comments, line by line
		text = text.replace(new RegExp("(\\/\\/.*)", "g"), "<span class=\"comment\">$1</span>");
		text = text.replace(new RegExp("(/\\*[^(?:\\*/)]*\\*/)", "g"), "<span class=\"comment\">$1</span>");

		//Finally, replace tabs
		text = text.replace(new RegExp("\\t", "g"), "<span class=\"tab\">&#8213;&#8213; </span>");

		return text;
	}
};
Sintax.highlight();
(function(window, D) {
    "use strict";

    var Demo = function Demo(el) {
        if (!(this instanceof Demo)) {
            return new Demo(el);
        }
        if (!el.demo) {
            this.init(el);
        }
    };
    Demo.prototype = {
        timing: {
            intent: 1000,
            backspace: 25,
            typing: 50,
            tick: 250,
            minTicks: 8
        },
        init: function(el) {
            var self = el.demo = this;
            self.root = el;
            self.display = el.query('demo-dom');
            self.input = el.query('demo-in');
            self.output = el.query('demo-out');

            self.intent(self.input);
            self._exec = function() {
                self.execute(self.doc);
            };

            if (self.input.children.length) {
                self.initStory();
            }
            if (self.display) {
                self.doc = Demo.docify(self.display.children);
                self.initDisplay();
            } else {
                // a document w/no body content
                self.doc = Demo.docify(new DOMxList());
            }
            self.initControls();
        },
        initDisplay: function() {
            var self = this;
            function update() {
                self.display.innerHTML = self.doc.body.stringify(true);
            }
            update();
            self._observer = new MutationObserver(update)
                .observe(self.doc.html, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    characterData: true
                });
        },
        initStory: function() {
            var self = this;
            self._next = function(){ self.next(); };
            self.story = self.input.children.each('textContent');
            self.input.innerHTML = '';
            this._tick = function() {
                if (self.index){ self.execute(self.doc); }
                setTimeout(self._next, self.calcPause());
            };
            this._tick();
        },
        initControls: function() {
            var self = this,
                stop = self.root.query('[stop]'),
                start = self.root.query('[start]');
            self._stop = function() {
                self.stopped = true;
                self.root.classList.add('stopped');
            };
            self._start = function() {
                self.root.classList.remove('stopped');
                if (!(self.index in self.story)) {
                    self.index = 0;
                }
                self.stopped = false;
                self.next();
            };
            self.input.addEventListener('keydown', self._stop);
            if (stop) {
                stop.addEventListener('click', self._stop);
            }
            if (start) {
                start.addEventListener('click', self._start);
            }
        },
        next: function() {
            var self = this,
                code = self.story[self.index];
            if (code && !self.stopped) {
                var input = self.input;
                self.animate(self.input.value, code, function(s){ input.value = s; }, self._tick);
                self.index++;
            } else if (!code) {
                self._stop();
            }
        },
        calcPause: function() {
            // base pause of current line, not next line
            var code = this.story[this.index-1] || '';
            // first line and comments go instantly
            return !code || (code.indexOf('//') === 0 && code.indexOf('\n') < 0) ? 0 :
                // others default to 250ms per symbol, with a minimum of 2s
                Math.max(code.replace(/\w|\s/g, '').length, this.timing.minTicks) * this.timing.tick;
        },
        intent: function(el) {
            var timeout, self = this;
            el.addEventListener("keydown", function() {
                if (timeout){ clearTimeout(timeout); }
                timeout = setTimeout(self._exec, self.timing.intent);
            });
        },
        execute: function(document) {
            var code = this.input.value,
                result;
            if (code && code.indexOf('//') !== 0) {
                try {
                    result = eval(code);
                    Demo.flash(result);
                } catch (e) {
                    e.code = code;
                    result = e;
                }
                if (this.output) {
                    var log = this.output.innerHTML;
                    this.output.innerHTML = '<p class="line">'+
                        Demo.describe(result)+'</p>' + log;
                } else {
                    console.log(code);
                    console.log(result);
                }
            }
        },
        animate: function(text, next, update, finish) {
            var i = text.length, self = this, action = 'typing';
            (function _step() {
                if (!self.stopped) {
                    if (next.indexOf(text) < 0) {
                        action = 'backspace';
                        text = text.substr(0, --i);
                    } else if (i < next.length) {
                        action = 'typing';
                        text = next.substr(0, ++i);
                    } else {
                        return finish();
                    }
                    update(text);
                    setTimeout(_step, self.timing[action]);
                }
            })();
        },
        index: 0
    };

    Demo.docify = function(dom) {
        var d = document.createDocumentFragment();
        d.html = d.documentElement = document.createElement('html');
        d.appendChild(d.html);
        d.html.appendChild(d.body = document.createElement('body'));
        dom.each(function(el) {
            el.remove();
            d.body.append(el);
        });
        d.html.dot();
        try {
            delete d.parentNode;
            d.parentNode = window;
        } catch (e) {}
        return d;
    };

    Demo.describe = function(el) {
        if (document._.isList(el) && el.each) {
            return el.each(Demo.describe).join(', ');
        }
        if (el instanceof HTMLElement) {
            var id = el.getAttribute('id'),
                classes = el.getAttribute('class');
            return '&lt;'+
                el.tagName.toLowerCase()+
                (id ? '#'+id : '')+
                (classes ? '.'+classes.split(' ').join('.') : '')+
            '&gt;';
        }
        if (el instanceof Node) {
            return el.value;
        }
        if (typeof el === "object") {
            return JSON.stringify(el);
        }
        return el && el.value || (el+'');
    }

    // this all hitches on css animations and stringify's _attr support
    Demo.highlight = function(el) {
        if (el.setAttribute) {
            el.setAttribute('_highlight', 'true');
        }
    };
    Demo.unhighlight = function(el) {
        if (el.removeAttribute) {
            el.removeAttribute('_highlight');
        }
    };
    var flashTimeout;
    Demo.flash = function(el) {
        if (el && el.each) {
            if (flashTimeout){ clearTimeout(flashTimeout); }
            flashTimeout = setTimeout(function() {
                el.each(Demo.highlight);
                setTimeout(function() {
                    el.each(Demo.unhighlight);
                }, 1000);
            }, Demo.flash.time || 100);
        }
    };

    Demo.onload = function() {
        D.queryAll('demo-x').each(Demo);
    };

    window.Demo = Demo;
    Demo.onload();// early availability
    D.addEventListener('DOMContentLoaded', Demo.onload);// eventual consistency

})(window, document);
window.D = document;
//# sourceMappingURL=domx-docs.js.map