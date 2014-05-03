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
    module("D");

    test('D.html', function() {
        equal(D.html, D.documentElement, "D.html should be present");
    });

    var _ = D._;
    module("D._");

    test("API", function() {
        equal(typeof _.elements, "object", "_.elements");
        equal(typeof _.elements.read, "function", "_.elements.read");
        equal(typeof _.elements.fn, "function", "_.elements.fn");
    });

}(document));

