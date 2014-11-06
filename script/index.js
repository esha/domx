(function(D, Sintax, Demo) {
    D.addEventListener("DOMContentLoaded", function() {
        window.demo = new Demo('#input', '#elements div', '#elements', '#output', [
            "document.body.div",
            "document.body.div.section",
            "document.body.div.section.only(0)",
            "document.body.div.section.only('#full')",
            "document.body.div.section.ul.li\n  .each('id', 'item${i}')",
            "document.query('#empty')",
            "document.query('#empty').append('h1')",
            "document.query('#empty').append('ul>li{item}*5')",
            "document.queryAll('#empty li').each(function(el, i, all) {\n  el.textContent += ' '+(i+1)+' of '+all.length;\n})",
            "document.queryAll('#empty li').only(function(el, i) {\n  return i % 2;\n}).each('className','odd')",
            "document.queryAll('#empty *').remove()",
            "//Now you try it out for yourself! Edit me."
        ]);
    });
    window.D = document;
})(document, Sintax, Demo);
