(function(D) {
    "use strict";

    var _ = D._,
    E = _.elements = {
        define: function(name) {
            _.define(name, {
                get: function elements() {
                    return this.each('children').only('tagName.toLowerCase', name);
                }
            });
        },
        byType: function(type) {
            return function nodes() {
                return this.each('childNodes').only('nodeType', type);
            };
        }
    };

    var l = 'div span p h1 h2 h3 h4 h5 h6 pre ol ul li dl dt dd blockquote '+
    'a b i u em strong small s cite abbr code sub sup hr br img ins del bdo mark '+
    'input select textarea button data time datalist option optgroup output progress meter '+
    'iframe object embed audio video source track canvas map area svq '+
    'meta link script title style base template '+
    'section article nav aside header footer main figure figcaption details summary menuitem menu '+
    'table caption tr th td tbody thead tfoot col colgroup form fieldset legend label';
    l.split(' ').forEach(E.define);

    _.define('$text', { get: E.byType(3) });
    _.define('$comment', { get: E.byType(8) });

})(document);