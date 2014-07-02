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

    var _ = D._;
    module("values");

    test("_.", function() {
        equal(typeof _.values, "object", "_.values");
    });

    testMethod([Node,Attr], 'useBaseValue');
    ['value','baseValue','properValue','nameValue'].forEach(function(prop) {
        testProperty(Node, prop);
    });
    ['nameParent','nameGroup'].forEach(function(prop) {
        testProperty(Node, prop, 'get');
    });

    testProperty(Element, 'noValues');
    testProperty(Element, 'useAttrValues');

    testMethod(_.parents, 'queryName');
    testMethod(_.parents, 'queryNameAll');

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
        equal(node.textContent, 'text');
        testBaseValue(node, 'attr');
        node.removeAttribute('value');
        testBaseValue(node, 'text');
        equal(node.children.length, 0);
        node.remove();
    });

}(document));
