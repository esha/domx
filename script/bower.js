/*!
 * Shim for MutationObserver interface
 * Author: Graeme Yeates (github.com/megawac)
 * Repository: https://github.com/megawac/MutationObserver.js
 * License: WTFPL V2, 2004 (wtfpl.net).
 * Though credit and staring the repo will make me feel pretty, you can modify and redistribute as you please.
 * Attempts to follow spec (http://www.w3.org/TR/dom/#mutation-observers) as closely as possible for native javascript
 * See https://github.com/WebKit/webkit/blob/master/Source/WebCore/dom/MutationObserver.cpp for current webkit source c++ implementation
 */

/**
 * prefix bugs:
    -https://bugs.webkit.org/show_bug.cgi?id=85161
    -https://bugzilla.mozilla.org/show_bug.cgi?id=749920
*/
this.MutationObserver = this.MutationObserver || this.WebKitMutationObserver || (function(undefined) {
    "use strict";
    /**
     * @param {function(Array.<MutationRecord>, MutationObserver)} listener
     * @constructor
     */
    function MutationObserver(listener) {
        /**
         * @type {Array.<Object>}
         * @private
         */
        this._watched = [];
        /** @private */
        this._listener = listener;
    }

    /**
     * Start a recursive timeout function to check all items being observed for mutations
     * @type {MutationObserver} observer
     * @private
     */
    function startMutationChecker(observer) {
        (function check() {
            var mutations = observer.takeRecords();

            if (mutations.length) { //fire away
                //calling the listener with context is not spec but currently consistent with FF and WebKit
                observer._listener(mutations, observer);
            }
            /** @private */
            observer._timeout = setTimeout(check, MutationObserver._period);
        })();
    }

    /**
     * Period to check for mutations (~32 times/sec)
     * @type {number}
     * @expose
     */
    MutationObserver._period = 30 /*ms+runtime*/ ;

    /**
     * Exposed API
     * @expose
     * @final
     */
    MutationObserver.prototype = {
        /**
         * see http://dom.spec.whatwg.org/#dom-mutationobserver-observe
         * not going to throw here but going to follow the current spec config sets
         * @param {Node|null} $target
         * @param {Object|null} config : MutationObserverInit configuration dictionary
         * @expose
         * @return undefined
         */
        observe: function($target, config) {
            /**
             * Using slightly different names so closure can go ham
             * @type {!Object} : A custom mutation config
             */
            var settings = {
                attr: !! (config.attributes || config.attributeFilter || config.attributeOldValue),

                //some browsers are strict in their implementation that config.subtree and childList must be set together. We don't care - spec doesn't specify
                kids: !! config.childList,
                descendents: !! config.subtree,
                charData: !! (config.characterData || config.characterDataOldValue)
            };

            var watched = this._watched;

            //remove already observed target element from pool
            for (var i = 0; i < watched.length; i++) {
                if (watched[i].tar === $target) watched.splice(i, 1);
            }

            if (config.attributeFilter) {
                /**
                 * converts to a {key: true} dict for faster lookup
                 * @type {Object.<String,Boolean>}
                 */
                settings.afilter = reduce(config.attributeFilter, function(a, b) {
                    a[b] = true;
                    return a;
                }, {});
            }

            watched.push({
                tar: $target,
                fn: createMutationSearcher($target, settings)
            });

            //reconnect if not connected
            if (!this._timeout) {
                startMutationChecker(this);
            }
        },

        /**
         * Finds mutations since last check and empties the "record queue" i.e. mutations will only be found once
         * @expose
         * @return {Array.<MutationRecord>}
         */
        takeRecords: function() {
            var mutations = [];
            var watched = this._watched;

            for (var i = 0; i < watched.length; i++) {
                watched[i].fn(mutations);
            }

            return mutations;
        },

        /**
         * @expose
         * @return undefined
         */
        disconnect: function() {
            this._watched = []; //clear the stuff being observed
            clearTimeout(this._timeout); //ready for garbage collection
            /** @private */
            this._timeout = null;
        }
    };

    /**
     * Simple MutationRecord pseudoclass. No longer exposing as its not fully compliant
     * @param {Object} data
     * @return {Object} a MutationRecord
     */
    function MutationRecord(data) {
        var settings = { //technically these should be on proto so hasOwnProperty will return false for non explicitly props
            type: null,
            target: null,
            addedNodes: [],
            removedNodes: [],
            previousSibling: null,
            nextSibling: null,
            attributeName: null,
            attributeNamespace: null,
            oldValue: null
        };
        for (var prop in data) {
            if (has(settings, prop) && data[prop] !== undefined) settings[prop] = data[prop];
        }
        return settings;
    }

    /**
     * Creates a func to find all the mutations
     *
     * @param {Node} $target
     * @param {!Object} config : A custom mutation config
     */
    function createMutationSearcher($target, config) {
        /** type {Elestuct} */
        var $oldstate = clone($target, config); //create the cloned datastructure

        /**
         * consumes array of mutations we can push to
         *
         * @param {Array.<MutationRecord>} mutations
         */
        return function(mutations) {
            var olen = mutations.length;

            //Alright we check base level changes in attributes... easy
            if (config.attr && $oldstate.attr) {
                findAttributeMutations(mutations, $target, $oldstate.attr, config.afilter);
            }

            //check childlist or subtree for mutations
            if (config.kids || config.descendents) {
                searchSubtree(mutations, $target, $oldstate, config);
            }


            //reclone data structure if theres changes
            if (mutations.length !== olen) {
                /** type {Elestuct} */
                $oldstate = clone($target, config);
            }
        };
    }

    /* attributes + attributeFilter helpers */

    /**
     * fast helper to check to see if attributes object of an element has changed
     * doesnt handle the textnode case
     *
     * @param {Array.<MutationRecord>} mutations
     * @param {Node} $target
     * @param {Object.<string, string>} $oldstate : Custom attribute clone data structure from clone
     * @param {Object} filter
     */
    function findAttributeMutations(mutations, $target, $oldstate, filter) {
        var checked = {};
        var attributes = $target.attributes;
        var attr;
        var name;
        var i = attributes.length;
        while (i--) {
            attr = attributes[i];
            name = attr.name;
            if (!filter || has(filter, name)) {
                if (attr.value !== $oldstate[name]) {
                    //The pushing is redundant but gzips very nicely
                    mutations.push(MutationRecord({
                        type: "attributes",
                        target: $target,
                        attributeName: name,
                        oldValue: $oldstate[name],
                        attributeNamespace: attr.namespaceURI //in ie<8 it incorrectly will return undefined
                    }));
                }
                checked[name] = true;
            }
        }
        for (name in $oldstate) {
            if (!(checked[name])) {
                mutations.push(MutationRecord({
                    target: $target,
                    type: "attributes",
                    attributeName: name,
                    oldValue: $oldstate[name]
                }));
            }
        }
    }

    /**
     * searchSubtree: array of mutations so far, element, element clone, bool
     * synchronous dfs comparision of two nodes
     * This function is applied to any observed element with childList or subtree specified
     * Sorry this is kind of confusing as shit, tried to comment it a bit...
     * codereview.stackexchange.com/questions/38351 discussion of an earlier version of this func
     *
     * @param {Array} mutations
     * @param {Node} $target
     * @param {!Object} $oldstate : A custom cloned node from clone()
     * @param {!Object} config : A custom mutation config
     */
    function searchSubtree(mutations, $target, $oldstate, config) {
        /*
         * Helper to identify node rearrangment and stuff...
         * There is no gaurentee that the same node will be identified for both added and removed nodes
         * if the positions have been shuffled.
         * conflicts array will be emptied by end of operation
         */
        function resolveConflicts(conflicts, node, $kids, $oldkids, numAddedNodes) {
            // the distance between the first conflicting node and the last
            var distance = conflicts.length - 1;
            // prevents same conflict being resolved twice consider when two nodes switch places.
            // only one should be given a mutation event (note -~ is used as a math.ceil shorthand)
            var counter = -~((distance - numAddedNodes) / 2);
            var $cur;
            var oldstruct;
            var conflict;
            while((conflict = conflicts.pop())) {
                $cur = $kids[conflict.i];
                oldstruct = $oldkids[conflict.j];

                //attempt to determine if there was node rearrangement... won't gaurentee all matches
                //also handles case where added/removed nodes cause nodes to be identified as conflicts
                if (config.kids && counter && Math.abs(conflict.i - conflict.j) >= distance) {
                    mutations.push(MutationRecord({
                        type: "childList",
                        target: node,
                        addedNodes: [$cur],
                        removedNodes: [$cur],
                        // haha don't rely on this please
                        nextSibling: $cur.nextSibling,
                        previousSibling: $cur.previousSibling
                    }));
                    counter--; //found conflict
                }

                //Alright we found the resorted nodes now check for other types of mutations
                if (config.attr && oldstruct.attr) findAttributeMutations(mutations, $cur, oldstruct.attr, config.afilter);
                if (config.charData && $cur.nodeType === 3 && $cur.nodeValue !== oldstruct.charData) {
                    mutations.push(MutationRecord({
                        type: "characterData",
                        target: $cur,
                        oldValue: oldstruct.charData
                    }));
                }
                //now look @ subtree
                if (config.descendents) findMutations($cur, oldstruct);
            }
        }

        /**
         * Main worker. Finds and adds mutations if there are any
         * @param {Node} node
         * @param {!Object} old : A cloned data structure using internal clone
         */
        function findMutations(node, old) {
            var $kids = node.childNodes;
            var $oldkids = old.kids;
            var klen = $kids.length;
            // $oldkids will be undefined for text and comment nodes
            var olen = $oldkids ? $oldkids.length : 0;
            // if (!olen && !klen) return; //both empty; clearly no changes

            //we delay the intialization of these for marginal performance in the expected case (actually quite signficant on large subtrees when these would be otherwise unused)
            //map of checked element of ids to prevent registering the same conflict twice
            var map;
            //array of potential conflicts (ie nodes that may have been re arranged)
            var conflicts;
            var id; //element id from getElementId helper
            var idx; //index of a moved or inserted element

            var oldstruct;
            //current and old nodes
            var $cur;
            var $old;
            //track the number of added nodes so we can resolve conflicts more accurately
            var numAddedNodes = 0;

            //iterate over both old and current child nodes at the same time
            var i = 0, j = 0;
            //while there is still anything left in $kids or $oldkids (same as i < $kids.length || j < $oldkids.length;)
            while( i < klen || j < olen ) {
                //current and old nodes at the indexs
                $cur = $kids[i];
                oldstruct = $oldkids[j];
                $old = oldstruct && oldstruct.node;

                if ($cur === $old) { //expected case - optimized for this case
                    //check attributes as specified by config
                    if (config.attr && oldstruct.attr) /* oldstruct.attr instead of textnode check */findAttributeMutations(mutations, $cur, oldstruct.attr, config.afilter);
                    //check character data if set
                    if (config.charData && $cur.nodeType === 3 && $cur.nodeValue !== oldstruct.charData) {
                        mutations.push(MutationRecord({
                            type: "characterData",
                            target: $cur,
                            oldValue: oldstruct.charData
                        }));
                    }

                    //resolve conflicts; it will be undefined if there are no conflicts - otherwise an array
                    if (conflicts) resolveConflicts(conflicts, node, $kids, $oldkids, numAddedNodes);

                    //recurse on next level of children. Avoids the recursive call when there are no children left to iterate
                    if (config.descendents && ($cur.childNodes.length || oldstruct.kids && oldstruct.kids.length)) findMutations($cur, oldstruct);

                    i++;
                    j++;
                } else { //(uncommon case) lookahead until they are the same again or the end of children
                    if(!map) { //delayed initalization (big perf benefit)
                        map = {};
                        conflicts = [];
                    }
                    if ($cur) {
                        //check id is in the location map otherwise do a indexOf search
                        if (!(map[id = getElementId($cur)])) { //to prevent double checking
                            //mark id as found
                            map[id] = true;
                            //custom indexOf using comparitor checking oldkids[i].node === $cur
                            if ((idx = indexOfCustomNode($oldkids, $cur, j)) === -1) {
                                if (config.kids) {
                                    mutations.push(MutationRecord({
                                        type: "childList",
                                        target: node,
                                        addedNodes: [$cur], //$cur is a new node
                                        nextSibling: $cur.nextSibling,
                                        previousSibling: $cur.previousSibling
                                    }));
                                    numAddedNodes++;
                                }
                            } else {
                                conflicts.push({ //add conflict
                                    i: i,
                                    j: idx
                                });
                            }
                        }
                        i++;
                    }

                    if ($old &&
                       //special case: the changes may have been resolved: i and j appear congurent so we can continue using the expected case
                       $old !== $kids[i]
                    ) {
                        if (!(map[id = getElementId($old)])) {
                            map[id] = true;
                            if ((idx = indexOf($kids, $old, i)) === -1) {
                                if(config.kids) {
                                    mutations.push(MutationRecord({
                                        type: "childList",
                                        target: old.node,
                                        removedNodes: [$old],
                                        nextSibling: $oldkids[j + 1], //praise no indexoutofbounds exception
                                        previousSibling: $oldkids[j - 1]
                                    }));
                                    numAddedNodes--;
                                }
                            } else {
                                conflicts.push({
                                    i: idx,
                                    j: j
                                });
                            }
                        }
                        j++;
                    }
                }//end uncommon case
            }//end loop

            //resolve any remaining conflicts
            if (conflicts) resolveConflicts(conflicts, node, $kids, $oldkids, numAddedNodes);
        }
        findMutations($target, $oldstate);
    }

    /**
     * Utility
     * Cones a element into a custom data structure designed for comparision. https://gist.github.com/megawac/8201012
     *
     * @param {Node} $target
     * @param {!Object} config : A custom mutation config
     * @return {!Object} : Cloned data structure
     */
    function clone($target, config) {
        var recurse = true; // set true so childList we'll always check the first level
        return (function copy($target) {
            var isText = $target.nodeType === 3;
            var elestruct = {
                /** @type {Node} */
                node: $target
            };

            //is text or comemnt node
            if (isText || $target.nodeType === 8) {
                if (isText && config.charData) {
                    elestruct.charData = $target.nodeValue;
                }
            } else { //its either a element or document node (or something stupid)

                if(config.attr && recurse) { // add attr only if subtree is specified or top level
                    /**
                     * clone live attribute list to an object structure {name: val}
                     * @type {Object.<string, string>}
                     */
                    elestruct.attr = reduce($target.attributes, function(memo, attr) {
                        if (!config.afilter || config.afilter[attr.name]) {
                            memo[attr.name] = attr.value;
                        }
                        return memo;
                    }, {});
                }

                // whether we should iterate the children of $target node
                if(recurse && ((config.kids || config.charData) || (config.attr && config.descendents)) ) {
                    /** @type {Array.<!Object>} : Array of custom clone */
                    elestruct.kids = map($target.childNodes, copy);
                }

                recurse = config.descendents;
            }
            return elestruct;
        })($target);
    }

    /**
     * indexOf an element in a collection of custom nodes
     *
     * @param {NodeList} set
     * @param {!Object} $node : A custom cloned node
     * @param {number} idx : index to start the loop
     * @return {number}
     */
    function indexOfCustomNode(set, $node, idx) {
        return indexOf(set, $node, idx, JSCompiler_renameProperty("node"));
    }

    //using a non id (eg outerHTML or nodeValue) is extremely naive and will run into issues with nodes that may appear the same like <li></li>
    var counter = 1; //don't use 0 as id (falsy)
    /** @const */
    var expando = "mo_id";

    /**
     * Attempt to uniquely id an element for hashing. We could optimize this for legacy browsers but it hopefully wont be called enough to be a concern
     *
     * @param {Node} $ele
     * @return {(string|number)}
     */
    function getElementId($ele) {
        try {
            return $ele.id || ($ele[expando] = $ele[expando] || counter++);
        } catch (o_O) { //ie <8 will throw if you set an unknown property on a text node
            try {
                return $ele.nodeValue; //naive
            } catch (shitie) { //when text node is removed: https://gist.github.com/megawac/8355978 :(
                return counter++;
            }
        }
    }

    /**
     * **map** Apply a mapping function to each item of a set
     * @param {Array|NodeList} set
     * @param {Function} iterator
     */
    function map(set, iterator) {
        var results = [];
        for (var index = 0; index < set.length; index++) {
            results[index] = iterator(set[index], index, set);
        }
        return results;
    }

    /**
     * **Reduce** builds up a single result from a list of values
     * @param {Array|NodeList|NamedNodeMap} set
     * @param {Function} iterator
     * @param {*} [memo] Initial value of the memo.
     */
    function reduce(set, iterator, memo) {
        for (var index = 0; index < set.length; index++) {
            memo = iterator(memo, set[index], index, set);
        }
        return memo;
    }

    /**
     * **indexOf** find index of item in collection.
     * @param {Array|NodeList} set
     * @param {Object} item
     * @param {number} idx
     * @param {string} [prop] Property on set item to compare to item
     */
    function indexOf(set, item, idx, prop) {
        for (/*idx = ~~idx*/; idx < set.length; idx++) {//start idx is always given as this is internal
            if ((prop ? set[idx][prop] : set[idx]) === item) return idx;
        }
        return -1;
    }

    /**
     * @param {Object} obj
     * @param {(string|number)} prop
     * @return {boolean}
     */
    function has(obj, prop) {
        return obj[prop] !== undefined; //will be nicely inlined by gcc
    }

    // GCC hack see http://stackoverflow.com/a/23202438/1517919
    function JSCompiler_renameProperty(a) {
        return a;
    }

    return MutationObserver;
})(void 0);

