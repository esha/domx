// emmet.js
var I = _.insert;
I.create = function(node, code, ref) {
    var root = D.createDocumentFragment(),// work with detached root
        el = _.emmet(root, code);
    I.insert(node, root, ref);// attach fragment
    return el;
};
_.emmet = function(element, code) {
    var parts = code.split(IE.split),
        root = element;
    while (parts.length) {
        var part = IE.next(parts),
            action = IE[part.charAt(0)],
            content = action ? part.substr(1) || IE.next(parts) : part;
        element = (action || IE['>']).call(element, content, root) || element;
    }
    return element;
};
var IE = I.emmet = {
    // modify existing node
    '#': function hash(id) {
        this.each('id', id);
    },
    '.': function dot(cls) {
        this.each('classList.add', cls);
    },
    '[': function attr(attrs) {
        attrs = attrs.substr(0, attrs.length-1).match(/(?:[^\s"]+|("[^"]+"))+/g);
        for (var i=0,m=attrs.length; i<m; i++) {
            var attr = attrs[i].split('=');
            this.each('setAttribute', attr[0], (attr[1]||'').replace(/"/g, ''));
        }
    },

    // add node(s)
    '>': function child(part) {
        var element = this;
        if (part.charAt(0) in IE) {// if nested emmet action, recurse on
            return _.emmet(element, part);
        }
        if (this instanceof X.List) {
            return this.insert(part);
        }
        element = D.createElement(part);
        this.appendChild(element);
        return element;
    },
    '*': function clones(count, root) {
        var parent = IE.parent(this) || root,
            els = new X.List(this);
        for (var i=1; i<count; i++) {
            els.add(this.each('cloneNode', true));
            parent.insert(els[i]);
        }
        //TODO: numbering for els
        return els;
    },
    '{': function txt(text) {
        this.appendChild(D.createTextNode(text.substr(0, text.length-1)));
    },
    '(': function group(part) {
        var group = D.createDocumentFragment();
        _.emmet(group, part.substr(0, part.length-1));
        var els = new X.List(group.childNodes);
        this.appendChild(group);
        return els;
    },

    // shift context then add
    '+': function sibling(part) {
        return IE['>'].call(IE.parent(this), part);
    },
    '^': function uncle(part) {
        return IE['+'].call(IE.parent(this), part);
    },
    ',': function atRoot(part, root) {
        return IE['>'].call(root, part);
    },

    // utilities
    ends: {
        '[':']',
        '{':'}',
        '(':')'
    },
    parent: function(ctx) {
        return ctx && (ctx.parentNode || ctx.each('parentNode')[0]);
    },
    split: /(?=\#|\,|\.|\[|\>|\+|\*|\^|\{|\()/g,
    next: function next(parts) {
        var part = parts.shift(),
            end = part && IE.ends[part.charAt(0)];
        if (end) {
            // for group part, gobble subsequent parts until we find an unescaped end
            while (end !== part[part.length-1] || '\\' === part[part.length-2]) {
                part += parts.shift() || end;// kindly auto-close if ending is absent
            }
            // unescape escaped ends
            part = part.replace(new RegExp('\\\\\\'+end, 'g'), end);
        }
        return part;
    }
};
// /emmet.js
