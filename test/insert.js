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
	module("insert()");

	test("basic", function(assert) {
		assert.ok(!D.query('body > a'), "no A to begin with");
		assert.equal(D.body.insert('a').tagName, "A", "Tag created.");
		assert.ok(D.query('body > a'), 'Tag found.');
		D.query('body > a').remove();
	});

	test("insert node", function(assert) {
		var node = D.createElement('article');
		assert.equal(D.body.insert(node), node, "inserted node and got it back");
		assert.ok(D.body.query('article') && 'each' in node, 'inserted node has been assimilated');
		node.remove();
	});

	test("insert list", function(assert) {
		var list = ['nav', D.createElement('nav'), ['nav']];
		assert.equal(D.body.insert(list).length, 3, 'inserted three nav elements');
		D.queryAll('nav').remove();
	});

    test("insert to list", function(assert) {
        var list = D.queryAll('section.foo > div');
        list.insert('test');
        var tests = D.queryAll('.foo > div > test');
        assert.equal(tests.length, list.length, 'inserted a test element to each div');
    });

  //TODO: test insert(el, ref);

  module("remove()");

  test("single", function(assert) {
    assert.expect(3);
    var el = D.body.insert('doomed');
    assert.ok(el, 'have element');
    el.remove();
    assert.ok(!el.parentNode, 'no parent after removal');
    assert.ok(!D.body.queryAll('doomed').length, 'queryAll() returns empty array');
  });

  test("list", function(assert) {
    assert.expect(8);
    var list = D.body.insert('doa*5');
    assert.ok(_.isList(list), 'have list');
    assert.strictEqual(list.remove(), list, 'remove returns self');
    list.each(function(doa) {
      assert.ok(!doa.parentNode, 'no parents after removal');
    });
    assert.ok(!D.body.queryAll('doa').length, 'queryAll() returns empty array');
  });

}(document, QUnit.module, QUnit.test));
