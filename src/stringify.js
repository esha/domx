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
            el.tagName.match(/^(H\d|LI)$/i);
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
            var name = attr.name,
                value = attr.value;
            if (!markup || name.indexOf(S.specialPrefix) !== 0) {
                return markup ? S.mark(name+(value?'=':''), S.type.attr) + (value ? S.mark('"'+value+'"', S.type.string) : '')
                              : name+(value ? '="'+value+'"' : '');
            }
        }).filter(S.notEmpty).join(' ');
    },
    special: function(el) {
        return S.map.call(el.attributes, function(attr) {
            var name = attr.name;
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
X.add('stringify', function(markup, indent) {
    return S.print(this, markup||false, indent||'');
});
