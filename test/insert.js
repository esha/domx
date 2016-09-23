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

  var _ = D.x._;
	module("insert()");

	test("basic", function() {
		ok(!D.query('body > a'), "no A to begin with");
		equal(D.body.insert('a').tagName, "A", "Tag created.");
		ok(D.query('body > a'), 'Tag found.');
		D.query('body > a').remove();
	});

	test("insert node", function() {
		var node = D.createElement('article');
		equal(D.body.insert(node), node, "inserted node and got it back");
		ok(D.body.query('article') && 'each' in node, 'inserted node has been assimilated');
		node.remove();
	});

	test("insert list", function() {
		var list = ['nav', D.createElement('nav'), ['nav']];
		equal(D.body.insert(list).length, 3, 'inserted three nav elements');
		D.queryAll('nav').remove();
	});

    test("insert to list", function() {
        var list = D.queryAll('section.foo > div');
        list.insert('test');
        var tests = D.queryAll('.foo > div > test');
        equal(tests.length, list.length, 'inserted a test element to each div');
    });

  //TODO: test insert(el, ref);

  module("remove()");

  test("single", 3, function() {
    var el = D.body.insert('doomed');
    ok(el, 'have element');
    el.remove();
    ok(!el.parentNode, 'no parent after removal');
    ok(!D.body.queryAll('doomed').length, 'queryAll() returns empty array');
  });

  test("list", 8, function() {
    var list = D.body.insert('doa*5');
    ok(_.isList(list), 'have list');
    strictEqual(list.remove(), list, 'remove returns self');
    list.each(function(doa) {
      ok(!doa.parentNode, 'no parents after removal');
    });
    ok(!D.body.queryAll('doa').length, 'queryAll() returns empty array');
  });

}(document));
