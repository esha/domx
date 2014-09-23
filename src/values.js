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
    properValue: {
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
                new DOMxList(el) :
                null;
        }
    },
    nameValue: {
        get: function() {
            var values;
            if (V.name(this)) {
                this.nameGroup.each(function(node) {
                    values = V.combine(values, node.properValue);
                });
            }
            return values || this.properValue;
        },
        set: function(values) {
            if (V.name(this) && Array.isArray(values)) {
                var group = this.nameGroup;
                if (!values.length && group.length && !group[0].hasAttribute(R.id)) {
                    R.init(group[0], true);
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
                this.properValue = values;
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
        _list = _list === undefined ? new DOMxList() : _list;
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
    properValue:  {
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
                input.checked = value.indexOf(input.baseValue) >= 0;
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
                    value = V.combine(value, node.properValue, true);
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
                this.nameGroup.each(function(input) {
                    input.checked = value.indexOf(input.baseValue) >= 0;
                });
            } else {
                this.baseValue = value;
            }
        }
    }
}, true);

_.define([HTMLSelectElement], {
    properValue: {
        get: function() {
            if (this.multiple) {
                var selected = this.children.only('selected', true);
                return selected.length ? selected.each('properValue') :
                    this.children.length > 1 ? [] : null;
            }
            return V.parse(this.baseValue);
        },
        set: function(value) {
            if (this.multiple) {
                value = (Array.isArray(value) ? value : [value]).map(V.string);
                this.children.each(function(option) {
                    if (value.indexOf(option.baseValue) >= 0) {
                        option.selected = true;
                    }
                });
            } else {
                this.baseValue = V.string(value);
            }
        }
    }
}, true);
