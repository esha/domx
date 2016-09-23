// insert.js
var A = _.insert = {
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

X.add('insert', function(arg, ref) {
    if (typeof arg === "string") {// turn arg into an insertable
        return A.create(this, arg, ref);
    }
    if (_.isList(arg)) {// list of insert-ables
        var list = new X.List();
        for (var i=0,m=arg.length; i<m; i++) {
            list.add(this.insert(arg[i], ref));
        }
        return list;
    }
    A.insert(this, arg, ref);// arg is an insert-able
    return arg;
}, X.parents);

X.add('remove', function() {
    var parent = this.parentNode;
    if (parent) {
        parent.removeChild(this);
    }
});
// /insert.js
