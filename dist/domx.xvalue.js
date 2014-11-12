/*! domx - v0.13.0 - 2014-11-12
* http://esha.github.io/domx/
* Copyright (c) 2014 ESHA Research; Licensed MIT, GPL */

(function(D, _) {
    "use strict";

var V = _.xValue = {
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
        var kids = !this.noValues && this.childNodes.length;
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
    noValues: V.booleanAttr('xvalue-none')
}, true);

_.define(_.parents.concat(_.lists), {
    queryName: function(name) {
        return this.queryNameAll(name, 1)[0];
    },
    queryNameAll: function(name, count, _list) {
        _list = _list || new XList(count);
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


})(document, document._);
