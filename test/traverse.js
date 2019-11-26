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
    module("D");

    test("D.queryAll", function(assert) {
        assert.equal(typeof D.queryAll, "function", "D.queryAll");
        assert.equal(D.queryAll('body')[0], document.body, "D.queryAll('body')");
        assert.equal(D.query('body'), document.body, "D.query('body')");
    });

    var X = D.x,
        _ = X._;

    module('traverse DOM extensions');

    test("X.parents", function(assert) {
        assert.equal(Array.isArray(X.parents), true, "X.parents");
    });

    test("matches", function(assert) {
        assert.equal(typeof Element.prototype.matches, "function", "Element.prototype.matches");
    });

    test("only()", function(assert) {
        assert.expect(X.lists.length);
        X.lists.forEach(function(_class) {
            assert.ok(_class.prototype.only, _class.name+'.prototype.only');
        });
    });

    test("not()", function(assert) {
        assert.expect(X.lists.length);
        X.lists.forEach(function(_class) {
            assert.ok(_class.prototype.not, _class.name+'.prototype.not');
        });
    });

    test("all()", function(assert) {
        var set = X.lists.concat([Node]);
        assert.expect(set.length);
        set.forEach(function(_class) {
            assert.ok(_class.prototype.all, _class.name+'.prototype.all');
        });
    });

    test("queryAll()", function(assert) {
        var set = X.lists.concat(X.parents);
        assert.expect(set.length);
        set.forEach(function(_class) {
            assert.ok((_class.prototype||_class).queryAll, _class.name+'.prototype.queryAll');
        });
    });

    test("query()", function(assert) {
        var set = X.lists.concat(X.parents);
        assert.expect(set.length);
        set.forEach(function(_class) {
            assert.ok((_class.prototype||_class).query, _class.name+'.prototype.query');
        });
    });

    module("queryAll");

    test("queryAll multiple, get array", function(assert) {
        assert.ok(_.isList(D.queryAll("div")), "should be a list");
    });

    test("queryAll one, get HTMLElement", function(assert) {
        assert.ok(D.query("#identity") instanceof HTMLElement, "should be an element");
    });

    test("queryAll until count", function(assert) {
        assert.ok(D.query('section div[id]') instanceof HTMLElement, "should be a single element");

        var lessThanAvailable = D.queryAll('section div[id]', 2);
        assert.ok(_.isList(lessThanAvailable), 'should be a list');
        assert.equal(lessThanAvailable.length, 2, 'should have only two');

        var moreThanAvailable = D.queryAll('section div[id]', 5);
        assert.ok(_.isList(moreThanAvailable), 'should be a list');
        assert.equal(moreThanAvailable.length, 3, 'should only queryAll three');
    });

    test("queryAll nonexistent, get empty array", function(assert) {
        assert.ok(!D.queryAll("#idontexist").length, "empty array");
    });

    test("element queryAll", function(assert) {
        assert.strictEqual(D.queryAll('section').queryAll("div").length, 5, "should be five divs, not seven");
    });

    test("list queryAll", function(assert) {
        assert.strictEqual(D.queryAll('section div').queryAll('span').length, 1, "should get one span");
    });

    module("only()");

    test("by index", function(assert) {
        var divs = D.queryAll('section > div');
        assert.strictEqual(divs.only(2)[0], divs[2], 'get 3rd one');
        assert.strictEqual(divs.only(-1)[0], divs[divs.length-1], 'get last one');
    });

    test("by slice", function(assert) {
        var divs = D.queryAll('section > div');
        assert.strictEqual(divs.only(1,4).length, 3, "got sublist of proper length");
    });

    test("by selector", function(assert) {
        var divs = D.queryAll('section > div');
        assert.strictEqual(divs.only('#first')[0], D.queryAll('#first')[0], 'got #first');
    });

    test("by each=value", function(assert) {
        var divs = D.queryAll('section > div');
        assert.strictEqual(divs.only('id','last')[0], D.getElementById('last'), 'got #last');
    });

    test("by function", function(assert) {
        var divs = D.queryAll('section > div'),
            odds = function(n,i){ return i%2; };
        assert.deepEqual(divs.only(odds).each('tagName'), ['DIV','DIV'], "got two odd divs");
    });

    test('mixed node types by selector', function(assert) {
        var list = new X.List(),
            text = D.createTextNode('hello'),
            el = D.createElement('meta'),
            exclude = D.createElement('test');
        el.textContent = 'hello';
        text.meta = true;
        list.add(el, text, exclude);
        assert.equal(list.length, 3);
        if (!('meta' in exclude)) {
            exclude.meta = true;
        }
        assert.ok(exclude.meta, 'should have some meta property');
        list = list.only('meta');
        assert.equal(list.length, 2);
    });

    module("not()");

    test("not is inverse of only", function(assert) {
        var list = new X.List(D.createElement('div'),
                                D.createElement('span'),
                                D.createElement('span'));
        assert.deepEqual(list.not('div'), list.only('span'));
        assert.deepEqual(list.not(-1), list.only(0,2));
        assert.deepEqual(list.not(0,2), list.only(2));
        assert.deepEqual(list.not('tagName', 'SPAN'), list.only('tagName', 'DIV'));
    });

    test("not(node)", function(assert) {
        var list = new X.List(D.createTextNode('text'),
                              D.createElement('span'),
                              D.createElement('span'));
        assert.deepEqual(list.not(list[0]), list.only('span'));
        assert.deepEqual(list.not(list[2]), list.only(0,2));
    });

    module('all()');

    test("parents", function(assert) {
        var divs = D.queryAll('section > div'),
            parents = divs.all('parentElement');
        assert.equal(parents.length, 4);
    });

    test("next[ElementSibling], inclusive", function(assert) {
        _.alias.next = 'nextElementSibling';
        var div = D.query('#first'),
            siblings = div.all('next', true);
        assert.equal(siblings.length, 5);
        delete _.alias.next;
    });

    test("children, on multiple", function(assert) {
        var gps = D.getElementById('qunit-fixture').queryAll('aside,section');
        assert.equal(gps.length, 2);
        var desc = gps.all('children');
        assert.equal(desc.length, gps.queryAll('*').length);
    });

    test("function ctx/args", function(assert) {
        assert.expect(5);
        var list = D.body.all('parentElement', function(parentElement, list) {
            assert.strictEqual(this, D.body);
            assert.strictEqual(parentElement, D.html);
            assert.strictEqual(list.length, 0);
            assert.ok(list instanceof X.List);
        });
        assert.equal(list.length, 1);
    });

    test("function return values", function(assert) {
        var div = D.query('#first');
        var all = div.all('parentElement');

        assert.expect(all.length*2 + 3);
        var returnUndefined = div.all('parentElement', function(parentElement) {
            assert.ok(parentElement instanceof Node);
        });
        assert.deepEqual(returnUndefined, all, "undefined should not change collection");

        var returnNull = div.all('parentElement', function(parentElement) {
            assert.ok(parentElement);
            if (parentElement.tagName === 'HTML') {
                return null;
            }
        });
        assert.equal(returnNull.length+1, all.length, "shouldn't collect <html>");

        var allFirstText = new X.List(div.all('parentElement')
                                            .each('firstChild')
                                            .each('textContent'));
        var returnNode = div.all('parentElement', function(parentElement) {
            return parentElement.firstChild.textContent;
        });
        assert.deepEqual(returnNode, allFirstText);
    });

    module('farthest');

    test("farthest(parent*)", function(assert) {
        var div = D.query('#first');
        assert.equal(document.documentElement, div.farthest());
        assert.equal(document.documentElement, div.farthest('parentElement'));
        assert.equal(document, div.farthest('parentNode'));
    });

    test('farthest([prop, ]selector[, inclusive])', function(assert) {
        var div = D.query('#first');
        assert.equal(div, div.farthest('#first'));
        assert.equal(null, div.farthest('#first', false));
        assert.equal(document.body, div.farthest('body'));
        assert.equal(D.query('#last'), div.farthest('nextElementSibling'));
        assert.equal(D.query('#last'), div.farthest('nextSibling', 'div'));
    });

    test("farthest(alias)", function(assert) {
        var div = D.query('#first');
        _.alias.previous = 'previousElementSibling';
        _.alias.next = 'nextElementSibling';
        assert.equal(null, div.farthest('previous'));
        assert.equal(D.query('#last'), div.farthest('next'));
        delete _.alias.previous;
        delete _.alias.next;
    });

    test("farthest(nomatch)", function(assert) {
        var div = D.query('#first');
        assert.strictEqual(null, div.farthest('whatever'));
    });

    module('nearest');

    test("nearest(parent*)", function(assert) {
        var div = D.query('#first');
        assert.equal(div, div.nearest());
        assert.equal(div.parentElement, div.nearest('parentElement'));
        assert.equal(document, div.nearest('parentNode', function(node) {
            return !(node instanceof HTMLElement);
        }));
    });

    test('nearest([prop, ]selector[, inclusive])', function(assert) {
        var div = D.query('#first');
        assert.equal(div, div.nearest('#first'));
        assert.equal(null, div.nearest('#first', false));
        assert.equal(document.body, div.nearest('body'));
        assert.equal(D.query('#identity'), div.nearest('nextElementSibling'));
        assert.equal(div, div.nearest('nextSibling', true));
        assert.equal(div, div.nearest('nextSibling', 'div', true));
        assert.equal(D.query('#identity'), div.nearest('nextSibling', 'div'));
    });

    test("nearest(alias)", function(assert) {
        var div = D.query('#first');
        _.alias.previous = 'previousElementSibling';
        _.alias.next = 'nextElementSibling';
        assert.equal(null, div.nearest('previous'));
        assert.equal(D.query('#identity'), div.nearest('next'));
        delete _.alias.previous;
        delete _.alias.next;
    });

    test("nearest(nomatch)", function(assert) {
        var div = D.query('#first');
        assert.strictEqual(null, div.nearest('whatever'));
    });

    module('closest');

    test("closest(selector)", function(assert) {
        var div = D.query('#first');
        assert.equal(div, div.closest('#first'));
        assert.equal(document.body, div.closest('body,html'));
    });

}(document, QUnit.module, QUnit.test));

