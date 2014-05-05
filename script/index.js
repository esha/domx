(function(D, Sintax, Demo) {
    D.addEventListener("DOMContentLoaded", function() {
        
        new Demo(D.query('#input'),
                 D.query('#output iframe'), [
            "document.body.div",
            "document.body.div.section",
            "document.body.div.section.only(0)",
            "document.body.div.section.only('#full').ul.li",
            "document.body.div.section.only('#full').ul.li\n  .each('id', 'item${i}')",
            "document.query('#empty')",
            "document.query('#empty').add('h1')",
            "document.query('#empty').add('ul>li{item}*5')",
            "document.queryAll('#empty li').each(function(el, i, all) {\n  el.textContent += ' '+(i+1)+' of '+all.length;\n})",
            "document.queryAll('#empty li').only(function(el, i) {\n  return i % 2;\n}).each('className','odd')",
            "document.queryAll('#empty *').remove()",
            "//Now you try it out for yourself! Edit me."
        ]);

        Sintax.highlight();
    });
})(document, Sintax, Demo);
