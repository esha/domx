(function(D) {
 
    function testProperty(set, prop, getOnly) {
        if (!Array.isArray(set)){ set = [set]; }
        test("."+prop+" presence", function() {
            set.forEach(function(_class) {
                var desc = Object.getOwnPropertyDescriptor(_class.prototype, prop);
                ok(desc, 'should have descriptor for '+prop+' in '+_class.name);
                if (desc) {
                    ok(desc.get, 'should have getter for '+prop+' in '+_class.name);
                    if (!getOnly) {
                        ok(desc.set, 'should have setter for '+prop+' in '+_class.name);
                    }
                    ok(!desc.enumerable, prop+' should not be enumerable in '+_class.name);
                    ok(!desc.writable, prop+' should not be writable in '+_class.name);
                    ok(desc.configurable, prop+' should stay configurable in '+_class.name);
                }
            });
        });
    }

    function testMethod(set, method) {
        test(method+"() presence", function() {
            set.forEach(function(_class) {
                var parent = _class.prototype || _class;
                equal(typeof parent[method], "function", _class.name+'.prototype.'+method);
            });
        });
    }

    var X = D.x,
        _ = X._;
    module("xValue");

    test("_.", function() {
        equal(typeof _.xValue, "object", "_.xValue");
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

    testMethod(X.parentNodes, 'queryName');
    testMethod(X.parentNodes, 'queryNameAll');

    function testBaseValue(node, initial) {
        if (arguments.length !== 2) {
            initial = node.baseValue;
        }
        if (node.nodeType !== 1) {
            equal(node.baseValue, node.nodeValue);
        }
        equal(node.baseValue, initial);
        node.baseValue = true;
        strictEqual(node.baseValue, true);
        node.baseValue = 42;
        strictEqual(node.baseValue, 42);
        node.baseValue = ['an','array'];
        deepEqual(node.baseValue, ['an','array']);
        node.baseValue = {key:'value'};
        deepEqual(node.baseValue, {key:"value"});
        node.baseValue = 'string';
        equal(node.baseValue, 'string');
        node.baseValue = initial;
    }

    test("text node", function() {
        testBaseValue(D.createTextNode('text'), 'text');
    });

    test("comment", function() {
        testBaseValue(D.createComment('<content>'), '<content>');
    });

    test("element", function() {
        var node = D.body.append('span[value=attr]{text}');
        equal(node.baseProperty, 'value');
        equal(node.textContent, 'text');
        testBaseValue(node, 'attr');
        node.removeAttribute('value');
        testBaseValue(node, 'text');
        equal(node.children.length, 0);
        node.remove();
    });

    test('internal text values', function() {
        var el = D.createElement('div');
        el.textContent = 'a ${b} c ${d}';
        deepEqual({ b: '', d: '' }, el.xValue);
        el.xValue = {b:1, d:true};
        equal('a 1 c true', el.textContent);
        var val = el.xValue = {b:2, d:{e:false}};
        equal('a 2 c {"e":false}', el.textContent);
        deepEqual(val, el.xValue);
        ok(val !== el.xValue, 'should be different object');
    });

    test('change event', function() {
        expect(10);
        var el = D.body.append('input[value=old]'),
            listener = function(e) {
                ok(e instanceof window.Event);
                equal(e.target, el);
            };
        D.body.addEventListener('change', listener);

        equal(el.xValue, 'old');
        el.xValue = 'new';
        equal(el.xValue, 'new');
        el.remove();

        el = D.body.append('input[type=radio][value=value][checked=true]');
        el.xValue = 'old';
        el.remove();

        el = D.body.append('select[multiple]');
        el.append('option*3').each('textContent', '${i}');
        deepEqual(el.xValue, []);
        el.xValue = [0,1,2];
        deepEqual(el.xValue, [0,1,2]);
        el.remove();

        D.body.removeEventListener('change', listener);
    });

    test('ul li base change', function() {
        var li = D.createElement('li'),
            ul = D.createElement('ul'),
            ol = D.createElement('ol');
        li.textContent = 'true';
        equal('textContent', li.baseProperty);
        ol.appendChild(li);
        equal('value', li.baseProperty);
        strictEqual(li.xValue, 0);
        li.remove();
        ul.appendChild(li);
        equal('textContent', li.baseProperty);
        strictEqual(li.xValue, true);
    });

    test('queryName', function() {
        var el = D.queryName('named');
        strictEqual(el, D.query('[name=named]'));
        equal(el.getAttribute('name'), 'named');
        var nested = D.queryName('named.nested');
        strictEqual(nested, D.query('[name=nested]'));
        equal(nested.getAttribute('name'), 'nested');

        var named = D.queryAll('[name=named]');
        nested = named.queryName('nested');
        strictEqual(nested, D.query('[name=nested]'));
    });

    test('queryNameAll', function() {
        var els = D.queryNameAll('named');
        equal(els.length, 2);
        equal(els[0].getAttribute('name'), 'named');
        equal(els[1].getAttribute('name'), 'named');

        els = D.body.children.queryNameAll('named');
        equal(els.length, 2);
    });

    test('queryName text node', function() {
        var text = D.createTextNode('${greeting} world!'),
            el = D.createElement('div');
        el.appendChild(text);
        D.body.appendChild(el);
        var result = D.body.queryName('greeting');
        ok(result);
        strictEqual(text, result);
        equal(el.childNodes.length, 2);
        el.remove();
    });

}(document));
