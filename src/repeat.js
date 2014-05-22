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
