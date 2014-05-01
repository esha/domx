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
	module("D element creation");

	test("basic", function() {
		ok(!D.query('body > a'), "no A to begin with");
		equal(D.body.add('a').tagName, "A", "Tag created.");
		ok(D.query('body > a'), 'Tag found.');
		D.query('body > a').remove();
	});

	test("add node", function() {
		var node = document.createElement('article');
		equal(D.body.add(node), node, "added node and got it back");
		ok(D.body.query('article') && 'each' in node, 'added node has been assimilated');
		node.remove();
	});

	test("add list", function() {
		var list = ['nav', document.createElement('nav'), ['nav']];
		equal(D.body.add(list).length, 3, 'added three nav elements');
		D.queryAll('nav').remove();
	});

  //TODO: test add(el, ref);

  module("D element removal");

  test("single", 3, function() {
    var el = D.body.add('doomed');
    ok(el, 'have element');
    el.remove();
    ok(!el.parentNode, 'no parent after removal');
    ok(!D.body.queryAll('doomed').length, 'queryAll() returns empty array');
  });

  test("list", 8, function() {
    var list = D.body.add('doa*5');
    ok(_.isList(list), 'have list');
    strictEqual(list.remove(), list, 'remove returns self');
    list.each(function(doa) {
      ok(!doa.parentNode, 'no parents after removal');
    });
    ok(!D.body.queryAll('doa').length, 'queryAll() returns empty array');
  });

}(document));
