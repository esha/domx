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
