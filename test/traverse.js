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
        strictEqual(divs.only(2), divs[2], 'get 3rd one');
        strictEqual(divs.only(-1), divs[divs.length-1], 'get last one');
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

}(document));

