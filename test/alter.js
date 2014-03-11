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

	module("D element creation");

	test("basic", function() {
		ok(!D.html.body.a, "no A to begin with");
		equal(D.html.body.add('a').tagName, "A", "Tag created.");
		ok(D.html.body.a, 'Tag found.');
		D.html.body.a.remove();
	});

	test("add node", function() {
		var node = document.createElement('article');
		equal(D.html.body.add(node), node, "added node and got it back");
		ok(D.html.body.article && 'each' in node, 'added node has been assimilated');
		node.remove();
	});

	test("add list", function() {
		var list = ['nav', document.createElement('nav'), ['nav']];
		equal(D.html.body.add(list).length, 3, 'added three nav elements');
		D.query('nav').remove();
	});

  //TODO: test add(el, ref);

  module("D element removal");

  test("single", 3, function() {
    var el = D.html.body.add('doomed');
    ok(el, 'have element');
    el.remove();
    ok(!el.parentNode, 'no parent after removal');
    ok(!D.html.body.doomed.length, 'child property is empty array');
  });

  test("list", 8, function() {
    var list = D.html.body.add('doa*5');
    ok(list && list.forEach, 'have array');
    strictEqual(list.remove(), list, 'remove returns self');
    list.each(function(doa) {
      ok(!doa.parentNode, 'no parents after removal');
    });
    ok(!D.html.body.doa.length, 'child property is empty array');
  });

}(D));
