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
    var _ = D.x._;
    module("DOMx dot traversal");

    test('D.html', function(assert) {
        assert.equal(D.html, D.documentElement, "D.html should be present");
        assert.ok(D.html instanceof Element, "D.html should be an element, not list");
    });

    test("API", function(assert) {
        assert.equal(typeof _.dot, "object", "_.dot");
        assert.equal(typeof _.dot.names, "object", "_.dot.names");
        assert.equal(typeof _.dot.fn, "function", "_.dot.fn");
    });

    test("multiple descendants are a list", function(assert) {
        assert.ok(D.body.div.section.div, "got multiple");
        assert.ok(_.isList(D.body.div.section.div), "as a list");
    });

    test("single descendant is still list", function(assert) {
        assert.ok(D.body.div.section, "got to grandkid");
        assert.ok(_.isList(D.body.div.section), "it's a list");
        assert.equal(D.body.div.section[0], D.query('section'), 'should have the sole section element');
        assert.equal(D.body.div.section.length, 1);
    });

    test("grandkids come descending order", function(assert) {
        var div = D.body.div.section.div;
        assert.ok(div[0].id === "first" && div[div.length - 1].id === "last", "Order is descending");
    });

    test("$text nodes", function(assert) {
        var $text = D.body.div.section.div.span.$text;
        assert.equal($text.length, 1);
        assert.ok($text[0] instanceof Text);
        assert.equal($text[0].length, 1);
    });

    test("$comment nodes", function(assert) {
        var $comment = D.body.div.$comment;
        assert.equal($comment.length, 1);
        assert.ok($comment[0] instanceof Comment);
        assert.equal($comment[0].data, ' a comment ');
    });

}(document, QUnit.module, QUnit.test));

