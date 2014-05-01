(function(D) {
    "use strict";

    var _ = D._;
    _.traverse = {
        find: function(selector, count) {
            var self = _.isList(this) ? this : [this],
                list = new _.List();
            for (var i=0, m=self.length; i<m && (!count || list.length < count); i++) {
                if (count === list.length + 1) {
                    var node = self[i].querySelector(selector);
                    if (node){ list.add(node); }
                } else {
                    var nodes = self[i].querySelectorAll(selector);
                    for (var j=0, l=nodes.length; j<l && (!count || list.length < count); j++) {
                        list.add(nodes[j]);
                    }
                }
            }
            return list;
        },
        findOne: function(selector) {
            return this.find(selector, 1)[0];
        },
        only: function(b, e) {
            var arr = this.toArray();
            return new _.List(b >= 0 || b < 0 ?
                arr.slice(b, e || (b + 1) || undefined) :
                arr.filter(
                    typeof b === "function" ? b : function(el){ return el.matches(b); }
                )
            );
        }
    };

    _.define(D, 'find', _.traverse.find);
    _.define(D, 'findOne', _.traverse.findOne);
    _.fn('find', _.traverse.find);
    _.fn('findOne', _.traverse.findOne);
    _.fn('only', _.traverse.only, _.lists);

    // ensure element.matches(selector) availability
    var Ep = Element.prototype,
        aS = 'atchesSelector';
    _.define(Ep, 'matches', Ep['m'] || Ep['webkitM'+aS] || Ep['mozM'+aS] || Ep['msM'+aS]);

})(document);