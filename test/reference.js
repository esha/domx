(function(window, document) {
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
	var testReference = window.testReference;

	module("domx under name besides D");

	test('D', function() {
		ok(!('D' in window), 'D should not be present');
	});

	test('testReference', function() {
		ok('testReference' in window, 'testReference should be present');
		strictEqual(testReference, document, 'testReference should be document');
	});

	test('is ified', function() {
		ok(testReference._, "testReference._ should be present");
		ok(testReference.query, "testReference.query should be present");
	});

}(window, document));

