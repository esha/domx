(function(D) {
  /*
    ======== A Handy Little QUnit Reference ========
    http://api.qunitjs.com/

    Test methods:
      module(name, {[setup][ ,teardown]})
      test(name, callback)
      expect(numberOfAssertions)
      stop(increment)
      start(decrement)
    Test assertions:
      ok(value, [message])
      equal(actual, expected, [message])
      notEqual(actual, expected, [message])
      deepEqual(actual, expected, [message])
      notDeepEqual(actual, expected, [message])
      strictEqual(actual, expected, [message])
      notStrictEqual(actual, expected, [message])
      throws(block, [expected], [message])
  */

    var X = D.x,
        _ = X._;
    module("repeat()");

    test("_.", function() {
        equal(typeof _.repeat, "object", "_.repeat");
        var R = _.repeat;
        equal(R.id, "data-repeat-id");
        equal(typeof R.count, "number", "_.repeat.count");
        equal(typeof R.init, "function", "_.repeat.init");
        equal(typeof R.repeat, "function", "_.repeat.repeat");
        ok(R.style instanceof Element, "_.repeat.repeat");
    });

    test("repeat() presence", function() {
        var set = [Element].concat(X.sets);
        expect(set.length);
        set.forEach(function(_class) {
            equal(typeof _class.prototype.repeat, "function", _class.name+".prototype.repeat");
        });
    });

    test("via javascript", function() {
        var el = D.queryAll('section');
        equal(el.length, 1, "only one to start");
        el = el[0];
        var copy = el.repeat();
        equal(D.queryAll('section').length, 2, "now have two");
        var xrepeat = el.parentNode.query('x-repeat');
        equal(xrepeat instanceof Element, true, "has sibling x-repeat");
        equal(xrepeat.previousElementSibling, copy, "xrepeat is last");
    });

    test('via data-repeat="selector"', function() {
        // gets x-repeat w/same attributes
        var el = D.query('.other');
        equal(el.tagName.toLowerCase(), 'x-repeat', "should already be x-repeat");
        equal(el.getAttribute('data-repeat'), '.foo', "should have data-repeat");
        equal(el.hasAttribute('data-repeat-none'), true, "should have data-repeat-none");
        equal(el.innerHTML, "There are &lt;b&gt;no&lt;/b&gt; foos.", "has same innerHTML");
        equal(el.hasAttribute('data-repeat-id'), true, "should have data-repeat-id");

        // R.init & R.style
        var repeats = D.queryAll('body > .foo');
        equal(repeats.length, 0, "should start with no repeats");
        equal(window.getComputedStyle(el).display, 'inline-block', 'none message should be visible');

        // R.repeat & R.style
        el.repeat();
        equal(window.getComputedStyle(el).display, 'none', 'none message should no longer be visible');
        repeats = D.queryAll('body > .foo');
        equal(repeats.length, 1, "should have a .foo now");

        // clean up
        D.queryAll('.other').remove();
    });

    test('easier together than apart', function() {
        var self = D.query('.self');
        equal(self.tagName.toLowerCase(), 'x-repeat', "should already be x-repeat");
        ok(self.hasAttribute('data-repeat'), "should have data-repeat");
        
        // none message in attribute
        equal(self.getAttribute('data-repeat-none'), "No items.", "should have data-repeat-none");
        equal(self.innerHTML, self.getAttribute('data-repeat-none'), "innerHTML should be same as none attr");
        equal(D.queryAll('.item').length, 0, "no items");

        // should be able to call on any of the repeats/none w/same effect
        self.repeat().repeat();
        equal(D.queryAll('.item').length, 2, "2 items");

        // data-index
        var selves = D.queryAll('.self[data-index]');
        equal(selves.length, 2);
        selves.each(function(el, i) {
            equal(el.getAttribute('data-index'), i, "should have proper index");
        });

        // data-repeat-first
        var first = self.repeat('first');
        ok(self.hasAttribute('data-repeat-first'), "has data-repeat-first");
        equal(first.getAttribute('data-index'), 0, "new repeats should go first");
        equal(D.query('.self').innerHTML, "first", "should get value of 'first'");

        equal(D.queryAll('.self').length, 4, "should get 3 repeats and the anchor");
        self.repeat(false);
        equal(D.queryAll('.self').length, 1, "should have just the anchor");

        // test repeat([false]) workaround
        self.repeat([false]);
        equal(D.queryAll('.self').length, 2, "should have 1 repeat + anchor");
        equal(D.query('.self').textContent, "false", "first should have false as value");

        self.repeat([1,2,3]);
        equal(D.queryAll('.self[data-index]').length, 4, "plue 3 more repeats makes 4");

        // clean up
        D.queryAll('.self').remove();
    });

}(document));
