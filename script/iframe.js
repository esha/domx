(function(D) {
    var timeout;
    function selected(elements) {
        if (timeout){ clearTimeout(timeout); }
        var arr = elements.toArray && elements.toArray() || elements;
        timeout = setTimeout(function() {
            arr.forEach(highlight);
            setTimeout(function(){ arr.forEach(unhighlight); }, 1000)
        }, 100);
    };
    function highlight(el){ el.setAttribute('_highlight', 'true'); }
    function unhighlight(el){ el.removeAttribute('_highlight'); }

    D.addEventListener("DOMContentLoaded", function() {
        // modify iframe's DOMx list to handle the demo content
        var add = D._.List.prototype.add;
        Object.defineProperty(D._.List.prototype, 'add', { value: function(item) {
            if (D._.isList(item)) {
                selected(item);
            }
            return add.apply(this, arguments);
        }});

        var shadowDom = D.query("#shadow-dom"),
            textDom = D.query("#text-dom"),
            stringify = D._.stringify.print,
            update = function() {
                var root = shadowDom.children[0],
                    html = stringify(root, true, '');
                textDom.innerHTML = html;
            };
        shadowDom.addEventListener("DOMSubtreeModified", update);
        update();
    });
})(document);
