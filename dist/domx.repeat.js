/*! domx - v0.14.0 - 2014-11-25
* http://esha.github.io/domx/
* Copyright (c) 2014 ESHA Research; Licensed MIT, GPL */

(function(D) {
    "use strict";

    // shortcuts
    var X = D.x,
        _ = X._;

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


})(document);
