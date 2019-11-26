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
	module("insert(emmet)");

	test("nested", function(assert) {
		var nested = D.body.insert('div>div');
		assert.equal(nested.tagName, "DIV", "Tags created.");
		assert.ok(D.queryAll('body > div').only(-1).query('div'), 'Tags found.');
		nested.parentNode.remove();
	});

	test("siblings with kids", function(assert) {
		var h1 = D.body.insert('section.bro+section.bro').insert('h1');

		assert.equal(h1.tagName, "H1", "Tag created");
		assert.equal(h1.parentNode.tagName, "SECTION", "Tag within parent");
		assert.ok(D.query('section h1').nodeType, "only the last section got an h1 kid");
		D.queryAll('section.bro').remove();
	});

	test("element id", function(assert) {
		assert.ok(D.body.insert('span#foo'), 'have element');
		assert.equal(D.query('body > span').id, 'foo', 'has right id');
		D.query('#foo').remove();
	});

	test("element class", function(assert) {
		assert.ok(D.body.insert('div#classes.bar.woogie'), 'have element');
		assert.equal(D.query('#classes').getAttribute('class'), 'bar woogie', 'has right classes');
		D.query('#classes').remove();
	});

	test("element attr", function(assert) {
        assert.expect(4);
		assert.ok(D.body.insert('div#attrs[test foo=bar bar="woogie baz"]'), 'have element');
		var el = D.query('#attrs');
		assert.equal(el.getAttribute('test'), '', 'has empty test attr');
		assert.equal(el.getAttribute('foo'), 'bar', 'foo attr is bar');
		assert.equal(el.getAttribute('bar'), 'woogie baz', 'bar attr is "woogie baz"');
		el.remove();
	});

    test("escaped bracket in element attr", function(assert) {
        assert.expect(2);
        assert.ok(D.body.insert('div#attrs[test=[\]]'), 'have element');
        var el = D.query('#attrs');
        assert.equal(el.getAttribute('test'), '[]', 'has right test attr');
        el.remove();
    });

    test("unclosed element attr", function(assert) {
        assert.expect(2);
        assert.ok(D.body.insert('div#attrs[test'), 'have element');
        var el = D.query('#attrs');
        assert.equal(el.getAttribute('test'), '', 'has empty test attr');
        el.remove();
    });

	test("climb up context", function(assert) {
        assert.expect(4);
		assert.equal(D.body.insert('p>div>div>span^h2^+h1').tagName, 'H1', 'right element');
		assert.ok(D.query('p > div > div > span'), 'have initial tree');
		assert.ok(D.query('p > div > h2'), 'h2 went in right place');
		assert.ok(D.query('body > h1'), 'h1 went in right place');
		D.queryAll('body > p, body > h1').remove();
	});

    test("commas mean back to root", function(assert) {
        assert.expect(4);
        assert.equal(D.body.insert('p#a>a>b,div.b>span,table[c=d]>tr>td').tagName, 'TD', 'right returned element');
        assert.ok(D.query('body > p#a > a > b'), 'p>a>b went right');
        assert.ok(D.query('body > div.b > span'), 'div>span went right');
        assert.ok(D.query('body > table[c=d] tr > td'), 'table[c=d]>tr>td went right');
        D.queryAll('p#a,div.b,table[c=d]').remove();
    });

	test("multiplier", function(assert) {
        assert.expect(4);
		var spans = D.body.insert('span*5');

		assert.ok(_.isList(spans), "Multiple elements created and is list");
		assert.ok(spans.length === 5, "Exact amount of elements preset");
		assert.equal(spans[0].tagName, "SPAN", "Element specified created");
		assert.equal(spans[0].parentNode.tagName, "BODY", "Appended!");
		spans.remove();
	});

    test("mid expression multiplier", function(assert) {
        D.body.insert('p#root>div.foo*2>span#id.class[attr=val]');
        assert.equal(D.queryAll('span#id.class[attr=val]').length, 2);
        D.body.query('#root').remove();
    });

    test("group", function(assert) {
        assert.expect(3);
        D.body.insert('div#parent>(header.group>ul>li*2>a)*2+footer>p');
        var parents = D.queryAll('#parent');
        assert.equal(parents.length, 1, "only one parent");
        assert.equal(parents.queryAll('header.group').length, 2, "got two headers");
        assert.equal(parents.queryAll('footer').length, 1, "got one footer");
        parents.remove();
    });

	test("text", function(assert) {
        assert.expect(4);
		var text = D.body.insert('p#text{hello. cruel. world!}');
		assert.ok(text, 'have element');
		assert.equal(D.query('#text').textContent, 'hello. cruel. world!', 'has right text');
		text.remove();
		var mixed = D.body.insert('p#mixed{a}>span+{ b}');
		assert.equal(mixed.textContent, 'a b', 'both text parts');
		assert.ok(mixed.query('span'), 'and child node');
		mixed.remove();
	});

    test("double text", function(assert) {
        assert.expect(2);
        var a = D.body.insert('a{foo}{bar}');
        assert.equal(a.tagName, 'A', 'got anchor');
        assert.equal(a.textContent, 'foobar', 'has right text');
        a.remove();
    });

    test("unclosed text", function(assert) {
        assert.expect(2);
        var text = D.body.insert('p#text{hello. cruel. world!');
        assert.ok(text, 'have element');
        assert.equal(D.query('#text').textContent, 'hello. cruel. world!', 'has right text');
        text.remove();
    });

    test("escaped } in text", function(assert) {
        assert.expect(2);
        var text = D.body.insert('p#text{braces are {\\}. Cool, eh?}');
        assert.ok(text, 'have element');
        assert.equal(D.query('#text').textContent, 'braces are {}. Cool, eh?', 'has right text');
        text.remove();
    });

    test("#3 attribute vs class", function(assert) {
        assert.expect(3);
        var img = D.x._.emmet(D.createElement('div'), 'div>img[src=text.png]');
        assert.ok(img, 'have img');
        assert.equal(img.getAttribute('src'), 'text.png', 'has right src');
        assert.ok(!img.hasAttribute('class'), 'does not have class');
    });

    test("quoted attribute", function(assert) {
        assert.expect(3);
        var quoted = D.body.insert('span[mustache="{{text.png}}"]');
        assert.ok(quoted, 'have element');
        assert.equal(quoted.getAttribute('mustache'), '{{text.png}}', 'has right attr');
        assert.ok(!quoted.hasAttribute('class'), 'does not have class');
        quoted.remove();
    });

}(document, QUnit.module, QUnit.test));
