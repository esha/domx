// traverse.js
_.define(X.containers, {
    queryAll: function(selector, count) {
        var self = _.isList(this) ? this : [this],
            list = new X.List(count);
        for (var i=0, m=self.length; i<m && (!count || count > list.length); i++) {
            list.add(self[i][
                count === list.length+1 ? 'querySelector' : 'querySelectorAll'
            ](selector));
        }
        return list;
    },
    query: function(selector) {
        return this.queryAll(selector, 1)[0];
    }
});

_.define(X.lists, {
    only: function only(b, e) {
        var arr = this.toArray();
        arr = b >= 0 || b < 0 ?
            arr.slice(b, e || (b + 1) || undefined) :
            arr.filter(
                typeof b === "function" ?
                    b :
                    arguments.length === 1 ?
                        function match(n) {
                            return n[n.matches ? 'matches' : 'hasOwnProperty'](b);
                        } :
                        function eachVal(n) {
                            return (n.each ? n.each(b) : n[b]) === e;
                        }
            );
        return new X.List(arr);
    },
    not: function not() {
        var exclude = this.only.apply(this, arguments);
        return this.only(function(n) {
            return exclude.indexOf(n) < 0;
        });
    }
});

_.estFnArgs = function(node, prop, test, inclusive) {
    prop = _.alias[prop] || prop;
    if (!(prop in node)) {
        inclusive = test === undefined ?
            typeof prop === "boolean" ? prop : true :
            test;
        test = prop;
        prop = 'parentElement';
    }
    if (typeof test === "boolean") {
        inclusive = test;
        test = null;
    }
    if (!test) {
        test = function(){ return true; };
    } else if (typeof test === "string") {
        var selector = test;
        test = function(node) {
            return node.matches && node.matches(selector);
        };
    }
    return [prop, test, inclusive||false];
};

_.define(X.nodes, 'farthest', function(prop, test, inclusive) {
    var args = _.estFnArgs(this, prop, test, inclusive);
    return _.farthest(this, args[0], args[1], args[2] && args[1](this) ? this : null);
});
_.farthest = function(node, prop, test, previous) {
    return node && (node = node[prop]) ?
        _.farthest(node, prop, test, test(node) ? node : previous) :
        previous;
};

_.define(X.nodes, 'closest', function(prop, test, inclusive) {
    var args = _.estFnArgs(this, prop, test, inclusive);
    return args[2] && args[1](this) ? this : _.closest(this, args[0], args[1]);
});
_.closest = function(node, prop, test) {
    return node && (node = node[prop]) ?
        test(node) ? node : _.closest(node, prop, test) :
        null;
};

X.add('all', function(prop, fn, inclusive, _list) {
    if (fn === true){ inclusive = fn; fn = undefined; }
    _list = _list || new X.List();

    var value = inclusive ? this : this[_.alias[prop]||prop];
    if (value) {
        var result = fn && fn.call(this, value, _list);
        if (result !== null) {
            _list.add(result || value);
        }
        if (value.all && (value.length || !_.isList(value))) {
            value.all(prop, fn, false, _list);
        }
    }
    return _list;
}, [Node]);

// ensure element.matches(selector) availability
var Ep = Element.prototype,
    aS = 'atchesSelector';
_.defprop(Ep, 'matches', Ep['m'] || Ep['webkitM'+aS] || Ep['mozM'+aS] || Ep['msM'+aS]);
// /traverse.js
