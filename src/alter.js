(function(D) {
    "use strict";

    var _ = D._;
    var A = _.add = {
        fn: function(arg, ref) {
            if (_.isList(this)) {
                return this.each(function(el){ return A.all(el, arg, ref); });
            }
            return A.all(this, arg, ref);
        },
        all: function(node, arg, ref) {
            if (typeof arg === "string") {// turn arg into an appendable
                return A.create(node, arg, ref);
            }
            if (_.isList(arg)) {// list of append-ables
                var list = new _.List();
                for (var i=0,m=arg.length; i<m; i++) {
                    list.add(A.all(node, arg[i], ref));
                }
                return list;
            }
            A.insert(node, arg, ref);// arg is an append-able
            return arg;
        },
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
                case "string": return node[ref+'Child'];
                case "number": return node.children[ref];
                case "object": return ref;
                case "function": return ref.call(node, node);
            }
        }
    };
    _.fn('add', A.fn);
    _.fn('remove', function(chain) {
        return this.each(function(node) {
            var parent = node.parentNode;
            if (parent) {
                parent.removeChild(node);
                if (chain){ return parent; }
            }
        });
    });

})(document);
