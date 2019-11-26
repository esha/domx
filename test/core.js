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

    test('D.x', function(assert) {
        assert.ok(D.x, "document.x should be present");
    });

    test("D is for document", function(assert) {
        assert.strictEqual(D, document, "D is the document node");
    });

    var X = D.x,
        _ = X._;
    module("core API");

    test("x.", function(assert) {
        assert.equal(typeof X.version, "string", "X.version");
        assert.equal(typeof X._, "object", "X._");
        assert.equal(Array.isArray(X.parents), true, "X.lists");
        assert.equal(Array.isArray(X.lists), true, "X.lists");
        assert.equal(Array.isArray(X.nodes), true, "X.nodes");
        assert.equal(typeof X.alias, "function", "X.alias");
        assert.equal(typeof X.add, "function", "X.add");
    });

    test("_.", function(assert) {
        assert.strictEqual(_.slice, Array.prototype.slice, "_.slice");
        assert.equal(typeof _.isList, "function", "_.isList");
        assert.equal(typeof _.define, "function", "_.define");
        assert.equal(typeof _.defprop, "function", "_.defprop");
        assert.equal(typeof _.resolve, "function", "_.resolve");
        assert.equal(typeof _.fill, "function", "_.fill");
        assert.equal(typeof _.alias, "object", "_.alias");
    });

    test("document.x.add", function(assert) {
        assert.expect(X.lists.length*2 + 9);
        assert.equal(typeof X.add, "function", "document.extend");

        var fn = function() {
            assert.ok(!_.isList(this));
            return new X.List(this);
        };

        X.add('core_test', fn);
        assert.equal(Element.prototype.core_test, fn);
        X.lists.forEach(function(_class) {
            assert.equal(typeof _class.prototype.core_test, "function");
            assert.equal(_class.prototype.core_test.name, 'listFn');
        });

        var ret = D.body.core_test();
        assert.equal(ret.length, 1);

        ret = D.html.children.core_test();
        assert.equal(ret.length, 2);

        X.add('core_test', function(){ return true; }, true);
        assert.strictEqual(D.body.core_test(), true, 'overridden core_test');
        assert.deepEqual(D.html.children.core_test(), [true,true], 'overridden core_test');
    });

    test("each()", function(assert) {
        var set = X.lists.concat(X.nodes);
        assert.expect(set.length);
        set.forEach(function(_class) {
            assert.ok(_class.prototype.each, _class.name+'.prototype.each');
        });
    });

    test("toArray()", function(assert) {
        var set = X.lists.concat(X.nodes);
        assert.expect(set.length);
        set.forEach(function(_class) {
            assert.ok(_class.prototype.toArray, _class.name+'.prototype.toArray');
        });
    });

    test("_.isList", function(assert) {
        assert.ok(_.isList([]), "array is list");
        assert.ok(_.isList(new X.List()), "X.List is list");
        assert.ok(_.isList(arguments), "arguments is list");
        assert.ok(_.isList(D.querySelectorAll('body')), "NodeList is list");
        assert.ok(_.isList(D.body.children), "HTMLCollection is list");
        assert.ok(_.isList({length:0}), "user-defined list is list");

        assert.ok(!_.isList({}), "user object must have length");
        assert.ok(!_.isList(_.isList), "function is not list");
        assert.ok(!_.isList(undefined), "undefined is not list");
        assert.ok(!_.isList(null), "null is not list");
        assert.ok(!_.isList(1), "number is not list");
        assert.ok(!_.isList('foo'), "string is not list");
        assert.ok(!_.isList(D.createTextNode('foo')), "text node is not list");
    });

    test('X.List', function(assert) {
        var list = new X.List();
        assert.equal(list.length, 0);
        assert.ok(list instanceof X.List);

        list = new X.List([1,2]);
        assert.equal(list.length, 2);
        assert.equal(list[0], 1);
        assert.equal(list[1], 2);

        assert.equal(list.add([[3,4],5]), 3, "should add three");
        assert.equal(list.length, 5);

        assert.equal(list.add(null), 0);
        assert.strictEqual(list.add(undefined), 0);
        assert.equal(list.length, 5);

        assert.equal(list.indexOf(1), 0);
        assert.equal(list.indexOf(0), -1);

        list = new X.List();
        list.limit = 1;
        assert.equal(list.add(1,2), 1, "should add just one");
        assert.equal(list.length, 1);
        assert.equal(list[1], undefined);
    });

    test("_.defprop", function(assert) {
        var o = {has:true};
        _.defprop(o, 'has', false);
        assert.equal(o.has, true, 'should not redefine existing properties');

        _.defprop(o, 'one', 1);
        assert.strictEqual(o.one, 1);
        assert.ok(o.hasOwnProperty('one'));

        delete o.one;
        assert.equal(o.one, undefined, 'should be configurable');

        var count = 0;
        _.defprop(o, 'getter', {get: function(){ return count++; }});
        assert.equal(o.getter, 0);
        assert.equal(o.getter, 1);

        for (var key in o) {
            assert.notEqual(key, 'one', 'defined props should not be enumerable');
        }
    });

    module("each()");

    test("for single grandkid", function(assert) {
        assert.expect(3);
        var self = D.querySelector('section'),
        ret = self.each(function(section) {
            assert.ok(section instanceof HTMLElement, "still an element");
            assert.strictEqual(section, self, "is the one we called each() on");
        });
        assert.ok(ret === self, 'returned this');
    });

    test("for multiple grandkids", function(assert) {
        var pdiv, pi = -1,
            self = D.querySelectorAll('section > div'),
        ret = self.each(function(div, i, arr) {
            assert.notEqual(pdiv, div, 'should have new div');
            assert.strictEqual(i, pi+1, 'index one less');
            assert.ok(arr, 'array as third arg');
            assert.ok(div instanceof HTMLElement, 'have an element');
            pi = i;
            pdiv = div;
        });
        assert.ok(ret === self, 'returned this');
    });

    test("property get", function(assert) {
        assert.expect(5);
        var divs = D.querySelectorAll('section > div'),
            ids = divs.each('id');
        divs.each(function(div, i) {
            assert.strictEqual(div.id, ids[i], "matching id");
        });
    });

    test("property set", function(assert) {
        assert.expect(11);
        var divs = D.querySelectorAll('section > div'),
            ret = divs.each('className', 'foo');
        assert.strictEqual(divs, ret, 'should be same list');
        divs.each(function(div) {
            assert.strictEqual(div.className, 'foo', 'className should be foo');
        });
        divs.each('className', '');
        divs.each(function(div) {
            assert.ok(!div.className, 'className should be empty again');
        });
    });

    test("property function", function(assert) {
        assert.expect(8);
        var ends = D.querySelectorAll('#first,#last'),
            clones = ends.each('cloneNode');
        assert.notEqual(ends, clones, 'should not return self');
        assert.ok(clones.each, 'clone list is D-ified');
        clones.each(function(clone) {
            assert.ok(!clone.parentNode, 'clones have no parents');
        });
        ends.each(function(end, i) {
            assert.strictEqual(end.tagName, clones[i].tagName, 'same tags');
            assert.strictEqual(end.id, clones[i].id, 'same id');
        });
    });

    test("nested property get", function(assert) {
        var divs = D.querySelectorAll('section > div'),
            strings = divs.each('parentNode.tagName');
        assert.strictEqual(strings.length, divs.length, 'got a parent tag for each div');
        strings = strings.filter(function(s, i){ return strings.indexOf(s) === i; });
        assert.strictEqual(strings.length, 1, 'all have the same parent');
        assert.strictEqual(strings[0], 'SECTION', 'parent tagName is SECTION');
    });

    test("attr that starts like nested property", function(assert) {
        var divs = D.querySelectorAll('section > div'),
            key = 'style.not-really',
            count = divs[0].attributes.length;
        divs.each(key, 'bar');
        var attrs = divs.each(key);
        assert.strictEqual(attrs.length, divs.length, 'attr per div');
        assert.strictEqual(attrs[0], 'bar', 'is bar');
        assert.ok(!divs[0].style[key], 'no such style');
        assert.ok(divs[0].attributes.length, count+1, 'has new attribute');
        divs.each(key, null);
        assert.strictEqual(divs[0].attributes.length, count, 'attr removed');
    });

    test("nested property set", function(assert) {
        var first = D.querySelector('#first');
        first.each('parentNode.id', 'momma');
        assert.strictEqual(D.querySelector('section').id, 'momma');
    });

    test("nested property function with arg", function(assert) {
        var divs = D.querySelectorAll('section > div'),
            ret = divs.each('classList.add', 'bar');// fails in IE9, i think
        assert.strictEqual(ret, divs, 'should return self');
        divs.each(function(div) {
            assert.strictEqual(div.className, 'bar', 'should have "bar" class');
        });
        divs.each('classList.remove','bar');
    });

    test("property value/argument index replacement", function(assert) {
        assert.expect(6);
        var divs = D.querySelectorAll('section > div'),
            ret = divs.each('textContent', '#${i} is what it is');
        assert.strictEqual(ret, divs, 'should return self');
        divs.each(function(div, i) {
            assert.strictEqual(div.textContent, '#'+i+' is what it is', 'text should include proper index');
        });
        divs.each('textContent', '');
    });

    test("property value/argument function", function(assert) {
        assert.expect(21);
        var divs = D.querySelectorAll('section > div'),
            fn = function(el, i, args) {
                if (args) {
                    assert.ok('nodeType' in el, 'got node as first argument');
                    assert.ok(typeof i === "number", 'got index as second argument');
                    assert.deepEqual(args, [fn], 'third argument is array containing this function');
                }
                return '#'+i+' has id: '+el.id;
            },
            ret = divs.each('textContent', fn);
        assert.strictEqual(ret, divs, 'should return self');
        divs.each(function(div, i) {
            assert.strictEqual(div.textContent, fn(div, i), 'text content has text made from index and an element property');
        });
        divs.each('textContent', '');
    });

    test("aliased property", function(assert) {
        D.x.alias('-class', 'classList.remove');
        var divs = D.querySelectorAll('section > div').each('classList.add','bar');
        divs.each(function(el) {
            assert.ok(el.className.indexOf('bar') >= 0, 'have class bar');
        });
        var    ret = divs.each('-class', 'bar');
        assert.strictEqual(ret, divs, 'should return self');
        divs.each(function(el) {
            assert.ok(el.className.indexOf('bar') < 0, 'don\'t have class bar');
        });
    });

    test("alias group", function(assert) {
        D.x.alias({
            '+class': 'classList.add',
            '!class': 'classList.toggle'
        });
        var divs = D.querySelectorAll('section > div').each('+class','bar');
        divs.each(function(el) {
            assert.ok(el.className.indexOf('bar') >= 0, 'have class bar');
        });
        divs.each('!class', 'bar');
        divs.each(function(el) {
            assert.ok(el.className.indexOf('bar') < 0, 'don\'t have class bar');
        });
    });

    test("non-chaining each function on list", function(assert) {
        var divs = D.querySelectorAll('section > div'),
            results = divs.each(function(div) {
                if (div.id) {
                    return { id: div.id };
                }
            });
        assert.notEqual(results, divs, 'should not get self back');
        assert.strictEqual(results.length, 3, 'only three divs with ids');
    });

    test("non-chaining each function on element", function(assert) {
        var div = D.querySelector('#identity'),
            result = div.each(function(div) {
                return 'Id is: '+div.id;
            });
        assert.strictEqual(result, 'Id is: identity', 'result should not be array');
    });

}(document, QUnit.module, QUnit.test));

