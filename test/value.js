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

    var _ = D._;
    module(".value");

    test("_.", function() {
        equal(typeof _.get, "function", "_.get");
        equal(typeof _.set, "function", "_.set");
    });

    test(".value presence", function() {
        var set = _.nodes;
        expect(set.length*5);
        set.forEach(function(_class) {
            var desc = Object.getOwnPropertyDescriptor(_class.prototype, 'value');
            ok(desc.get);
            ok(desc.set);
            ok(!desc.enumerable);
            ok(!desc.writable);
            ok(desc.configurable);
        });
    });

    function testNode(node, initial) {
        if (arguments.length !== 2) {
            initial = node.value;
        }
        if (node.nodeType !== 1) {
            equal(node.value, node.nodeValue);
        }
        equal(node.value, initial);
        node.value = true;
        strictEqual(node.value, true);
        node.value = 42;
        strictEqual(node.value, 42);
        node.value = ['an','array'];
        deepEqual(node.value, ['an','array']);
        node.value = {key:'value'};
        deepEqual(node.value, {key:"value"});
        node.value = 'string';
        equal(node.value, 'string');
        node.value = initial;
    }

    test("text node", function() {
        testNode(D.createTextNode('text'), 'text');
    });

    test("comment", function() {
        testNode(D.createComment('<content>'), '<content>');
    });

    test("element", function() {
        var node = D.body.add('span[value=attr]{text}');
        testNode(node, 'attr');
        equal(node.textContent, 'text');
        node.removeAttribute('value');
        testNode(node, 'text');
        equal(node.children.length, 0);
        var markup = ' <span>child</span> ';
        node.value = markup;
        equal(node.children.length, 1);
        equal(node.value, markup);
        node.remove();
    });

    test("custom get/set", function() {
        expect(4);
        var node = D.body.add('custom');
        _.get.CUSTOM = function(el) {
            equal(el, node);
            return this.getAttribute('attr');
        };
        _.set.CUSTOM = function(el, value) {
            equal(this, node);
            return el.setAttribute('attr', value);
        };
        node.value = 42;
        strictEqual(node.getAttribute('attr'), "42");
        equal(node.value, 42);
        node.remove();
    });

}(document));