/*! domx - v0.14.2 - 2014-11-26
* http://esha.github.io/domx/
* Copyright (c) 2014 ESHA Research; Licensed MIT, GPL */

(function(D, X, _) {
    "use strict";

// core.js
_ = {
    slice: Array.prototype.slice,
    zero: function(){ return 0; },
    isList: function(o) {
        return (o && typeof o === "object" && 'length' in o && !o.nodeType) ||
               o instanceof NodeList ||// phantomjs foolishly calls these functions
               o instanceof HTMLCollection;
    },
    define: function(targets, name, value, force) {
        if (typeof name === "string") {
            for (var i=0,m=targets.length; i<m; i++) {
                _.defprop(targets[i].prototype || targets[i], name, value, force);
            }
        } else {
            for (var key in name) {// name is key/val object, value is force
                _.define(targets, key, name[key], value);
            }
        }
    },
    defprop: function(o, key, val, force) {
        if (force || !(key in o)) { try {// never redefine, never fail
            var opts = val.get || val.set ? val : {value:val, writable:true};
            opts.configurable = true;
            Object.defineProperty(o, key, opts);
        } catch (e) {} }
    },
    resolve: function(_key, _el, args, i) {
        var key = _key, el = _el;// copy prefixed originals so we can recover them if need be
        args = args.length ? _.fill(args, i, el) : null;
        if (key.indexOf('.') > 0) {
            var keys = key.split('.');
            while (keys.length > 1 && (el = el[key = keys.shift()])){}
            // if lookup failed, reset to originals
            el = el || _el;
            key = el ? keys[0] : _key;
        }
        var val = el[key];
        if (val !== undefined) {
            if (typeof val === "function" && val.apply) {
                return val.apply(el, args);
            }
            else if (args) { el[key] = args[0]; }
            else { return val; }
        }
        else if (_el.nodeType === 1) {
            if (args) {
                if (args[0] === null) {
                    _el.removeAttribute(_key);
                } else {
                    _el.setAttribute(_key, args[0]);
                }
            } else {
                return _el.getAttribute(_key);
            }
        }
    },
    fill: function(args, index, el) {
        var ret = [];
        for (var i=0,m=args.length; i<m; i++) {
            var arg = args[i],
                type = typeof arg;
            ret[i] = type === "string" ? arg.replace(/\$\{i\}/g, index) :
                     type === "function" ? arg(el, index, args) :
                     arg;
        }
        return ret;
    },
    alias: {}
};

// developer tools
X = {
    version: "0.14.2",
    _: _,

    // extension points
    alias: function(short, long) {
        if (typeof short === "object") {
            for (var s in short) {// short is actually a dict of aliases
                _.alias[s] = short[s]+'';
            }
        } else {
            _.alias[short] = long+'';// only strings allowed
        }
    },
    add: function(name, fn, nodes, force) {
        if (!Array.isArray(nodes)) {
            force = nodes;
            nodes = X.nodes;
        }
        _.define(nodes, name, fn, force);
        if (typeof fn === "function") {
            _.define(X.lists, name, function listFn() {
                var args = arguments;
                return this.each(function eachFn() {
                    return fn.apply(this, args);
                });
            }, force);
        }
    },

    // type lists (not completed until after X.List is defined)
    nodes: [Element, Text, Comment],
    parents: [Element, DocumentFragment, D]
};

// define X.List type
X.List = function XList(limit) {
    if (typeof limit === "number") {
        this.limit = limit;
        this.add(_.slice(arguments, 1));
    } else {
        this.add(arguments);
    }
};
_.define([X.List], {
    length: 0,
    limit: undefined,
    add: function(item) {
        var l = this.length;
        if (arguments.length > 1 || _.isList(item)) {
            var list = arguments.length > 1 ? arguments : item;
            for (var i=0,m=list.length; i<m; i++) {
                this.add(list[i]);
            }
        } else if (item !== null && item !== undefined && this.indexOf(item) < 0) {
            this[this.length++] = item;
            if (this.length === this.limit) {
                this.add = _.zero;
            }
        }
        return this.length - l;
    },
    isFull: function() {
        return this.add === _.zero;
    },
    indexOf: function(item) {
        for (var i=0; i<this.length; i++) {
            if (item === this[i]) {
                return i;
            }
        }
        return -1;
    }
});

// finish types now that X.List is defined
X.lists = [NodeList, HTMLCollection, X.List];
X.containers = X.parents.concat(X.lists);

// expose developer tools
_.defprop(D, 'x', X);

// define foundational features on Node and sets
_.define([Node].concat(X.lists), {
    each: function(fn) {
        var self = _.isList(this) ? this : [this],
            results = [],
            prop, args;
        if (typeof fn === "string") {
            prop = _.alias[fn] || fn;// e.g. D.x.alias('+class', 'classList.add');
            args = _.slice.call(arguments, 1);
            fn = function(el, i){ return _.resolve(prop, el, args, i); };
        }
        for (var i=0,m=self.length, result; i<m; i++) {
            result = fn.call(self[i], self[i], i, self);
            if (result || (prop && result !== undefined)) {
                results.push(result);
            }
        }
        return !results.length ? this : // no results, be fluent
            !_.isList(this) ? results[0] : // single source, single result
            results[0] && results[0].each ? new X.List(results) : // convert to DOMx (combines sub-lists)
            results;
    },
    toArray: function(arr) {
        arr = arr || [];
        if (_.isList(this)) {
            for (var i=0,m=this.length; i<m; i++) {
                arr.push(this[i]);
            }
        } else {
            arr.push(this);
        }
        return arr;
    }
});

// /core.js

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

// append.js
var A = _.append = {
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

X.add('append', function(arg, ref) {
    if (typeof arg === "string") {// turn arg into an appendable
        return A.create(this, arg, ref);
    }
    if (_.isList(arg)) {// list of append-ables
        var list = new X.List();
        for (var i=0,m=arg.length; i<m; i++) {
            list.add(this.append(arg[i], ref));
        }
        return list;
    }
    A.insert(this, arg, ref);// arg is an append-able
    return arg;
}, X.parents);

X.add('remove', function() {
    var parent = this.parentNode;
    if (parent) {
        parent.removeChild(this);
    }
});
// /append.js

var V = _.xValue = {
    /*jshint evil:true */
    resolve: function(context, reference) {
        return eval('context["'+reference+'"]');
    },
    name: function(node) {
        if (node.nodeType === 3 && !node.noSubNames) {
            node.splitOnName();// ensure this is run before node.name
        }
        return node.tagName === 'FORM' ? node.getAttribute('name') : node.name;
    },
    parse: function(value) {
        if (typeof value === "string") {
            try {
                value = JSON.parse(value);
            } catch (e) {}
        } else if (Array.isArray(value)) {
            value = value.map(V.parse);
        }
        return value;
    },
    string: function(value) {
        if (value !== undefined && typeof value !== "string") {
            try {
                value = JSON.stringify(value);
            } catch (e) {
                value = value+'';
            }
        }
        return value;
    },
    stringifyFor: function(el) {
        var stringify = el.getAttribute('xvalue-stringify');
        return stringify && V.resolve(window, stringify) || V.string;        
    },
    nameNodes: function(parent, nameFn, possibleParentFn, attrFn) {
        var done = [];
        for (var i=0; i<parent.childNodes.length; i++) {
            var node = parent.childNodes[i],
                name = V.name(node),
                nodeValue = null;
            if (name && done.indexOf(node) < 0) {
                done.push(node);
                nodeValue = nameFn(name, node);
            } else if (possibleParentFn && !node.useBaseValue()) {
                possibleParentFn(node);
            }
            if (node.useAttrValues) {
                for (var a=0; a < node.attributes.length; a++) {
                    attrFn(node.attributes[a], nodeValue);
                }
            }
        }
    },
    combine: function(oldValue, newValue, rejectNull) {
        if (oldValue === undefined || oldValue === newValue ||
            (rejectNull && oldValue === null)) {
            return newValue;
        }
        if (Array.isArray(oldValue)) {
            if (oldValue.indexOf(newValue) < 0) {
                oldValue.push(newValue);
            }
            return oldValue;
        }
        return [oldValue, newValue];
    },
    getNameValue: function(parent, value) {
        V.nameNodes(parent, function(name, node) {
            return value[name] = V.combine(value[name], node.nameValue);
        }, function(possibleParent) {
            V.getNameValue(possibleParent, value);
        }, function(attr, nodeValue) {
            var val = nodeValue || value;
            val[attr.name] = attr.baseValue;
        });
        return value;
    },
    setNameValue: function(parent, values) {
        V.nameNodes(parent, function(name, node) {
            var value = V.resolve(values, name);
            if (value !== undefined) {
                return node.nameValue = value;
            }
        }, function(possibleParent) {
            V.setNameValue(possibleParent, values);
        }, function(attr, node, elValues) {
            var value = V.resolve(elValues || values, attr.name);
            if (value !== undefined) {
                attr.baseValue = value;
            }
        });
    },
    booleanAttr: function(attr) {
        return {
            get: function() {
                return this.hasAttribute(attr);
            },
            set: function(value) {
                this[value ? 'setAttribute' : 'removeAttribute'](attr, true);
            }
        };
    },
    nameRE: /\$\{([^}]+)\}/,
    changeEvent: window.CustomEvent ? function(node) {
        node.dispatchEvent(new CustomEvent('change', { bubbles:true }));
    } : function(node) {
        var e = D.createEvent('CustomEvent');
        e.initCustomEvent('change', true);
        node.dispatchEvent(e);
    }
};

_.define([Node], {
    value: {
        get: function() {
            return this.hasAttribute && this.hasAttribute('value') ?
                this.getAttribute('value') :
                this.textContent;
        },
        set: function(value) {
            if (this.hasAttribute && this.hasAttribute('value')) {
                this.setAttribute('value', value);
            } else {
                this.textContent = value;
            }
        }
    },
    baseValue:  {
        get: function(){ return V.parse(this.value); },
        set: function(value) {
            var oldValue = this.value,
                newValue = this.value = V.string(value);
            if (oldValue !== newValue) {
                V.changeEvent(this);
            }
        }
    },
    useBaseValue: function() {
        var kids = !this.noSubNames && this.childNodes.length;
        return !kids || (kids === 1 && !!this.childNodes[0].useBaseValue());
    },
    nameParent: {
        get: function() {
            var node = this,
                parent;
            while ((parent = node.parentNode)) {
                if (V.name(parent)) {
                    return parent;
                }
                node = parent;
            }
            return node === this ? null : node;
        }
    },
    nameGroup: {
        get: function() {
            var el = this,
                name = V.name(el);
            return name ? el.parentNode ?
                el.nameParent.queryNameAll(name) :
                new X.List(el) :
                null;
        }
    },
    nameValue: {
        get: function() {
            var values;
            if (V.name(this)) {
                this.nameGroup.each(function(node) {
                    values = V.combine(values, node.xValue);
                });
            }
            return values || this.xValue;
        },
        set: function(values) {
            if (V.name(this) && Array.isArray(values)) {
                var group = this.nameGroup;
                if (_.repeat && !values.length && group.length && !group[0].hasAttribute(_.repeat.id)) {
                    _.repeat.init(group[0], true);
                }
                group.each(function(node, i) {
                    if (i < values.length) {
                        node.nameValue = values[i];
                    } else {
                        node.remove();
                    }
                });
                while (group.length < values.length) {
                    var last = group[group.length - 1];
                    group.add(last.repeat(values[group.length]));
                }
            } else {
                this.xValue = values;
            }
        }
    },
    xValue: {
        get: function() {
            return this.useBaseValue() ? this.baseValue : V.getNameValue(this, {});
        },
        set: function(value) {
            if (this.useBaseValue() || typeof value !== "object") {
                this.baseValue = value;
            } else {
                V.setNameValue(this, value);
            }
        }
    }
});
_.define([Attr], {
    useBaseValue: function(){ return true; },
}, true);

_.define([Element], {
    name: {
        get: function(){ return this.getAttribute('name'); },
        set: function(name){ this.setAttribute('name', name); }
    },
    baseProperty: 'value',
    baseValue: {
        get: function() {
            var parser = this.getAttribute('xvalue-parse');
            parser = parser && V.resolve(window, parser) || V.parse;
            return parser.call(this, this[this.baseProperty]);
        },
        set: function(value) {
            var oldValue = this[this.baseProperty],
                newValue = this[this.baseProperty] = V.stringifyFor(this).call(this, value);
            if (oldValue !== newValue) {
                V.changeEvent(this);
            }
        }
    },
    useAttrValues: V.booleanAttr('xvalue-attr'),
    noSubNames: V.booleanAttr('xvalue-none')
}, true);

_.define(X.containers, {
    queryName: function(name) {
        return this.queryNameAll(name, 1)[0];
    },
    queryNameAll: function(name, count, _list) {
        _list = _list || new X.List(count);
        var parents = _.isList(this) ? this : [this];
        for (var s=0; s < parents.length && !_list.isFull(); s++) {
            var parent = parents[s];
            for (var i=0; i < parent.childNodes.length && !_list.isFull(); i++) {
                var node = parent.childNodes[i],
                    nodeName = V.name(node);
                if (nodeName === name && node.tagName !== 'X-REPEAT') {
                    _list.add(node);
                } else if (node.nodeType === 1) {
                    if (nodeName) {
                        if (name.indexOf(nodeName+'.') === 0) {
                            node.queryNameAll(name.substring(nodeName.length+1), count, _list);
                        }
                    } else {
                        node.queryNameAll(name, count, _list);
                    }
                }
            }
            if (parent.useAttrValues && !_list.isFull()) {
                var el = this;
                for (var a=0; a < el.attributes.length; a++) {
                    var attr = el.attributes[a];
                    if (attr.name === name) {
                        attr.parentNode = el;
                        _list.add(attr);
                        break;
                    }
                }
            }
        }
        return _list;
    }
});

_.define([Text], {
    useBaseValue: function() {
        return this.noSubNames || !this.splitOnName();
    },
    splitOnName: function() {
        var text = this,
            match = text.textContent.match(V.nameRE);
        if (match) {
            var start = match.index,
                name = match[0];
            if (start > 0) {
                text.splitText(start);
                text.noSubNames = true;
                text = text.nextSibling;
            }
            if (text.textContent.length > name.length) {
                text.splitText(name.length);
            }
            text.name = match[1];
            text.textContent = '';
        }
        // all have no sub names after splitting
        text.noSubNames = true;
        return !!match;
    }
}, true);

_.define([HTMLInputElement], {
    xValue:  {
        get: function() {
            var input = this;
            return (input.type !== 'radio' && input.type !== 'checkbox') || input.checked ?
                input.baseValue :
                null;
        },
        set: function(value) {
            var input = this;
            if (input.type === 'checkbox' || input.type === 'radio') {
                value = (Array.isArray(value) ? value : [value]).map(V.stringifyFor(this));
                var was = input.checked;
                input.checked = value.indexOf(input.value) >= 0;
                if (was !== input.checked) {
                    V.changeEvent(input);
                }
            } else {
                this.baseValue = value;
            }
        }
    },
    nameValue: {
        get: function() {
            var type = this.type;
            if (type === 'radio' || type === 'checkbox') {
                var group = this.nameGroup,
                    value;
                group.each(function(node) {
                    value = V.combine(value, node.xValue, true);
                });
                return Array.isArray(value) && (this.type === 'radio' || group.length === 1) ?
                    value[0] :
                    value;
            }
            return this.baseValue;
        },
        set: function(value) {
            if (this.type === 'checkbox' || this.type === 'radio') {
                value = (Array.isArray(value) ? value : [value]).map(V.stringifyFor(this));
                var changed = false;
                this.nameGroup.each(function(input) {
                    var was = input.checked;
                    input.checked = value.indexOf(input.value) >= 0;
                    if (was !== input.checked) {
                        changed = true;
                    }
                });
                if (changed) {
                    V.changeEvent(this);
                }
            } else {
                this.baseValue = value;
            }
        }
    }
}, true);

_.define([HTMLSelectElement], {
    xValue: {
        get: function() {
            if (this.multiple) {
                var selected = this.children.only('selected', true);
                return selected.length ? selected.each('xValue') :
                    this.children.length > 1 ? [] : null;
            }
            return V.parse(this.baseValue);
        },
        set: function(value) {
            if (this.multiple) {
                value = (Array.isArray(value) ? value : [value]).map(V.string);
                var changed = false;
                this.children.each(function(option) {
                    var was = option.selected;
                    option.selected = value.indexOf(option.value) >= 0;
                    if (option.select !== was) {
                        changed = true;
                    }
                });
                if (changed) {
                    V.changeEvent(this);
                }
            } else {
                this.baseValue = value;
            }
        }
    }
}, true);

_.define([HTMLLIElement], {
    baseProperty: {
        get: function() {
            // ordered ones use relative index, unordered ones use text
            return this.parentNode instanceof HTMLOListElement ?
                'value' :
                'textContent';
        } 
    }
}, true);

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

// emmet.js
var AE = _.append;
AE.create = function(node, code, ref) {
    var parts = code.split(AE.emmetRE()),
        root = D.createDocumentFragment(),
        el = D.createElement(parts[0]);
    root.appendChild(el);
    for (var i=1,m=parts.length; i<m; i++) {
        var part = parts[i];
        el = AE.emmet[part.charAt(0)].call(el, part.substr(1), root) || el;
    }
    AE.insert(node, root, ref);
    return el;
};
AE.emmetRE = function() {
    var chars = '\\'+Object.keys(AE.emmet).join('|\\');
    return new RegExp('(?='+chars+')','g');
};
AE.emmet = {
    '#': function(id) {
        this.id = id;
    },
    '.': function(cls) {
        var list = this.getAttribute('class') || '';
        list = list + (list ? ' ' : '') + cls;
        this.setAttribute('class', list);
    },
    '[': function(attrs) {
        attrs = attrs.substr(0, attrs.length-1).match(/(?:[^\s"]+|"[^"]*")+/g);
        for (var i=0,m=attrs.length; i<m; i++) {
            var attr = attrs[i].split('=');
            this.setAttribute(attr[0], (attr[1] || '').replace(/"/g, ''));
        }
    },
    '>': function(tag) {
        if (tag) {
            var el = D.createElement(tag);
            this.appendChild(el);
            return el;
        }
        return this;
    },
    '+': function(tag, root) {
        return AE.emmet['>'].call(this.parentNode || root, tag);
    },
    '*': function(count) {
        var parent = this.parentNode,
            els = new X.List(this);
        for (var i=1; i<count; i++) {
            els.add(this.cloneNode(true));
            parent.appendChild(els[i]);
        }
        //TODO: numbering for els
        return els;
    },
    '^': function(tag, root) {
        return AE.emmet['+'].call(this.parentNode || root, tag, root);
    },
    '{': function(text) {
        this.appendChild(D.createTextNode(text.substr(0, text.length-1)));
    }
};
// /emmet.js

// dot.js
_.defprop(D, 'html', D.documentElement);
var dot = _.dot = {
    names: { 3: '$text', 8: '$comment', 7: '$procins' },
    fns: {},
    fn: function(type, name) {
        return dot.fns[name] || (dot.fns[name] =
            type === 1 ?
                function elements() {
                    return this.each('children').only(name).dot();
                } :
                function nodes() {
                    return this.each('childNodes').only('nodeType', type);
                }
        );
    },
    init: function() {
        D.queryAll('[x-dot]').each(function(el) {
            el.dot(true);
            if (Observer && !el._observer) {
                (el._observer = new Observer(function(changes) {
                    for (var i=0,m=changes.length; i<m; i++) {
                        changes[i].target.dot(true);
                    }
                })).observe(el, { childList: true, subtree: true });
            }
        });
    }
},
Observer = window.MutationObserver;

_.define(X.containers, 'dot', function(force) {
    var self = this;
    if (force || !self._dotted) {
        self.each('childNodes').each(function(node) {
            var type = node.nodeType,
                name = dot.names[type] || node.tagName.toLowerCase();
            if (!(name in self)) {
                _.defprop(self, name, { get: dot.fn(type, name) });
            }
            if (type === 1) {
                node.dot();
            }
        });
        _.defprop(self, '_dotted', true);
    }
    return self;
});

dot.init();// early availability
D.addEventListener('DOMContentLoaded', dot.init);// eventual consistency
// /dot.js

})(document);

/*! domx-stringify - v1.0.0 - 2014-11-26
* http://esha.github.io/domx-stringify/
* Copyright (c) 2014 ESHA Research; Licensed MIT, GPL */

(function(D) {
    "use strict";

    // shortcuts
    var X = D.x,
        _ = X._;

var S = _.stringify = {
    version: "1.0.0",
    map: Array.prototype.map,
    specialPrefix: '_',
    markup: {
        '\n': '<br>',
        '<': '<span class="markup">&lt;</span>',
        '>': '<span class="markup">&gt;</span>',
        '</': '<span class="markup">&lt;/</span>',
        '\t': '&nbsp;&nbsp;&nbsp;&nbsp;'
    },
    plain: {
        '\n': '\n',
        '<': '<',
        '>': '>',
        '</': '</',
        '/>': '/>',
        '\t': '    '
    },
    type: {
        attr: 'attr',
        string: 'string',
        tag: 'tag',
    },
    print: function(el, markup, indent) {
        var tag = el.tagName.toLowerCase(),
            code = markup ? S.markup : S.plain,
            line = S.isInline(el) ? '' : code['\n'],
            content = S.content(el, markup, indent+code['\t'], line),
            attrs = S.attrs(el, markup),
            special = markup ? S.special(el) : [];

        if (markup) {
            tag = S.mark(tag, S.type.tag);
        }
        var open = S.mark(code['<'] + tag + (attrs ? ' '+attrs : '') + code['>'], special),
            close = S.mark(code['</'] + tag + code['>'], special);
        if (content && line) {
            content = line + content + line + indent;
        }
        return indent + open + content + close;
    },
    isInline: function(el) {
        return (el.currentStyle || window.getComputedStyle(el,'')).display === 'inline' ||
            el.tagName.match(/^(H\d|LI)$/i);
    },
    content: function(el, markup, indent, line) {
        var s = [];
        for (var i=0, m= el.childNodes.length; i<m; i++) {
            var node = el.childNodes[i];
            if (node.tagName) {
                s.push(S.print(node, markup, line ? indent : ''));
            } else if (node.nodeType === 3) {
                var text = node.textContent.replace(/^\s+|\s+$/g, ' ');
                if (text.match(/[^\s]/)) {
                    s.push(text);
                }
            }
        }
        return s.join(line);
    },
    attrs: function(el, markup) {
        return S.map.call(el.attributes, function(attr) {
            var name = attr.name,
                value = attr.value;
            if (!markup || name.indexOf(S.specialPrefix) !== 0) {
                return markup ? S.mark(name+(value?'=':''), S.type.attr) + (value ? S.mark('"'+value+'"', S.type.string) : '')
                              : name+(value ? '="'+value+'"' : '');
            }
        }).filter(S.notEmpty).join(' ');
    },
    special: function(el) {
        return S.map.call(el.attributes, function(attr) {
            var name = attr.name;
            if (name.indexOf(S.specialPrefix) === 0) {
                return name.substr(1)+'="'+attr.value+'"';
            }
        }).filter(S.notEmpty);
    },
    mark: function(value, attrs) {
        if (attrs.length) {
            if (typeof attrs === "string"){ attrs = ['class="'+attrs+'"']; }
            return '<span '+attrs.join(' ')+'>'+value+'</span>';
        }
        return value;
    },
    notEmpty: function(s) {
        return s !== undefined && s !== null && s !== '';
    }
};
X.add('stringify', function(markup, indent) {
    return S.print(this, markup||false, indent||'');
});


})(document);

/*! demo-x - v0.1.6 - 2014-12-04
* http://esha.github.io/demo-x/
* Copyright (c) 2014 ESHA Research; Licensed MIT */

(function(window, D) {
    "use strict";

var DemoXProto,
    DemoX;
if (D.registerElement) {
    DemoXProto = Object.create(HTMLElement.prototype);
    DemoX = {};
    // wait to register until all is ready
} else {
    DemoXProto = {};
    DemoX = window.DemoX = function DemoX(el) {
        if (!el.createdCallback) {
            for (var prop in DemoXProto) {
                Object.defineProperty(el, prop,
                    Object.getOwnPropertyDescriptor(DemoXProto, prop));
            }
            el.createdCallback();
        }
    };
    DemoX.prototype = DemoXProto;
    DemoX.load = function() {
        D.queryAll('demo-x').each(DemoX);
    };
    DemoX.load();// early availability
    D.addEventListener('DOMContentLoaded', DemoX.load);// eventual consistency
}


DemoXProto.timing = {
    intent: 1000,
    backspace: 25,
    comment: 10,
    code: 50,
    tick: 250,
    minTicks: 8
};

DemoXProto.createdCallback = function() {
    var self = this;
    self.display = self.query('demo-dom');
    self.input = self.query('demo-in');
    self.output = self.query('demo-out');

    self.intent(self.input);
    self._exec = function() {
        self.execute();
    };

    self.input.setAttribute('style', 'white-space: pre;');
    if (self.input.children.length) {
        self.initStory();
    }
    if (self.display) {
        self.doc = DemoX.docify(self.display.children);
        for (var i=0; i<self.display.attributes.length; i++) {
            var attr = self.display.attributes[i];
            self.doc.body.setAttribute(attr.name, attr.value);
        }
        self.initDisplay();
    } else {
        // a document w/no body content
        self.doc = DemoX.docify(new DOMxList());
    }
    self.initControls();
};

DemoXProto.initDisplay = function() {
    var self = this;
    function update() {
        self.display.innerHTML = self.doc.body.stringify(true);
    }
    update();
    self._observer = new MutationObserver(update)
        .observe(self.doc.html, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
};

DemoXProto.initStory = function() {
    var self = this;
    self._next = function(){ self.next(); };
    self.story = self.input.children.each('textContent');
    self.input.innerHTML = '';
    this._tick = function() {
        if (self.index){ self.execute(); }
        setTimeout(self._next, self.calcPause());
    };
    this._tick();
};

DemoXProto.initControls = function() {
    var self = this,
        stop = self.query('[stop]'),
        start = self.query('[start]');
    self._stop = function() {
        self.stopped = true;
        self.classList.add('stopped');
    };
    self._start = function() {
        self.classList.remove('stopped');
        if (!(self.index in self.story)) {
            self.index = 0;
        }
        self.stopped = false;
        self.next();
    };
    self.input.addEventListener('keydown', self._stop);
    if (stop) {
        stop.addEventListener('click', self._stop);
    }
    if (start) {
        start.addEventListener('click', self._start);
    }
};

DemoXProto.next = function() {
    var self = this,
        code = self.story[self.index];
    if (code && !self.stopped) {
        var input = self.input;
        self.animate(self.input.value, code, function(s){ input.value = s; }, self._tick);
        self.index++;
    } else if (!code) {
        self._stop();
    }
};

DemoXProto.calcPause = function() {
    // base pause of current line, not next line
    var code = this.story[this.index-1] || '';
    // first line and comments go instantly
    return !code || (code.indexOf('//') === 0 && code.indexOf('\n') < 0) ? 0 :
        // others default to 250ms per symbol, with a minimum of 2s
        Math.max(code.replace(/\w|\s/g, '').length, this.timing.minTicks) * this.timing.tick;
};

DemoXProto.intent = function(el) {
    var timeout, self = this;
    el.addEventListener("keydown", function() {
        if (timeout){ clearTimeout(timeout); }
        timeout = setTimeout(self._exec, self.timing.intent);
    });
};

DemoXProto.execute = function() {
    /*jshint unused:false */
    var document = this.doc,
        code = this.input.value,
        result;
    if (code) {
        try {
            result = eval(code);
            DemoX.flash(result);
        } catch (e) {
            e.code = code;
            result = e;
        }
        if (this.output) {
            var log = this.output.innerHTML;
            this.output.innerHTML = '<p class="line">'+
                DemoX.describe(result)+'</p>' + log;
            if (result instanceof Error) {
                console.error(result);
            }
        } else {
            console.log(code);
            console.log(result);
        }
    }
};

DemoXProto.animate = function(text, next, update, finish) {
    var i = text.length, self = this, action = 'code';
    (function _step() {
        if (!self.stopped) {
            if (next.indexOf(text) < 0) {
                action = 'backspace';
                text = text.substr(0, --i);
            } else if (i < next.length) {
                action = 'code';
                text = next.substr(0, ++i);
            } else {
                return finish();
            }
            if (text.indexOf('\n') < text.indexOf('//') ||
                text.indexOf('*/') < text.indexOf('/*')) {
                action = 'comment';
            }
            update(text);
            setTimeout(_step, self.timing[action]);
        }
    })();
};

DemoXProto.index = 0;


DemoX.docify = function(dom) {
    var d = D.createDocumentFragment();
    d.html = d.documentElement = D.createElement('html');
    d.appendChild(d.html);
    d.html.appendChild(d.body = D.createElement('body'));
    dom.each(function(el) {
        el.remove();
        d.body.append(el);
    });
    d.html.dot();
    try {
        delete d.parentNode;
        d.parentNode = window;
    } catch (e) {}
    return d;
};

DemoX.describe = function(el) {
    if (D.x._.isList(el) && el.each) {
        return el.each(DemoX.describe).join(', ');
    }
    if (el instanceof HTMLElement) {
        var id = el.getAttribute('id'),
            classes = el.getAttribute('class');
        return '&lt;'+
            el.tagName.toLowerCase()+
            (id ? '#'+id : '')+
            (classes ? '.'+classes.split(' ').join('.') : '')+
        '&gt;';
    }
    if (el instanceof Node) {
        return el.value;
    }
    if (typeof el === "object") {
        if (el instanceof Error) {
            return 'Error: "'+el.message + (el.code ? '" from "'+el.code : '') + '"';
        }
        return JSON.stringify(el);
    }
    return el && el.value || (el+'');
};

// this all hitches on css animations and domx-stringify's _attr support
DemoX.highlight = function(el) {
    if (el.setAttribute) {
        el.setAttribute('_highlight', 'true');
    }
};
DemoX.unhighlight = function(el) {
    if (el.removeAttribute) {
        el.removeAttribute('_highlight');
    }
};
var flashTimeout;
DemoX.flash = function(el) {
    if (el && el.each) {
        if (flashTimeout){ clearTimeout(flashTimeout); }
        flashTimeout = setTimeout(function() {
            el.each(DemoX.highlight);
            setTimeout(function() {
                el.each(DemoX.unhighlight);
            }, 1000);
        }, DemoX.flash.time || 100);
    }
};

// register only after everything is ready
if (D.registerElement) {
    var utils = DemoX;
    DemoX = window.DemoX = D.registerElement('demo-x', {
        prototype: DemoXProto
    });
    for (var prop in utils) {
        DemoX[prop] = utils[prop];
    }
}


})(window, document);

/*! Eventi - v1.3.6 - 2014-10-21
* https://github.com/esha/Eventi
* Copyright (c) 2014 ESHA Research; Licensed MIT */

(function(global, document) {
    "use strict";

    try {
        new CustomEvent('test');
    } catch (err) {
        // polyfill CustomEvent constructor
        global.CustomEvent = function CustomEvent(type, args) {
            args = args || {};
            var e = document.createEvent('CustomEvent');
            e.initCustomEvent(type, !!args.bubbles, !!args.cancelable, args.detail);
            return e;
        };
    }

function Eventi(text){
    if (typeof text === "string") {
        return _.create.apply(_, arguments);
    }
    return Eventi.fy(this);
}
Eventi.toString = Eventi.prototype.toString = function(){ return 'Eventi, v'+_.version; };
Eventi.fy = function fy(o) {
    for (var p in _.fns) {
        Object.defineProperty(o, p, {value:Eventi[p], writable:true, configurable:true});
    }
    return o;
};

var _ = Eventi._ = {
    version: "1.3.6",
    global: new Function('return this')(),
    noop: function(){},
    slice: function(a, i){ return Array.prototype.slice.call(a, i); },
    copy: function(a, b, p) {
        if (typeof a === "object"){ for (p in a){ if (a.hasOwnProperty(p)){ b[p] = a[p]; }}}
    },
    async: (global.setImmediate && setImmediate.bind(global)) ||
           function async(fn){ return setTimeout(fn, 0); },
    resolveRE: /^([\w\$]+)?((\.[\w\$]+)|\[(\d+|'(\\'|[^'])+'|"(\\"|[^"])+")\])*$/,
    resolve: function(reference, context, tested) {
        if (tested || _.resolveRE.test(reference)) {
            context = context || global;
            try {
                return eval('context'+(reference.charAt(0) !== '[' ? '.'+reference : reference));
            } catch (e) {}
        }
    },

    create: function(type, copyThese) {
        var props = { text: type+'' };
        type = _.parse(props.text, props, props);
        _.copy(copyThese, props);
        if (!('bubbles' in props)) {
            props.bubbles = true;// we bubble by default around here
        }

        var event = new CustomEvent(type, props);
        for (var prop in props) {
            if (_.skip.indexOf(prop) < 0) {
                event[_.prop(prop)] = props[prop];
            }
        }
        return event;
    },
    skip: 'bubbles cancelable detail type'.split(' '),
    prop: function(prop){ return prop; },// only an extension hook
    parse: function(type, event, handler) {
        _.parsers.forEach(function(parser) {
            type = type.replace(parser[0], function() {
                var args = _.slice(arguments, 1);
                args.unshift(event, handler);
                return parser[1].apply(event, args) || '';
            });
        });
        return type ? event.type = type : type;
    },
    parsers: [
        [/^(\W*)_/, function(event, handler, other) {
            event.bubbles = false;
            return other;
        }],
        [/\((.*)\)/, function(event, handler, val) {
            try {
                event.detail = _.resolve(val) || JSON.parse(val);
            } catch (e) {
                event.detail = val;
            }
        }],
        [/#(\w+)/g, function(event, handler, tag) {
            (event.tags||(event.tags=[])).push(tag);
            event[tag] = true;
        }],
        [/^(\w+):/, function(event, handler, cat) {//
            event.category = cat;
        }]
    ],

    fn: function(name, dataIndex) {
        Eventi[name] = _.fns[name] = function wrapper(target) {
            var args = _.slice(arguments);
            if (!target || typeof target === "string" || target instanceof Event) {// ensure target
                args.unshift(target = !this || this === Eventi ? _.global : this);
            }
            if (args.length > dataIndex) {// gather ...data the old way
                args[dataIndex] = args.slice(dataIndex);
                args = args.slice(0, dataIndex+1);
            }
            if (!args[1] || typeof args[1] === "string") {
                args[1] = _.split.ter(args[1]);
            }
            var fn = _[name], ret;
            if (!target.nodeType && target !== _.global && 'length' in target) {// apply to each target
                for (var i=0,m=target.length; i<m; i++) {
                    ret = fn.apply(args[0] = target[i], args);
                }
            } else {
                ret = fn.apply(target, args);
            }
            return ret === undefined ? this : ret;// be fluent
        };
    },
    fns: {},
    split: {
        guard: { '(':')' },
        ter: function(texts, delims) {
            var parts = [],
                text = '',
                guard;
            if (texts) {
                delims = _.slice(arguments, 1);
                delims.unshift(' ');
                for (var i=0,m=texts.length; i<m; i++) {
                    var c = texts.charAt(i);
                    if (!guard && delims.indexOf(c) >= 0) {
                        if (text) {
                            parts.push(text);
                        }
                        text = '';
                    } else {
                        text += c;
                        if (guard) {
                            if (guard === c) {
                                if (text.charAt(text.length-2) === '\\') {
                                    text = text.replace("\\"+c, c);
                                } else {
                                    guard = null;
                                }
                            }
                        } else {
                            guard = _.split.guard[c];
                        }
                    }
                }
                if (text) {
                    parts.push(text);
                }
            } else {
                parts.push('');
            }
            return parts;
        }
    }
};

_.parsers.unshift([/^(\W*)\//, function(event, handler, other) {
    handler.global = true;
    return other;
}]);
_.fire = function(target, events, data) {
    if (events instanceof Event) {
        events.data = data;
        _.dispatch(target, events);
        return events;
    }
    return _.fireAll(target, events, {data:data});
};
_.fireAll = function(target, events, props) {
    var event;
    for (var i=0; i<events.length; i++) {
        event = _.create(events[i], props);
        _.dispatch(target, event);
    }
    return event;
};
_.dispatch = function(target, event, objectBubbling) {
    if (event.global){ target = _.global; }
    (target.dispatchEvent || target[_key] || _.noop).call(target, event);
    if (target.parentObject && event.bubbles && !event.propagationStopped) {
        _.dispatch(target.parentObject, event, true);
    }
    // icky test/call, but lighter than wrapping or firing internal event
    if (!objectBubbling && event.singleton) {
        _.singleton(target, event);
    }
};
_.fn('fire', 2);
_.parsers.unshift([/^(\W*)\!/, function(e, handler, other) {//
    handler.important = true;
    return other;
}]);
_.on = function(target, events, fn, data) {
    if (target !== _.global && events.length === 1 && events[0] === '') {
        events = target; target = _.global;
    }
    if (!Array.isArray(events)) {
        if (fn !== undefined) {
            data = data ? data.unshift(fn) && data : [fn];
        }
        for (var event in events) {
            _.handler(target, event, events[event], data);
        }
    } else {
        for (var i=0,m=events.length; i<m; i++) {
            _.handler(target, events[i], fn, data);
        }
    }
};
_.handler = function(target, text, fn, data) {
    var handler = { target:target, fn:fn, data:data, text:text, event:{} };
    _.parse(text, handler.event, handler);
    delete handler.event.tags;// superfluous for handlers
    if (target !== _) {// ignore internal events
        Eventi.fire(_, 'on:handler', handler);
    }
    // allow on:handler listeners to change these things
    if (handler.fn !== _.noop) {
        target = handler.global === true ? _.global : handler.target;
        _.handlers(target, handler.event.type).push(handler);
    }
    return handler;
};
_.handlers = function(target, type) {
    var listener = _.listener(target),
        handlers = listener.s[type];
    if (!handlers) {
        handlers = listener.s[type] = [];
        if (target.addEventListener) {
            target.addEventListener(type, listener, _.capture.indexOf(type) >= 0);
        }
    }
    return handlers;
};
_.capture = ['focus','blur'];

var _key = _._key = '_eventi'+Date.now();
_.listener = function(target) {
    var listener = target[_key];
    if (!listener) {
        listener = function(event) {
            var handlers = listener.s[event.type];
            if (handlers){ _.handle(event, handlers); }
        };
        listener.s = {};
        Object.defineProperty(target, _key, {
            value:listener, writeable:false, configurable:true
        });
    }
    return listener;
};
_.handle = function(event, handlers) {
    for (var i=0, handler; i<handlers.length; i++) {
        if (_.matches(event, (handler = handlers[i]).event)) {
            _.execute(event, handler);
            if (event.immediatePropagationStopped){ break; }
        }
    }
};
_.execute = function(event, handler) {
    var args = [event],
        fn = handler.fn,
        call = { target: handler.target, args:args };
    if (event.data){ args.push.apply(args, event.data); }
    if (handler.data){ args.push.apply(args, handler.data); }
    if (handler.filters) {
        for (var i=0,m=handler.filters.length; i<m && call.target; i++) {
            handler.filters[i].call(call, event, handler);
        }
    }
    if (call.target) {
        try {
            fn.apply(call.target, call.args);
        } catch (e) {
            _.async(function(){ throw e; });
        }
        if (handler.end && handler.end.apply(call.target, call.args)) {
            _.unhandle(handler);
        }
    }
};
_.filter = function(handler, fn) {
    handler.filters = handler.filters || [];
    handler.filters.push(fn);
};
_.unhandle = function noop(handler){ handler.fn = _.noop; };
_.matches = function(event, match) {
    for (var key in match) {
        if (match[key] !== event[key]) {
            return false;
        }
    }
    return true;
};
_.fn('on', 3);

_.split.guard['<'] = '>';
_.parsers.unshift([/<(.+)>/, function(event, handler, selector) {
    handler.selector = selector;
    if (_.delegate && event !== handler) {
        _.filter(handler, _.delegate);
    }
}]);
if (global.Element) {
    _.delegate = function delegate(event, handler) {
        this.target = _.closest(event.target, handler.selector);
    };
    _.closest = function(el, selector) {
        while (el && el.matches) {
            if (el.matches(selector)) {
                return el;
            }
            el = el.parentNode;
        }
    };

    var Ep = Element.prototype,
        aS = 'atchesSelector';
    if (!Ep['matches']) {
        Object.defineProperty(Ep, 'matches', {value:Ep['webkitM'+aS]||Ep['mozM'+aS]||Ep['msM'+aS]});
    }
}   

_.parsers.unshift([/=>(\w+)$/, function(event, handler, alias) {
    handler.alias = alias;
    if (handler !== event) {
        handler.data = handler.data || [];
        handler.data.push(alias);
    }
}]);
_.alias = function(alias, text, context) {
	return function aliased(target) {
		var args = _.slice(arguments),
			index = (typeof target !== "object" || !(target.dispatchEvent || target[_key])) ? 0 : 1;
		args.splice(index, 0, text);
		return this.apply(context, args);
	};
};
Eventi.alias = function(context, text) {
	if (typeof context === "string") {
		text = context; context = Eventi;
	}
	var texts = _.split.ter(text),
		props;
	for (var prop in _.fns) {
		for (var i=0,m=texts.length; i<m; i++) {
			props = {};
			_.parse(texts[i], props, props);
			props.alias = props.alias || props.type;
			context[prop][props.alias] = _.alias(props.alias, texts[i], context);
		}
	}
	return props;
};
if (document) {
    _.init = function init() {
        var nodes = document.querySelectorAll('[eventi],[data-eventi]');
        for (var i=0,m=nodes.length; i<m; i++) {
            var target = nodes[i],
                mapping = target.getAttribute('data-eventi') ||
                          target.getAttribute('eventi');
            if (mapping !== target.eventi) {
                if (_.off && target.eventi) {
                    Eventi.off(target, target.eventi, _.declared);
                }
                target.eventi = mapping;
                _.declare(target, mapping);
            }
        }
        if (nodes.length || document.querySelector('[click],[data-click]')) {
            Eventi.on('click keyup', _.check);
        }
    };
    _.declare = function(target, mapping) {// register listener
        var texts = _.split.ter(mapping);
        for (var i=0,m=texts.length; i<m; i++) {
            Eventi.on(target, texts[i], _.declared);
        }
    };
    _.declared = function(e, alias) {// lookup handlers
        alias = typeof alias === "string" ? alias : e.type;
        var nodes = _.declarers(this, alias, e.target);
        for (var i=0,m=nodes.length; i<m; i++) {
            _.respond(nodes[i], alias, e);
        }
    };
    _.declarers = function(node, alias, target) {
        var query = '['+alias+'],[data-'+alias+']',
            // gather matching targets up to and including the listening node
            nodes = [],
            descendant = false;
        while (target && target.matches) {
            if (target.matches(query)) {
                nodes.push(target);
            }
            if (target === node) {
                descendant = true;
                break;
            }
            target = target.parentNode;
        }
        // if target isn't a descendant of node, handler must be global
        return descendant ? nodes : node.querySelectorAll(query);
    };
    _.respond = function(node, alias, e) {// execute handler
        var response = node.getAttribute('data-'+alias)||node.getAttribute(alias)||alias;
        if (response) {
            var fn = _.resolve(response, node) || _.resolve(response);
            if (typeof fn === "function") {
                fn.call(node, e);
            } else {
                Eventi.fire(node, response, e);
            }
        }
    };
    _.check = function(e) {
        var click = e.target.getAttribute &&
                    ((e.type === 'click' && _.click(e.target)) ||
                     (e.keyCode === 13 && _.click(e.target, true)));
        if (click) {
            _.declared.call(document.documentElement, e, 'click');
            if (click === 'noDefault' && !_.allowDefault(e.target)) {
                e.preventDefault();
            }
        }
    };
    _.allowDefault = function(el) {
        return el.type === 'radio' || el.type === 'checkbox';
    };
    _.click = function(el, enter) {
        // click attributes with non-false value override everything for clicks, but not enters
        var click = el.getAttribute('click');
        if (!enter && click && click !== "false") {
            return 'noDefault';
        }
        // editables, select, textarea, non-button inputs all use click to alter focus w/o action
        // textarea and editables use enter to add a new line w/o action
        // a[href], buttons, button inputs all automatically dispatch 'click' on enter
        // in all three situations, dev must declare on element, not on parent to avoid insanity
        if (!el.isContentEditable) {
            var name = el.nodeName.toLowerCase();
            return name !== 'textarea' &&
                   (name !== 'select' || enter) &&
                   (enter ? (name !== 'a' || !el.getAttribute('href')) &&
                            name !== 'button' &&
                            (name !== 'input' || !_.buttonRE.test(el.type))
                          : name !== 'input' || _.buttonRE.test(el.type));
        }
    };
    _.buttonRE = /^(submit|button|reset)$/;

    Eventi.on('DOMContentLoaded', _.init);
}

_.split.guard['['] = ']';
_.parsers.push([/\[([^ ]+)\]/, function(event, handler, key) {//'
    var dash;
    while ((dash = key.indexOf('-')) > 0) {
        event[key.substring(0, dash)+'Key'] = true;
        key = key.substring(dash+1);
    }
    if (key) {
        event.keyCode = _.codes[key] || parseInt(key, 10) || key;
    }
}]);
_.codes = {
    backspace:8, tab:9, enter:13, shift:16, ctrl:17, alt:18, capsLock:20, escape:27, start:91, command:224,
    pageUp:33, pageDown:34, end:35, home:36, left:37, up:38, right:39, down:40, insert:45, 'delete':46,
    multiply:106, plus:107, minus:109, point:110, divide:111, numLock:144,// numpad controls
    ';':186, '=':187, ',':188, '-':189, '.':190, '/':191, '`':192, '[':219, '\\':220, ']':221, '\'':222, space:32// symbols
};
for (var n=0; n<10; n++){ _.codes['num'+n] = 96+n; }// numpad numbers
for (var f=1; f<13; f++){ _.codes['f'+f] = 111+f; }// function keys
'abcdefghijklmnopqrstuvwxyz 0123456789'.split('').forEach(function(c) {
    _.codes[c] = c.toUpperCase().charCodeAt(0);// ascii keyboard
});
Eventi.on(_, 'on:handler', function(e, handler) {
    if (handler.event.keyCode && !handler.event.type) {
        handler.event.type = 'keyup';
    }
});
_.split.guard['@'] = '@';
_.parsers.unshift([/@([^@]+)(@|$)/, function(event, handler, uri) {
    handler.location = uri;
    if (_.location && event !== handler) {
        _.locationHandler(uri, handler);
    }
}]);
if (global.history && global.location) {
    var intercept = function(name) {
        _[name] = history[name];
        history[name] = function() {
            var ret = _[name].apply(this, arguments);
            _.dispatch(_.global, new CustomEvent('pushstate'));
            return ret;
        };
    };
    intercept('pushState');
    intercept('replaceState');

    var current;
    _.location = function(e) {
        var uri = _.getLocation();
        if (uri !== current) {
            _.dispatch(_.global, new Eventi('location', {
                oldLocation: current,
                location: current = uri,
                srcEvent: e
            }));
        }
    };
    _.getLocation = function() {
        return decodeURI(location.pathname + location.search + location.hash);
    };
    _.setLocation = function(e, uri, fill) {
        // user-fired set events should not have oldLocation prop
        if (!e.oldLocation) {
            if (typeof uri !== "string") {
                fill = uri;
                uri = e.location;
            }
            if (uri) {
                var keys = _.keys(uri);
                if (keys) {
                    uri = keys.reduce(function(s, key) {
                        return s.replace(new RegExp('\\{'+key+'\\}',"g"),
                                         fill[key] || location[key] || '');
                    }, uri);
                }
                // don't share this event with other handlers
                e.stopPropagation();
                e.stopImmediatePropagation();
                history.pushState(null, null, encodeURI(uri));
            }
        }
    };
    _.keys = function(tmpl) {
        var keys = tmpl.match(/\{\w+\}/g);
        return keys && keys.map(function(key) {
            return key.substring(1, key.length-1);
        });
    };
    _.locationHandler = function(uri, handler) {
        var re = uri;
        if (uri.charAt(0) === '`') {
            re = re.substring(1, re.length-1);
        } else {
            re = re.replace(/([.*+?^=!:$(|\[\/\\])/g, "\\$1");// escape uri/regexp conflicts
            if (handler.keys = _.keys(re)) {
                re = re.replace(/\{[\w@\-\.]+\}/g, "([^\/?#]+)");
            } else {
                re.replace(/\{/g, '\\{');
            }
        }
        handler.uriRE = new RegExp(re);
        _.filter(handler, _.locationFilter);
    };
    _.locationFilter = function(event, handler) {
        var matches = (event.location || current).match(handler.uriRE);
        if (matches) {
            this.args.splice.apply(this.args, [1,0].concat(matches));
            if (handler.keys) {
                // put key/match object in place of full match
                this.args[1] = handler.keys.reduce(function(o, key) {
                    o[key] = matches.shift();
                    return o;
                }, { match: matches.shift() });
            }
        } else {
            this.target = undefined;
        }
    };
    var historyTypes = ['popstate','hashchange','pushstate'];
    Eventi.on('!'+(historyTypes.join(' !')), _.location)
    .on('!location', _.setLocation)
    .on(_, 'on:handler', function location(e, handler) {
        var type = handler.event.type;
        if (handler.location && !type) {
            type = handler.event.type = 'location';
        }
        if (type === 'location') {
            handler.global = true;
            // try immediately for current uri match
            if (!current) {
                current = _.getLocation();
            }
            _.execute(new Eventi('location',{location:current, srcEvent:e}), handler);
        } else if (historyTypes.indexOf(type) >= 0) {
            handler.global = true;
        }
    });
}
_.off = function(target, events, fn) {
    var listener = target[_key];
    if (listener) {
        for (var i=0, m=events.length; i<m; i++) {
            var filter = { event:{}, handler:{}, fn:fn, text:events[i] };
            _.parse(events[i], filter.event, filter.handler);
            // delete superfluous properties
            delete filter.event.tags;
            delete filter.handler.filters;
            delete filter.handler.end;
            if (target !== _) {
                Eventi.fire(_, 'off:filter', filter);
            }
            if (filter.event.type) {
                _.clean(filter.event.type, filter, listener, target);
            } else {
                for (var type in listener.s) {
                    _.clean(type, filter, listener, target);
                }
            }
        }
        if (_.empty(listener.s)) {
            delete target[_key];
        }
    }
};
_.unhandle = function off(handler) {
    _.off(handler.target, [handler.text], handler.fn);
};
_.empty = function(o){ for (var k in o){ return !k; } return true; };
_.clean = function(type, filter, listener, target) {
    var handlers = listener.s[type];
    if (handlers) {
        for (var i=0, m=handlers.length; i<m; i++) {
            if (_.cleans(handlers[i], filter)) {
                var cleaned = handlers.splice(i--, 1)[0];
                if (target !== _) {// ignore internal events
                    Eventi.fire(_, 'off:cleaned', cleaned);
                }
                m--;
            }
        }
        if (!handlers.length) {
            if (target.removeEventListener) {
                target.removeEventListener(type, listener, _.capture.indexOf(type) >= 0);
            }
            delete listener.s[type];
        }
    }
};
_.cleans = function(handler, filter) {
    return _.matches(handler.event, filter.event) &&
           _.matches(handler, filter.handler) &&
           (!handler.important || (filter.handler.important &&
                                   _.matches(filter.event, handler.event))) &&
           (!filter.fn || filter.fn === handler.fn);
};
_.fn('off', 3);
// add singleton to _.parse's supported event properties
_.parsers.unshift([/^(\W*)\^/, function(event, handler, other) {
	handler.singleton = true;
	if (event !== handler) {
		_.filter(handler, _.before);
	}
	return other;
}]);

// _.fire's _.dispatch will call this when appropriate
_.singleton = function(target, event) {
	_.remember(target, event);
	if (event.bubbles && !event.propagationStopped && target !== _.global) {
		_.singleton(target.parentNode || target.parentObject || _.global, event);
	}
};
var _skey = _._skey = '^'+_key;
_.remember = function remember(target, event) {
	var saved = target[_skey] || [];
	if (!saved.length) {
		Object.defineProperty(target, _skey, {value:saved,configurable:true});
	}
	event[_skey] = true;
	saved.push(event);
};
_.before = function singleton(event, handler) {
	_.unhandle(handler);
	handler.fn = _.noop;// tell _.handler not to keep this
	if (!event[_skey]) {// remember this non-singleton as singleton for handler's sake
		_.remember(this.target, event);
	}
};

Eventi.on(_, 'on:handler', function singleton(e, handler) {
	if (handler.singleton) {
		// search target's saved singletons, execute handler upon match
		var saved = handler.target[_skey]||[];
		for (var i=0,m=saved.length; i<m; i++) {
			var event = saved[i];
			if (_.matches(event, handler.event)) {
				_.execute(event, handler);
				break;
			}
		}
	}
});

if (document) {
	Eventi.on('DOMContentLoaded', function ready(e) {
		Eventi.fire(document.documentElement, '^ready', e);
	});
}
_.parsers.unshift([/\$(\!?\w+(\.\w+)*)/, function(event, handler, condition) {
    handler.endtest = condition;
    handler.end = _.endTest(condition);
}]);
_.endTest = function(condition) {
    var callsLeft = parseInt(condition, 10);
    if (callsLeft) {
        return function(){ return !--callsLeft; };
    }
    var not = condition.charAt(0) === '!';
    if (not){ condition = condition.substring(1); }
    if (condition && _.resolveRE.test(condition)) {
        return function endRef() {
            var value = _.resolve(condition, this, true);
            if (value === undefined) {
                value = _.resolve(condition, true);
            }
            if (typeof value === "function") {
                value = value.apply(this, arguments);
            }
            return not ? !value : value;
        };
    }
};
// overwrite fire.js' _.fireAll to watch for combo events
_.fireAll = function(target, events, props, _resumeIndex) {
    var event, sequence;
    for (var i=0; i<events.length; i++) {
        sequence = props.sequence = _.split.ter(events[i], '+', ',');
        for (var j=_resumeIndex||0; j < sequence.length && (!event||!event.isSequencePaused()); j++) {
            if (sequence[j]) {
                props.index = j;
                event = props.previousEvent = _.create(sequence[j], props);
                _.sequence(event, props, target);
                _.dispatch(target, event);
            } else {
                sequence.splice(j--, 1);
            }
        }
    }
    return event;
};
_.sequence = function(event, props, target, paused) {
    event.resumeSequence = function(index) {
        if (paused) {
            paused = false;
            _.fireAll(target, [props.sequence.join(',')], props, index||props.index+1);
        }
    };
    event.pauseSequence = function(promise) {
        if (paused !== false) {// multiple pauses is nonsense
            paused = true;
            return promise && promise.then(this.resumeSequence);
        }
    };
    event.isSequencePaused = function(){ return !!paused; };
};
_.combo = {
    convert: function(handler, text, texts) {
        handler.event = _.combo.event(text);
        if (handler.data && typeof handler.data[0] === "number") {
            handler.timeout = handler.data.shift();
        }
        delete handler.singleton;
        delete handler.selector;
        delete handler.location;
        delete handler.filters;
        delete handler.endtest;
        delete handler.end;
        // set up combo event handlers
        handler.texts = texts;
        handler.ordered = texts.ordered;
        handler.reset = _.combo.reset.bind(handler);
        handler.handlers = texts.map(function(text, index) {
            return _.handler(handler.target, text, _.combo.eventFn.bind(handler, index));
        });
        handler.reset();
    },
    event: function(text) {
        return _.combo[text] || (_.combo[text] = {
            category: 'combo',
            type: '_'+(++_.combo.count)
        });
    },
    split: function(text) {
        var parts = _.split.ter(text, '+');
        if (parts.length > 1) {
            parts.ordered = false;
        } else {
            parts = _.split.ter(text, ',');
            if (parts.length > 1) {
                parts.ordered = true;
            }
        }
        return parts;
    },
    count: 0,
    reset: function() {
        if (this.clear){ clearTimeout(this.clear); }
        this.unfired = this.texts.slice();
        this.events = [];
    },
    eventFn: function(index, e) {
        if (this.timeout && !this.clear) {
            this.clear = setTimeout(this.reset, this.timeout);
        }
        if (this.events.indexOf(e) < 0 &&
            (!this.ordered || index-1 === this.unfired.lastIndexOf(''))) {
            this.unfired[index] = '';
            this.events.push(e);
            if (!this.unfired.join('')) {
                var event = _.create('combo:'+this.event.type);
                event.events = this.events;
                event.text = this.text;
                _.dispatch(this.target, event);
                this.reset();
            }
        }
    }
};
Eventi.on(_, 'on:handler', function comboHandler(e, handler) {
	var text = handler.text,
		texts = _.combo.split(text);
	if (texts.length > 1) {
        _.combo.convert(handler, text, texts);
	}
}).on(_, 'off:filter', function comboFilter(e, filter) {
    if (_.combo.split(filter.text).length > 1) {
        filter.event = _.combo.event(filter.text);
    }
}).on(_, 'off:cleaned', function comboOff(e, handler) {
    if (handler.handlers) {
        handler.handlers.forEach(_.unhandle);
    }
});

    var sP = Event.prototype.stopPropagation || _.noop,
        sIP = Event.prototype.stopImmediatePropagation || _.noop;
    CustomEvent.prototype.stopPropagation = function() {
        this.propagationStopped = true;
        sP.call(this);
    };
    CustomEvent.prototype.stopImmediatePropagation = function() {
        this.immediatePropagationStopped = true;
        sIP.call(this);
    };

    // export Eventi (AMD, commonjs, or window/env)
    var define = global.define || _.noop;
    define((global.exports||global).Eventi = Eventi);

})(this, this.document);

/*! random-x - v0.1.1 - 2014-12-04
* http://esha.github.io/random-x/
* Copyright (c) 2014 ESHA Research; Licensed MIT */

(function(window, D) {
    "use strict";

var RandomXProto,
    RandomX;

if (D.registerElement) {
    RandomXProto = Object.create(HTMLElement.prototype);
    RandomXProto.createdCallback = function(){ this.randomize(); };
    // wait to register until proto is complete
} else {
    RandomXProto = {};
    RandomX = window.RandomX = function RandomX(el) {
        if (!el.randomize) {
            Object.getOwnPropertyNames(RandomXProto)
            .forEach(function(prop) {
                Object.defineProperty(el, prop,
                    Object.getOwnPropertyDescriptor(RandomXProto, prop));
            });
            el.randomize();
        }
    };
    RandomX.load = function() {
        D.queryAll('random-x').each(RandomX);
    };

    RandomX.load();// early availability
    D.addEventListener('DOMContentLoaded', RandomX.load);// eventual consistency
}

RandomXProto.randomize = function() {
    var all = this._randomize || (this._randomize = this.queryAll('*')),
        chosen = all[Math.floor(Math.random()*all.length)];
    this.queryAll('*').remove();
    this.append(chosen);
};

// ok, register now that proto is ready
if (D.registerElement) {
    RandomX = window.RandomX = D.registerElement('random-x', {
        prototype: RandomXProto
    });
}


})(window, document);

/*! Vista - v2.0.1 - 2014-10-21
* https://github.com/esha/vista
* Copyright (c) 2014 ESHA Research; Licensed MIT */
(function(window, document, location, history) {
    'use strict';

    var init = function() {
        init = false;

        _._list = [];

        _.style = document.createElement('style');
        document.head.appendChild(_.style);

        window.addEventListener('hashchange', _.update);
        window.addEventListener('popstate', _.update);
        var intercept = function(name) {
            var fn = _['_'+name] = history[name];
            history[name] = function() {
                var ret = fn.apply(this, arguments);
                _.update();
                return ret;
            };
        };
        intercept('pushState');
        intercept('replaceState');

        _.define('start');
        _.update();
    },
    html = document.documentElement,
    _ = {
        version: '2.0.1',
        define: function(name, test, style) {
            if (init) {
                init();
            }
            switch (typeof test) {
                case "undefined":
                    test = name;
                    /* falls through */
                case "string":
                    test = new RegExp(test);
                    /* falls through */
                case "object":
                    test = test.test.bind(test);// haha!
            }
            _._list.push({ name: name, test: test });
            _.style.textContent += _.rules(name, style);
        },
        rules: function(name, style) {
            return '[vista~="'+name+'"],\n'+
                   '[vista-'+name+'] [vista~="!'+name+'"] {\n'+
                   '  display: none !important;\n'+
                   '}\n'+
                   '[vista-'+name+'] [vista~="'+name+'"] {\n'+
                   '  display: block !important;\n'+
                   '  display: '+(style||'initial')+' !important;\n'+
                   '}\n';
        },
        update: function() {
            var url = location+'',
                start = true;
            _._list.forEach(function(vista) {
                var show = vista.test(url);
                _.toggle(vista.name, show);
                if (show) {
                    start = false;
                }
            });
            _.toggle('start', start);
        },
        active: function(name) {
            return html.hasAttribute('vista-'+name);
        },
        toggle: function(name, active) {
            active = active === undefined ? !_.active(name) : active;
            html[active ? 'setAttribute' : 'removeAttribute']('vista-'+name, 'active');
        },
        config: function() {
            var meta = document.querySelectorAll('meta[itemprop=vista]');
            for (var i=0,m=meta.length; i<m; i++) {
                var el = meta[i],
                    definitions = (el.getAttribute('define')||'').split(' '),
                    style = el.getAttribute('style');
                for (var j=0,n=definitions.length; j<n; j++) {
                    var definition = definitions[j],
                        eq = definition.indexOf('=');
                    if (eq > 0) {
                        _.define(definition.substring(0, eq), definition.substring(eq+1), style);
                    } else {
                        _.define(definition, undefined, style);
                    }
                }
                el.setAttribute('itemprop', definitions.length ? 'vista-done' : 'vista-fail');
            }
            if (meta.length) {
                _.update();
            }
        }
    };

    _.config();
    document.addEventListener('DOMContentLoaded', _.config);

    // export Vista (AMD, commonjs, or window)
    var define = window.define || function(){};
    define((window.exports||window).Vista = _);

})(window, document, window.location, window.history);
