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
    module("D");

    test("D.queryAll", function() {
        equal(typeof D.queryAll, "function", "D.queryAll");
        equal(D.queryAll('body')[0], document.body, "D.queryAll('body')");
        equal(D.query('body'), document.body, "D.query('body')");
    });

    var _ = D._;

    module('traverse DOM extensions');

    test("_.parents", function() {
        equal(Array.isArray(_.parents), true, "_.parents");
    });

    test("matches", function() {
        equal(typeof Element.prototype.matches, "function", "Element.prototype.matches");
    });

    test("only()", function() {
        expect(_.lists.length);
        _.lists.forEach(function(_class) {
            ok(_class.prototype.only, _class.name+'.prototype.only');
        });
    });

    test("not()", function() {
        expect(_.lists.length);
        _.lists.forEach(function(_class) {
            ok(_class.prototype.not, _class.name+'.prototype.not');
        });
    });

    test("all()", function() {
        var set = _.lists.concat([Node]);
        expect(set.length);
        set.forEach(function(_class) {
            ok(_class.prototype.all, _class.name+'.prototype.all');
        });
    });

    test("queryAll()", function() {
        var set = _.lists.concat(_.parents);
        expect(set.length);
        set.forEach(function(_class) {
            ok((_class.prototype||_class).queryAll, _class.name+'.prototype.queryAll');
        });
    });

    test("query()", function() {
        var set = _.lists.concat(_.parents);
        expect(set.length);
        set.forEach(function(_class) {
            ok((_class.prototype||_class).query, _class.name+'.prototype.query');
        });
    });

    module("queryAll");

    test("queryAll multiple, get array", function() {
        ok(_.isList(D.queryAll("div")), "should be a list");
    });

    test("queryAll one, get HTMLElement", function() {
        ok(D.query("#identity") instanceof HTMLElement, "should be an element");
    });

    test("queryAll until count", function() {
        ok(D.query('section div[id]') instanceof HTMLElement, "should be a single element");

        var lessThanAvailable = D.queryAll('section div[id]', 2);
        ok(_.isList(lessThanAvailable), 'should be a list');
        equal(lessThanAvailable.length, 2, 'should have only two');

        var moreThanAvailable = D.queryAll('section div[id]', 5);
        ok(_.isList(moreThanAvailable), 'should be a list');
        equal(moreThanAvailable.length, 3, 'should only queryAll three');
    });

    test("queryAll nonexistent, get empty array", function() {
        ok(!D.queryAll("#idontexist").length, "empty array");
    });

    test("element queryAll", function() {
        strictEqual(D.queryAll('section').queryAll("div").length, 5, "should be five divs, not seven");
    });

    test("list queryAll", function() {
        strictEqual(D.queryAll('section div').queryAll('span').length, 1, "should get one span");
    });

    module("only()");

    test("by index", function() {
        var divs = D.queryAll('section > div');
        strictEqual(divs.only(2)[0], divs[2], 'get 3rd one');
        strictEqual(divs.only(-1)[0], divs[divs.length-1], 'get last one');
    });

    test("by slice", function() {
        var divs = D.queryAll('section > div');
        strictEqual(divs.only(1,4).length, 3, "got sublist of proper length");
    });

    test("by selector", function() {
        var divs = D.queryAll('section > div');
        strictEqual(divs.only('#first')[0], D.queryAll('#first')[0], 'got #first');
    });

    test("by each=value", function() {
        var divs = D.queryAll('section > div');
        strictEqual(divs.only('id','last')[0], D.getElementById('last'), 'got #last');
    });

    test("by function", function() {
        var divs = D.queryAll('section > div'),
            odds = function(n,i){ return i%2; };
        deepEqual(divs.only(odds).each('tagName'), ['DIV','DIV'], "got two odd divs");
    });

    test('mixed node types by selector', function() {
        var list = new DOMxList(),
            text = D.createTextNode('hello'),
            el = D.createElement('meta'),
            exclude = D.createElement('test');
        el.textContent = 'hello';
        text.meta = true;
        list.add(el, text, exclude);
        equal(list.length, 3);
        if (!('meta' in exclude)) {
            exclude.meta = true;
        }
        ok(exclude.meta, 'should have some meta property');
        list = list.only('meta');
        equal(list.length, 2);
    });

    module("not()");

    test("not is inverse of only", function() {
        var list = new DOMxList(D.createElement('div'),
                                D.createElement('span'),
                                D.createElement('span'));
        deepEqual(list.not('div'), list.only('span'));
        deepEqual(list.not(-1), list.only(0,2));
        deepEqual(list.not(0,2), list.only(2));
        deepEqual(list.not('tagName', 'SPAN'), list.only('tagName', 'DIV'));
    });

    module('all()');

    test("parents", function() {
        var divs = D.queryAll('section > div'),
            parents = divs.all('parentElement');
        equal(parents.length, 4);
    });

    test("next[ElementSibling], inclusive", function() {
        _.resolve.next = 'nextElementSibling';
        var div = D.query('#first'),
            siblings = div.all('next', true);
        equal(siblings.length, 5);
    });

    test("children, on multiple", function() {
        var gps = D.getElementById('qunit-fixture').queryAll('aside,section');
        equal(gps.length, 2);
        var desc = gps.all('children');
        equal(desc.length, gps.queryAll('*').length);
    });

    test("function ctx/args", function() {
        expect(5);
        var list = D.body.all('parentElement', function(parentElement, list) {
            strictEqual(this, D.body);
            strictEqual(parentElement, D.html);
            strictEqual(list.length, 0);
            ok(list instanceof DOMxList);
        });
        equal(list.length, 1);
    });

    test("function return values", function() {
        var div = D.query('#first');
        var all = div.all('parentElement');

        expect(all.length*2 + 3);
        var returnUndefined = div.all('parentElement', function(parentElement) {
            ok(parentElement instanceof Node);
        });
        deepEqual(returnUndefined, all, "undefined should not change collection");

        var returnNull = div.all('parentElement', function(parentElement) {
            ok(parentElement);
            if (parentElement.tagName === 'HTML') {
                return null;
            }
        });
        equal(returnNull.length+1, all.length, "shouldn't collect <html>");

        var allFirstText = new DOMxList(div.all('parentElement')
                                            .each('firstChild')
                                            .each('textContent'));
        var returnNode = div.all('parentElement', function(parentElement) {
            return parentElement.firstChild.textContent;
        });
        deepEqual(returnNode, allFirstText);
    });

    module('farthest');

    test("farthest(parent*)", function() {
        var div = D.query('#first');
        equal(document.documentElement, div.farthest());
        equal(document.documentElement, div.farthest('parentElement'));
        equal(document, div.farthest('parentNode'));
    });

    test('farthest([prop, ]selector[, inclusive])', function() {
        var div = D.query('#first');
        equal(div, div.farthest('#first'));
        equal(null, div.farthest('#first', false));
        equal(document.body, div.farthest('body'));
        equal(D.query('#last'), div.farthest('nextElementSibling'));
        equal(D.query('#last'), div.farthest('nextSibling', 'div'));
    });

    test("farthest(alias)", function() {
        var div = D.query('#first');
        _.resolve.previous = 'previousElementSibling';
        _.resolve.next = 'nextElementSibling';
        equal(null, div.farthest('previous'));
        equal(D.query('#last'), div.farthest('next'));
        delete _.resolve.previous;
        delete _.resolve.next;
    });

    test("farthest(nomatch)", function() {
        var div = D.query('#first');
        strictEqual(null, div.farthest('whatever'));
    });

    module('closest');

    test("closest(parent*)", function() {
        var div = D.query('#first');
        equal(div, div.closest());
        equal(div.parentElement, div.closest('parentElement'));
        equal(document, div.closest('parentNode', function(node) {
            return !(node instanceof HTMLElement);
        }));
    });

    test('closest([prop, ]selector[, inclusive])', function() {
        var div = D.query('#first');
        equal(div, div.closest('#first'));
        equal(null, div.closest('#first', false));
        equal(document.body, div.closest('body'));
        equal(D.query('#identity'), div.closest('nextElementSibling'));
        equal(div, div.closest('nextSibling', true));
        equal(div, div.closest('nextSibling', 'div', true));
        equal(D.query('#identity'), div.closest('nextSibling', 'div'));
    });

    test("closest(alias)", function() {
        var div = D.query('#first');
        _.resolve.previous = 'previousElementSibling';
        _.resolve.next = 'nextElementSibling';
        equal(null, div.closest('previous'));
        equal(D.query('#identity'), div.closest('next'));
        delete _.resolve.previous;
        delete _.resolve.next;
    });

    test("closest(nomatch)", function() {
        var div = D.query('#first');
        strictEqual(null, div.closest('whatever'));
    });

}(document));

