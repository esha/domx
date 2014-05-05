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
    module("DOMx elements");

    test('D.html', function() {
        equal(D.html, D.documentElement, "D.html should be present");
    });

    test("API", function() {
        equal(typeof _.elements, "object", "_.elements");
        equal(typeof _.elements.read, "function", "_.elements.read");
        equal(typeof _.elements.fn, "function", "_.elements.fn");
    });

    test("multiple descendants are a list", function() {
        ok(D.body.div.section.div, "got multiple");
        ok(_.isList(D.body.div.section.div), "as a list");
    });

    test("single descendant is still list", function() {
        ok(D.body.div.section, "got to grandkid");
        ok(_.isList(D.body.div.section), "it's a list");
        equal(D.body.div.section[0], D.query('section'), 'should have the sole section element');
        equal(D.body.div.section.length, 1);
    });

    test("grandkids come descending order", function() {
        var div = D.body.div.section.div;
        ok(div[0].id === "first" && div[div.length - 1].id === "last", "Order is descending");
    });

    test("$text nodes", function() {
        var $text = D.body.div.section.div.span.$text;
        equal($text.length, 1);
        ok($text[0] instanceof Text);
        equal($text[0].length, 1);
    });

    test("$comment nodes", function() {
        var $comment = D.body.div.$comment;
        equal($comment.length, 1);
        ok($comment[0] instanceof Comment);
        equal($comment[0].data, ' a comment ');
    });

}(document));

