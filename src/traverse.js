(function(D) {
    "use strict";

    var _ = D._;
    _.traverse = {
        queryAll: function(selector, count) {
            var self = _.isList(this) ? this : [this],
                list = new _.List(count);
            for (var i=0, m=self.length; i<m && (!count || count > list.length); i++) {
                list.add(self[i][
                    count === list.length+1 ? 'querySelector' : 'querySelectorAll'
                ](selector));
            }
            return list;
        },
        query: function(selector) {
            return this.queryAll(selector, 1)[0];
        },
        only: function(b, e) {
            var arr = this.toArray();
            return new _.List(b >= 0 || b < 0 ?
                arr.slice(b, e || (b + 1) || undefined) :
                arr.filter(
                    typeof b === "function" ? b : 
                        e === undefined ? function match(el){ return el.matches(b); } :
                            function eachVal(el){ return el.each(b) === e; }
                )
            );
        }
    };

    _.define(D, 'queryAll', _.traverse.queryAll);
    _.define(D, 'query', _.traverse.query);
    _.fn('queryAll', _.traverse.queryAll);
    _.fn('query', _.traverse.query);
    _.fn('only', _.traverse.only, _.lists);

    // ensure element.matches(selector) availability
    var Ep = Element.prototype,
        aS = 'atchesSelector';
    _.define(Ep, 'matches', Ep['m'] || Ep['webkitM'+aS] || Ep['mozM'+aS] || Ep['msM'+aS]);

})(document);