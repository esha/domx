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

    test('D._', function() {
        ok(D._, "D._ should be present");
    });

    test("D is for document", function() {
        strictEqual(D, document, "D is the document node");
    });

    var _ = D._;
    module("core API");

    test("_.", function() {
        equal(typeof _.version, "string", "_.version");
        strictEqual(_.slice, Array.prototype.slice, "_.slice");
        equal(typeof _.isList, "function", "_.isList");
        equal(Array.isArray(_.lists), true, "_.lists");
        equal(Array.isArray(_.nodes), true, "_.nodes");
        equal(typeof _.fn, "function", "_.fn");
        equal(typeof _.define, "function", "_.define");
        equal(typeof _.resolve, "function", "_.resolve");
        equal(typeof _.fill, "function", "_.fill");
    });

    test("D.extend", function() {
        equal(typeof D.extend, "function", "document.extend");
    });

    test("each()", function() {
        var set = _.lists.concat(_.nodes);
        expect(set.length);
        set.forEach(function(_class) {
            ok(_class.prototype.each, _class.name+'.prototype.each');
        });
    });

    test("toArray()", function() {
        var set = _.lists.concat(_.nodes);
        expect(set.length);
        set.forEach(function(_class) {
            ok(_class.prototype.toArray, _class.name+'.prototype.toArray');
        });
    });

    test("_.isList", function() {
        ok(_.isList([]), "array is list");
        ok(_.isList(new _.List()), "_.List is list");
        ok(_.isList(arguments), "arguments is list");
        ok(_.isList(D.querySelectorAll('body')), "NodeList is list");
        ok(_.isList(D.body.children), "HTMLCollection is list");
        ok(_.isList({length:0}), "user-defined list is list");

        ok(!_.isList({}), "user object must have length");
        ok(!_.isList(_.isList), "function is not list");
        ok(!_.isList(undefined), "undefined is not list");
        ok(!_.isList(null), "null is not list");
        ok(!_.isList(1), "number is not list");
        ok(!_.isList('foo'), "string is not list");
        ok(!_.isList(D.createTextNode('foo')), "text node is not list");
    });

    test('_.List', function() {
        var list = new _.List();
        equal(list.length, 0);
        ok(list instanceof _.List);

        list = new _.List([1,2]);
        equal(list.length, 2);
        equal(list[0], 1);
        equal(list[1], 2);

        list.add([[3,4],5]);
        equal(list.length, 5);

        list.add(null);
        list.add(undefined);
        equal(list.length, 5);

        equal(list.indexOf(1), 0);
        equal(list.indexOf(0), -1);

        list = new _.List();
        list.limit = 1;
        list.add(1,2);
        equal(list.length, 1);
        equal(list[1], undefined);
    });

    test("_.define", function() {
        var o = {has:true};
        _.define(o, 'has', false);
        equal(o.has, true, 'should not redefine existing properties');

        _.define(o, 'one', 1);
        strictEqual(o.one, 1);
        ok(o.hasOwnProperty('one'));

        delete o.one;
        equal(o.one, undefined, 'should be configurable');

        var count = 0;
        _.define(o, 'getter', {get: function(){ return count++; }});
        equal(o.getter, 0);
        equal(o.getter, 1);

        for (var key in o) {
            notEqual(key, 'one', 'defined props should not be enumerable');
        }
    });

    module("each()");

    test("for single grandkid", 3, function() {
        var self = D.querySelector('section'),
        ret = self.each(function(section) {
            ok(section instanceof HTMLElement, "still an element");
            strictEqual(section, self, "is the one we called each() on");
        });
        ok(ret === self, 'returned this');
    });

    test("for multiple grandkids", function() {
        var pdiv, pi = -1,
            self = D.querySelectorAll('section > div'),
        ret = self.each(function(div, i, arr) {
            notEqual(pdiv, div, 'should have new div');
            strictEqual(i, pi+1, 'index one less');
            ok(arr, 'array as third arg');
            ok(div instanceof HTMLElement, 'have an element');
            pi = i;
            pdiv = div;
        });
        ok(ret === self, 'returned this');
    });

    test("property get", 5, function() {
        var divs = D.querySelectorAll('section > div'),
            ids = divs.each('id');
        divs.each(function(div, i) {
            strictEqual(div.id, ids[i], "matching id");
        });
    });

    test("property set", 11, function() {
        var divs = D.querySelectorAll('section > div'),
            ret = divs.each('className', 'foo');
        strictEqual(divs, ret, 'should be same list');
        divs.each(function(div) {
            strictEqual(div.className, 'foo', 'className should be foo');
        });
        divs.each('className', '');
        divs.each(function(div) {
            ok(!div.className, 'className should be empty again');
        });
    });

    test("property function", 8, function() {
        var ends = D.querySelectorAll('#first,#last'),
            clones = ends.each('cloneNode');
        notEqual(ends, clones, 'should not return self');
        ok(clones.each, 'clone list is D-ified');
        clones.each(function(clone) {
            ok(!clone.parentNode, 'clones have no parents');
        });
        ends.each(function(end, i) {
            strictEqual(end.tagName, clones[i].tagName, 'same tags');
            strictEqual(end.id, clones[i].id, 'same id');
        });
    });

    test("nested property get", function() {
        var divs = D.querySelectorAll('section > div'),
            strings = divs.each('parentNode.tagName');
        strictEqual(strings.length, divs.length, 'got a parent tag for each div');
        strings = strings.filter(function(s, i){ return strings.indexOf(s) === i; });
        strictEqual(strings.length, 1, 'all have the same parent');
        strictEqual(strings[0], 'SECTION', 'parent tagName is SECTION');
    });

    test("attr that starts like nested property", function() {
        var divs = D.querySelectorAll('section > div'),
            key = 'style.not-really',
            count = divs[0].attributes.length;
        divs.each(key, 'bar');
        var attrs = divs.each(key);
        strictEqual(attrs.length, divs.length, 'attr per div');
        strictEqual(attrs[0], 'bar', 'is bar');
        ok(!divs[0].style[key], 'no such style');
        ok(divs[0].attributes.length, count+1, 'has new attribute');
        divs.each(key, null);
        strictEqual(divs[0].attributes.length, count, 'attr removed');
    });

    test("nested property set", function() {
        var first = D.querySelector('#first');
        first.each('parentNode.id', 'momma');
        strictEqual(D.querySelector('section').id, 'momma');
    });

    test("nested property function with arg", function() {
        var divs = D.querySelectorAll('section > div'),
            ret = divs.each('classList.add', 'bar');// fails in IE9, i think
        strictEqual(ret, divs, 'should return self');
        divs.each(function(div) {
            strictEqual(div.className, 'bar', 'should have "bar" class');
        });
        divs.each('classList.remove','bar');
    });

    test("property value/argument index replacement", 6, function() {
        var divs = D.querySelectorAll('section > div'),
            ret = divs.each('textContent', '#${i} is what it is');
        strictEqual(ret, divs, 'should return self');
        divs.each(function(div, i) {
            strictEqual(div.textContent, '#'+i+' is what it is', 'text should include proper index');
        });
        divs.each('textContent', '');
    });

    test("property value/argument function", 21, function() {
        var divs = D.querySelectorAll('section > div'),
            fn = function(el, i, args) {
                if (args) {
                    ok('nodeType' in el, 'got node as first argument');
                    ok(typeof i === "number", 'got index as second argument');
                    deepEqual(args, [fn], 'third argument is array containing this function');
                }
                return '#'+i+' has id: '+el.id;
            },
            ret = divs.each('textContent', fn);
        strictEqual(ret, divs, 'should return self');
        divs.each(function(div, i) {
            strictEqual(div.textContent, fn(div, i), 'text content has text made from index and an element property');
        });
        divs.each('textContent', '');
    });

    test("aliased property", function() {
        D._.resolve['-class'] = 'classList.remove';
        var divs = D.querySelectorAll('section > div').each('classList.add','bar');
        divs.each(function(el) {
            ok(el.className.indexOf('bar') >= 0, 'have class bar');// fails in IE9
        });
        var    ret = divs.each('-class', 'bar');
        strictEqual(ret, divs, 'should return self');
        divs.each(function(el) {
            ok(el.className.indexOf('bar') < 0, 'don\'t have class bar');
        });
    });

    test("non-chaining each function on list", function() {
        var divs = D.querySelectorAll('section > div'),
            results = divs.each(function(div) {
                if (div.id) {
                    return { id: div.id };
                }
            });
        notEqual(results, divs, 'should not get self back');
        strictEqual(results.length, 3, 'only three divs with ids');
    });

    test("non-chaining each function on element", function() {
        var div = D.querySelector('#identity'),
            result = div.each(function(div) {
                return 'Id is: '+div.id;
            });
        strictEqual(result, 'Id is: identity', 'result should not be array');
    });

}(document));

