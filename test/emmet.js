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
	module("insert(emmet)");

	test("nested", function() {
		var nested = D.body.insert('div>div');
		equal(nested.tagName, "DIV", "Tags created.");
		ok(D.queryAll('body > div').only(-1).query('div'), 'Tags found.');
		nested.parentNode.remove();
	});

	test("siblings with kids", function() {
		var h1 = D.body.insert('section.bro+section.bro').insert('h1');

		equal(h1.tagName, "H1", "Tag created");
		equal(h1.parentNode.tagName, "SECTION", "Tag within parent");
		ok(D.query('section h1').nodeType, "only the last section got an h1 kid");
		D.queryAll('section.bro').remove();
	});

	test("element id", function() {
		ok(D.body.insert('span#foo'), 'have element');
		equal(D.query('body > span').id, 'foo', 'has right id');
		D.query('#foo').remove();
	});

	test("element class", function() {
		ok(D.body.insert('div#classes.bar.woogie'), 'have element');
		equal(D.query('#classes').getAttribute('class'), 'bar woogie', 'has right classes');
		D.query('#classes').remove();
	});

	test("element attr", 4, function() {
		ok(D.body.insert('div#attrs[test foo=bar bar="woogie baz"]'), 'have element');
		var el = D.query('#attrs');
		equal(el.getAttribute('test'), '', 'has empty test attr');
		equal(el.getAttribute('foo'), 'bar', 'foo attr is bar');
		equal(el.getAttribute('bar'), 'woogie baz', 'bar attr is "woogie baz"');
		el.remove();
	});

    test("escaped bracket in element attr", 2, function() {
        ok(D.body.insert('div#attrs[test=[\]]'), 'have element');
        var el = D.query('#attrs');
        equal(el.getAttribute('test'), '[]', 'has right test attr');
        el.remove();
    });

    test("unclosed element attr", 2, function() {
        ok(D.body.insert('div#attrs[test'), 'have element');
        var el = D.query('#attrs');
        equal(el.getAttribute('test'), '', 'has empty test attr');
        el.remove();
    });

	test("climb up context", 4, function() {
		equal(D.body.insert('p>div>div>span^h2^^h1').tagName, 'H1', 'right element');
		ok(D.query('p > div > div > span'), 'have initial tree');
		ok(D.query('p > div > h2'), 'h2 went in right place');
		ok(D.query('body > h1'), 'h1 went in right place');
		D.query('body > p').remove();
		D.query('body > h1').remove();
	});

	test("multiplier", 4, function() {
		var spans = D.body.insert('span*5');

		ok(_.isList(spans), "Multiple elements created and is list");
		ok(spans.length === 5, "Exact amount of elements preset");
		equal(spans[0].tagName, "SPAN", "Element specified created");
		equal(spans[0].parentNode.tagName, "BODY", "Appended!");
		spans.remove();
	});

	test("text", 4, function() {
		var text = D.body.insert('p#text{hello. cruel. world!}');
		ok(text, 'have element');
		equal(D.query('#text').textContent, 'hello. cruel. world!', 'has right text');
		text.remove();
		var mixed = D.body.insert('p#mixed{a}>span+{ b}');
		equal(mixed.textContent, 'a b', 'both text parts');
		ok(mixed.query('span'), 'and child node');
		mixed.remove();
	});

    test("unclosed text", 2, function() {
        var text = D.body.insert('p#text{hello. cruel. world!');
        ok(text, 'have element');
        equal(D.query('#text').textContent, 'hello. cruel. world!', 'has right text');
        text.remove();
    });

    test("escaped } in text", 2, function() {
        var text = D.body.insert('p#text{braces are {\\}. Cool, eh?}');
        ok(text, 'have element');
        equal(D.query('#text').textContent, 'braces are {}. Cool, eh?', 'has right text');
        text.remove();
    });

    test("#3 attribute vs class", 3, function() {
        var img = D.body.insert('div>img[src=text.png]');
        ok(img, 'have img');
        equal(img.getAttribute('src'), 'text.png', 'has right src');
        ok(!img.hasAttribute('class'), 'does not have class');
        img.remove();
    });

    test("quoted attribute", 3, function() {
        var quoted = D.body.insert('span[mustache="{{text.png}}"]');
        ok(quoted, 'have element');
        equal(quoted.getAttribute('mustache'), '{{text.png}}', 'has right attr');
        ok(!quoted.hasAttribute('class'), 'does not have class');
        quoted.remove();
    });

}(document));
