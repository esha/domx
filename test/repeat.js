(function(D, module, test) {
    /*
    ======== A Handy Little QUnit Reference ========
    http://api.qunitjs.com/

    Test methods:
      module(name, {[setup][ ,teardown]})
      test(name, callback)
      assert.expect(numberOfAssertions)
      stop(increment)
      start(decrement)
    Test assertions:
      assert.ok(value, [message])
      assert.equal(actual, expected, [message])
      assert.notEqual(actual, expected, [message])
      assert.deepEqual(actual, expected, [message])
      notassert.deepEqual(actual, expected, [message])
      assert.strictEqual(actual, expected, [message])
      notassert.strictEqual(actual, expected, [message])
      throws(block, [expected], [message])
  */
    var X = D.x,
        _ = X._;
    module("repeat()");

    test("_.", function(assert) {
        assert.equal(typeof _.repeat, "object", "_.repeat");
        var R = _.repeat;
        assert.equal(R.id, "x-repeat-id");
        assert.equal(typeof R.count, "number", "_.repeat.count");
        assert.equal(typeof R.init, "function", "_.repeat.init");
        assert.equal(typeof R.repeat, "function", "_.repeat.repeat");
        assert.ok(R.style instanceof Element, "_.repeat.repeat");
    });

    test("repeat() presence", function(assert) {
        var set = [Element].concat(X.lists);
        assert.expect(set.length);
        set.forEach(function(_class) {
            assert.equal(typeof _class.prototype.repeat, "function", _class.name+".prototype.repeat");
        });
    });

    test("via javascript", function(assert) {
        var el = D.queryAll('section');
        assert.equal(el.length, 1, "only one to start");
        el = el[0];
        var copy = el.repeat();
        assert.equal(D.queryAll('section').length, 2, "now have two");
        var xrepeat = el.parentNode.query('x-repeat');
        assert.equal(xrepeat instanceof Element, true, "has sibling x-repeat");
        assert.equal(xrepeat.previousElementSibling, copy, "xrepeat is last");
    });

    test('via x-repeat="selector"', function(assert) {
        // gets x-repeat w/same attributes
        var el = D.query('.other');
        assert.equal(el.tagName.toLowerCase(), 'x-repeat', "should already be x-repeat");
        assert.equal(el.getAttribute('x-repeat'), '.foo', "should have x-repeat");
        assert.equal(el.hasAttribute('x-repeat-none'), true, "should have x-repeat-none");
        assert.equal(el.innerHTML, "There are &lt;b&gt;no&lt;/b&gt; foos.", "has same innerHTML");
        assert.equal(el.hasAttribute('x-repeat-id'), true, "should have x-repeat-id");

        // R.init & R.style
        var repeats = D.queryAll('body > .foo');
        assert.equal(repeats.length, 0, "should start with no repeats");
        assert.equal(window.getComputedStyle(el).display, 'inline-block', 'none message should be visible');

        // R.repeat & R.style
        el.repeat();
        assert.equal(window.getComputedStyle(el).display, 'none', 'none message should no longer be visible');
        repeats = D.queryAll('body > .foo');
        assert.equal(repeats.length, 1, "should have a .foo now");

        // clean up
        D.queryAll('.other').remove();
    });

    test('easier together than apart', function(assert) {
        var self = D.query('.self');
        assert.equal(self.tagName.toLowerCase(), 'x-repeat', "should already be x-repeat");
        assert.ok(self.hasAttribute('x-repeat'), "should have x-repeat");
        
        // none message in attribute
        assert.equal(self.getAttribute('x-repeat-none'), "No items.", "should have x-repeat-none");
        assert.equal(self.innerHTML, self.getAttribute('x-repeat-none'), "innerHTML should be same as none attr");
        assert.equal(D.queryAll('.item').length, 0, "no items");

        // should be able to call on any of the repeats/none w/same effect
        self.repeat().repeat();
        assert.equal(D.queryAll('.item').length, 2, "2 items");

        // x-index
        var selves = D.queryAll('.self[x-index]');
        assert.equal(selves.length, 2);
        selves.each(function(el, i) {
            assert.equal(el.getAttribute('x-index'), i, "should have proper index");
        });

        // x-repeat-first
        var first = self.repeat('first');
        assert.ok(self.hasAttribute('x-repeat-first'), "has x-repeat-first");
        assert.equal(first.getAttribute('x-index'), 0, "new repeats should go first");
        assert.equal(D.query('.self').innerHTML, "first", "should get value of 'first'");

        assert.equal(D.queryAll('.self').length, 4, "should get 3 repeats and the anchor");
        self.repeat(false);
        assert.equal(D.queryAll('.self').length, 1, "should have just the anchor");

        // test repeat([false]) workaround
        self.repeat([false]);
        assert.equal(D.queryAll('.self').length, 2, "should have 1 repeat + anchor");
        assert.equal(D.query('.self').textContent, "false", "first should have false as value");

        self.repeat([1,2,3]);
        assert.equal(D.queryAll('.self[x-index]').length, 4, "plue 3 more repeats makes 4");

        // clean up
        D.queryAll('.self').remove();
    });

}(document, QUnit.module, QUnit.test));
