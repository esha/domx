(function(window, D) {
    "use strict";

    var RandomXProto = Object.create(HTMLElement.prototype);
    RandomXProto.createdCallback = function(){ this.randomize(); };
    RandomXProto.randomize = function() {
        var all = this._randomize || (this._randomize = this.queryAll('*')),
            chosen = all[Math.floor(Math.random()*all.length)];
        this.queryAll('*').remove();
        this.append(chosen);
    };

    if (D.registerElement) {
        window.RandomX = D.registerElement('random-x', {
            prototype: RandomXProto
        });
    } else {
        window.RandomX = function RandomX(el) {
            if (!(this instanceof RandomX)) {
                return new RandomX(el);
            }
            if (!this._created) {
                this.createdCallback();
                this._created = true;
            }
        }
        RandomX.prototype = RandomXProto;
        RandomX.load = function() {
            D.queryAll('random-x').each(RandomX);
        };

        window.RandomX = RandomX;
        RandomX.load();// early availability
        D.addEventListener('DOMContentLoaded', RandomX.load);// eventual consistency
    }

})(window, document);