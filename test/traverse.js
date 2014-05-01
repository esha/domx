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

    test("D.find", function() {
        equal(typeof D.find, "function", "D.find");
        equal(D.find('body')[0], document.body, "D.find('body')");
        equal(D.findOne('body'), document.body, "D.findOne('body')");
    });

    var _ = D._;
    module("D._");

    test("API", function() {
        equal(typeof Element.prototype.matches, "function", "Element.prototype.matches");
        equal(typeof _.traverse, "object", "_.traverse");
    });

    module('traverse DOM extensions');

    test("only()", function() {
        expect(_.lists.length);
        _.lists.forEach(function(_class) {
            equal(_class.prototype.only, _.traverse.only);
        });
    });

    test("find()", function() {
        var set = _.lists.concat(_.singles);
        expect(set.length);
        set.forEach(function(_class) {
            equal(_class.prototype.find, _.traverse.find);
        });
    });

    test("findOne()", function() {
        var set = _.lists.concat(_.singles);
        expect(set.length);
        set.forEach(function(_class) {
            equal(_class.prototype.findOne, _.traverse.findOne);
        });
    });

    module("find");

    test("find multiple, get array", function() {
        ok(_.isList(D.find("div")), "should be a list");
    });

    test("find one, get HTMLElement", function() {
        ok(D.findOne("#identity") instanceof HTMLElement, "should be an element");
    });

    test("find until count", function() {
        ok(D.findOne('section div[id]') instanceof HTMLElement, "should be a single element");

        var lessThanAvailable = D.find('section div[id]', 2);
        ok(_.isList(lessThanAvailable), 'should be a list');
        equal(lessThanAvailable.length, 2, 'should have only two');

        var moreThanAvailable = D.find('section div[id]', 5);
        ok(_.isList(moreThanAvailable), 'should be a list');
        equal(moreThanAvailable.length, 3, 'should only find three');
    });

    test("find nonexistent, get empty array", function() {
        ok(!D.find("#idontexist").length, "empty array");
    });

    test("element find", function() {
        strictEqual(D.find('section').find("div").length, 5, "should be five divs, not seven");
    });

    test("list find", function() {
        strictEqual(D.find('section div').find('span').length, 1, "should get one span");
    });

    module("only()");

    test("by slice, on multiple", function() {
        var divs = D.find('section > div');
        strictEqual(divs.only(-1)[0], divs[divs.length-1], 'get last one');
        strictEqual(divs.only(1,4).length, 3, "got sublist of proper length");
    });

    test("by selector, on multiple", function() {
        var divs = D.find('section > div');
        strictEqual(divs.only('#first')[0], D.find('#first')[0], 'got #first');
    });

    test("by function, on multiple", function() {
        var odds = function(n,i){ return i%2; };
        strictEqual(D.find('section > div').only(odds).length, 2, "got two odd divs");
    });

}(document));

