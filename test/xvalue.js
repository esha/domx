(function(D, module, test) {
 
    function testProperty(set, prop, getOnly) {
        if (!Array.isArray(set)){ set = [set]; }
        test("."+prop+" presence", function(assert) {
            set.forEach(function(_class) {
                var desc = Object.getOwnPropertyDescriptor(_class.prototype, prop);
                assert.ok(desc, 'should have descriptor for '+prop+' in '+_class.name);
                if (desc) {
                    assert.ok(desc.get, 'should have getter for '+prop+' in '+_class.name);
                    if (!getOnly) {
                        assert.ok(desc.set, 'should have setter for '+prop+' in '+_class.name);
                    }
                    assert.ok(!desc.enumerable, prop+' should not be enumerable in '+_class.name);
                    assert.ok(!desc.writable, prop+' should not be writable in '+_class.name);
                    assert.ok(desc.configurable, prop+' should stay configurable in '+_class.name);
                }
            });
        });
    }

    function testMethod(set, method) {
        test(method+"() presence", function(assert) {
            set.forEach(function(_class) {
                var parent = _class.prototype || _class;
                assert.equal(typeof parent[method], "function", _class.name+'.prototype.'+method);
            });
        });
    }

    var X = D.x,
        _ = X._;
    module("xValue");

    test("_.", function(assert) {
        assert.equal(typeof _.xValue, "object", "_.xValue");
    });

    testMethod([Node,Attr], 'useBaseValue');
    ['value','baseValue','xValue','nameValue'].forEach(function(prop) {
        testProperty(Node, prop);
    });
    ['nameParent','nameGroup'].forEach(function(prop) {
        testProperty(Node, prop, 'get');
    });

    testProperty(Element, 'noSubNames');
    testProperty(Element, 'useAttrValues');

    testMethod(X.parents, 'queryName');
    testMethod(X.parents, 'queryNameAll');

    function testBaseValue(node, initial, assert) {
        if (arguments.length !== 2) {
            initial = node.baseValue;
        }
        if (node.nodeType !== 1) {
            assert.equal(node.baseValue, node.nodeValue);
        }
        assert.equal(node.baseValue, initial);
        node.baseValue = true;
        assert.strictEqual(node.baseValue, true);
        node.baseValue = 42;
        assert.strictEqual(node.baseValue, 42);
        node.baseValue = ['an','array'];
        assert.deepEqual(node.baseValue, ['an','array']);
        node.baseValue = {key:'value'};
        assert.deepEqual(node.baseValue, {key:"value"});
        node.baseValue = 'string';
        assert.equal(node.baseValue, 'string');
        node.baseValue = initial;
    }

    test("text node", function(assert) {
        testBaseValue(D.createTextNode('text'), 'text', assert);
    });

    test("comment", function(assert) {
        testBaseValue(D.createComment('<content>'), '<content>', assert);
    });

    test("element", function(assert) {
        var node = D.body.insert('span[value=attr]{text}');
        assert.equal(node.baseProperty, 'value');
        assert.equal(node.textContent, 'text');
        testBaseValue(node, 'attr', assert);
        node.removeAttribute('value', assert);
        testBaseValue(node, 'text', assert);
        assert.equal(node.children.length, 0);
        node.remove();
    });

    test('internal text values', function(assert) {
        var el = D.createElement('div');
        el.textContent = 'a ${b} c ${d}';
        assert.deepEqual({ b: '', d: '' }, el.xValue);
        el.xValue = {b:1, d:true};
        assert.equal('a 1 c true', el.textContent);
        var val = el.xValue = {b:2, d:{e:false}};
        assert.equal('a 2 c {"e":false}', el.textContent);
        assert.deepEqual(val, el.xValue);
        assert.ok(val !== el.xValue, 'should be different object');
    });

    test('change event', function(assert) {
        assert.expect(10);
        var el = D.body.insert('input[value=old]'),
            listener = function(e) {
                assert.ok(e instanceof window.Event);
                assert.equal(e.target, el);
            };
        D.body.addEventListener('change', listener);

        assert.equal(el.xValue, 'old');
        el.xValue = 'new';
        assert.equal(el.xValue, 'new');
        el.remove();

        el = D.body.insert('input[type=radio][value=value][checked=true]');
        el.xValue = 'old';
        el.remove();

        el = D.body.insert('select[multiple]');
        el.insert('option*3').each('textContent', '${i}');
        assert.deepEqual(el.xValue, []);
        el.xValue = [0,1,2];
        assert.deepEqual(el.xValue, [0,1,2]);
        el.remove();

        D.body.removeEventListener('change', listener);
    });

    test('ul li base change', function(assert) {
        var li = D.createElement('li'),
            ul = D.createElement('ul'),
            ol = D.createElement('ol');
        li.textContent = 'true';
        assert.equal('textContent', li.baseProperty);
        ol.appendChild(li);
        assert.equal('value', li.baseProperty);
        assert.strictEqual(li.xValue, 0);
        li.remove();
        ul.appendChild(li);
        assert.equal('textContent', li.baseProperty);
        assert.strictEqual(li.xValue, true);
    });

    test('queryName', function(assert) {
        var el = D.queryName('named');
        assert.strictEqual(el, D.query('[name=named]'));
        assert.equal(el.getAttribute('name'), 'named');
        var nested = D.queryName('named.nested');
        assert.strictEqual(nested, D.query('[name=nested]'));
        assert.equal(nested.getAttribute('name'), 'nested');

        var named = D.queryAll('[name=named]');
        nested = named.queryName('nested');
        assert.strictEqual(nested, D.query('[name=nested]'));
    });

    test('queryNameAll', function(assert) {
        var els = D.queryNameAll('named');
        assert.equal(els.length, 2);
        assert.equal(els[0].getAttribute('name'), 'named');
        assert.equal(els[1].getAttribute('name'), 'named');

        els = D.body.children.queryNameAll('named');
        assert.equal(els.length, 2);
    });

    test('queryName text node', function(assert) {
        var text = D.createTextNode('${greeting} world!'),
            el = D.createElement('div');
        el.appendChild(text);
        D.body.appendChild(el);
        var result = D.body.queryName('greeting');
        assert.ok(result);
        assert.strictEqual(text, result);
        assert.equal(el.childNodes.length, 2);
        el.remove();
    });

}(document, QUnit.module, QUnit.test));
