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

	test('D', function() {
		ok(D, 'D should be present');
	});

	test('_', function() {
		ok(D._, "D._ should be present");
	});

	test('ify', function() {
		D.html.body.insertAdjacentHTML('beforeend', '<section id="ify"><a></a><a></a></section>');
		var el = document.querySelector('#ify'),
			els = document.querySelectorAll('#ify a');
		ok(!el.each, 'not Dified yet');
		ok(!els.each, 'not Dified yet');
		el = D.ify(el);
		els = D.ify(els);
		ok(el.each, 'Dified now');
		ok(els.each, 'Dified now');
		el.remove();
	});

	test("D is the root", function() {
		strictEqual(D, document.documentElement, "D is the root document element");
	});

	module("traversal");

	test("children", 2, function() {
		ok(D.html.body, "body");
		ok(D.head, "head");
	});

	test("single grandkid is HTMLElement", 2, function() {
		ok(D.html.body.section, "got to grandkid");
		ok(D.html.body.section instanceof HTMLElement, "it's an element");
	});

	test("multiple grandkids gets an array", 2, function() {
		ok(D.html.body.section.div, "got multiple");
		ok(D.html.body.section.div instanceof Array, "as an array");
	});

	test("traverse kids of first item in list", function() {
		var div = D.html.body.section.div;
		ok(div instanceof Array, "array of divs");
		ok(div.span, "got span child of first div in list");
		strictEqual(div.span.parentNode, div[0], "double check parent's identity");
	});

	test("grandkids come descending order", function() {
		var div = D.html.body.section.div;
		ok(div[0].id === "first" && div[div.length - 1].id === "last", "Order is descending");
	});

	module("each()");

	test("for single grandkid", 3, function() {
		var self = D.html.body.section,
		ret = self.each(function(section) {
			ok(section instanceof HTMLElement, "still an element");
			strictEqual(section, self, "is the one we called each() on");
		});
		ok(ret === self, 'returned this');
	});

	test("for multiple grandkids", function() {
		var pdiv, pi = -1,
			self = D.html.body.section.div,
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
		var divs = D.html.body.section.div,
			ids = divs.each('id');
		divs.each(function(div, i) {
			strictEqual(div.id, ids[i], "matching id");
		});
	});

	test("property set", 11, function() {
		var divs = D.html.body.section.div,
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
		var ends = D.query('#first,#last'),
			clones = ends.each('cloneNode');
		notEqual(ends, clones, 'should not return self');
		ok(clones.each, 'clone list is D-ified');
		clones.forEach(function(clone) {
			ok(!clone.parentNode, 'clones have no parents');
		});
		ends.each(function(end, i) {
			strictEqual(end.tagName, clones[i].tagName, 'same tags');
			strictEqual(end.id, clones[i].id, 'same id');
		});
	});

	test("nested property get", function() {
		var divs = D.html.body.section.div,
			strings = divs.each('parentNode.tagName');
		strictEqual(strings.length, divs.length, 'got a parent tag for each div');
		strings = strings.filter(function(s, i){ return strings.indexOf(s) === i; });
		strictEqual(strings.length, 1, 'all have the same parent');
		strictEqual(strings[0], 'SECTION', 'parent tagName is SECTION');
	});

	test("attr that starts like nested property", function() {
		var divs = D.html.body.section.div,
			key = 'style.not-really',
			count = divs.only(0).attributes.length;
		divs.each(key, 'bar');
		var attrs = divs.each(key);
		strictEqual(attrs.length, divs.length, 'attr per div');
		strictEqual(attrs[0], 'bar', 'is bar');
		ok(!divs[0].style[key], 'no such style');
		ok(divs.only(0).attributes.length, count+1, 'has new attribute');
		divs.each(key, null);
		strictEqual(divs[0].attributes.length, count, 'attr removed');
	});

	test("nested property set", function() {
		var first = D.query('#first');
		first.each('parentNode.id', 'momma');
		strictEqual(D.html.body.section.id, 'momma');
	});

	test("nested property function with arg", function() {
		var divs = D.html.body.section.div,
			ret = divs.each('classList.add', 'bar');// fails in IE9, i think
		strictEqual(ret, divs, 'should return self');
		divs.each(function(div) {
			strictEqual(div.className, 'bar', 'should have "bar" class');
		});
		divs.each('classList.remove','bar');
	});

	test("property value/argument index replacement", 6, function() {
		var divs = D.html.body.section.div,
			ret = divs.each('textContent', '#${i} is what it is');
		strictEqual(ret, divs, 'should return self');
		divs.each(function(div, i) {
			strictEqual(div.textContent, '#'+i+' is what it is', 'text should include proper index');
		});
		divs.each('textContent', '');
	});

	test("property value/argument function", 21, function() {
		var divs = D.html.body.section.div,
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
		var divs = D.html.body.section.div.each('classList.add','bar');
		divs.each(function(el) {
			ok(el.className.indexOf('bar') >= 0, 'have class bar');
		});
		var	ret = divs.each('-class', 'bar');
		strictEqual(ret, divs, 'should return self');
		divs.each(function(el) {
			ok(el.className.indexOf('bar') < 0, 'don\'t have class bar');
		});
	});

	test("non-chaining each function on list", function() {
		var divs = D.html.body.section.div,
			results = divs.each(function(div) {
				if (div.id) {
					return { id: div.id };
				}
			});
		notEqual(results, divs, 'should not get self back');
		strictEqual(results.length, 3, 'only three divs with ids');
	});

	test("non-chaining each function on element", function() {
		var div = D.query('#identity'),
			result = div.each(function(div) {
				return 'Id is: '+div.id;
			});
		strictEqual(result[0], 'Id is: identity', 'result should still be array');
	});

	module("only()");

	test("by slice, on one", function() {
		var section = D.html.body.section;
		strictEqual(section.only(0), section, "self for 0");
		ok(!section.only(1).length, 'empty array for bad index');
	});

	test("by selector, on one", function() {
		var section = D.html.body.section;
		strictEqual(section.only('.foo'), section, "self for .foo");
		ok(!section.only('#first').length, 'empty array for non-matching selector');
	});

	test("by function, on one", function() {
		var section = D.html.body.section;
		strictEqual(section.only(function(el) {
			return el.tagName === 'SECTION';
		}), section, "self when tagName is SECTION");
	});

	test("by slice, on multiple", function() {
		var divs = D.html.body.section.div;
		strictEqual(divs.only(-1), divs[divs.length-1], 'get last one');
		strictEqual(divs.only(1,4).length, 3, "got sublist of proper length");
	});

	test("by selector, on multiple", function() {
		var divs = D.html.body.section.div;
		strictEqual(divs.only('#first'), D.query('#first'), 'got #first');
	});

	test("by function, on multiple", function() {
		var odds = function(n,i){ return i%2; };
		strictEqual(D.html.body.section.div.only(odds).length, 2, "got two odd divs");
	});


	module("search");

	test("find multiple, get array", function() {
		ok(D.query("div") instanceof Array, "should be an array");
	});

	test("find one, get HTMLElement", function() {
		ok(D.query("#identity") instanceof HTMLElement, "should be an element");
	});

	test("find until count", function() {
		ok(D.query('section div[id]', 1) instanceof HTMLElement, "should be a single element");

		var lessThanAvailable = D.query('section div[id]', 2);
		ok(lessThanAvailable instanceof Array, 'should be an array');
		equal(lessThanAvailable.length, 2, 'should have only two');

		var moreThanAvailable = D.query('section div[id]', 5);
		ok(moreThanAvailable instanceof Array, 'should be an array');
		equal(moreThanAvailable.length, 3, 'should only find three');
	});

	test("find nonexistent, get empty array", function() {
		ok(!D.query("#idontexist").length, "empty array");
	});

	test("contextual search", function() {
		strictEqual(D.html.body.section.query("div").length, 5, "should be five divs, not seven");
	});

	test("traverse on result", function() {
		ok(D);
		ok(D.query('section'));
		ok(D.query("section").div, "should be present");
	});

}(D));

