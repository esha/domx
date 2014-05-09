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

    var _ = D._;
    module(".value");

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
        var set = [Element].concat(_.lists);
        expect(set.length);
        set.forEach(function(_class) {
            equal(typeof _class.prototype.repeat, "function", _class.name+".prototype.repeat");
        });
    });

    // test repeat() doubles
        // and gets x-repeat
    // test data-repeat="selector"
        // gets x-repeat w/same attributes
    // test data-repeat-none
        // w/value
        // w/o value (use innerHTML instead)
    // test data-index
    // test data-repeat-first
    // test repeat(false)
        // test repeat([false]) workaround
    // test repeat(value)
    // test repeat([a,b,c])

}(document));
