// traverse.js
_.parents = [Element, DocumentFragment, D];
_.fn(_.parents.concat(_.lists), {
    queryAll: function(selector, count) {
        var self = _.isList(this) ? this : [this],
            list = new DOMxList(count);
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

_.fn(_.lists, 'only', function only(b, e) {
    var arr = this.toArray(),
        num = b >= 0 || b < 0,
        solo = arguments.length === 1;
    arr = num ? arr.slice(b, e || (b + 1) || undefined) :
                arr.filter(
                    typeof b === "function" ? b :
                    solo ? function match(el) {
                               return el.matches && el.matches(b) || b in el;
                           } :
                           function eachVal(el) {
                               return (el.each && el.each(b) || el[b]) === e;
                           }
                );
    return num && solo ? arr[0] : new DOMxList(arr);
});

D.extend('all', function(path, inclusive, _list) {
    var list = _list || new DOMxList(),
        el = inclusive ? this : this[path];
    while (el) {
        list.add(el);
        el = _.isList(el) ? el.all(path, 0, list) && 0 : el[path];
    }
    return list;
}, [Node]);

// ensure element.matches(selector) availability
var Ep = Element.prototype,
    aS = 'atchesSelector';
_.define(Ep, 'matches', Ep['m'] || Ep['webkitM'+aS] || Ep['mozM'+aS] || Ep['msM'+aS]);
// /traverse.js
