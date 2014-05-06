_.fn(_.nodes, 'value', {
    get: function() {
        var value = (_.get[this.tagName] || _.get).call(this, this);
        if (value) {
            try{ value = JSON.parse(value); }catch(e){}
        }
        return value;
    },
    set: function(value) {
        if (value && typeof value !== "string") {
            try{ value = JSON.stringify(value); }catch(e){}
        }
        return (_.set[this.tagName] || _.set).call(this, this, value);
    }
});
_.get = function(node) {
    return node.nodeValue ||
        (node.hasAttribute && node.hasAttribute('value') ?
            node.getAttribute('value') :
            (node.children && node.children.length ?
                node.innerHTML :
                node.textContent
            )
        );
};
_.set = function(node, value) {
    if (!node.hasAttribute) {
        node.nodeValue = value;
    } else if (node.hasAttribute('value')) {
        node.setAttribute('value', value);
    } else if (value && value.trim().charAt(0) === '<') {
        node.innerHTML = value;
    } else {
        node.textContent = value;
    }
};