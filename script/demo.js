(function(window, D) {
    "use strict";

    var Demo = function Demo(input, dom, display, output, story) {
        if (!(this instanceof Demo)) {
            return new Demo(input, dom, display, output, story);
        }
        this.start(input, dom, display, output, story);
    };
    Demo.prototype = {
        timing: {
            intent: 1000,
            backspace: 25,
            typing: 50,
            tick: 250,
            minTicks: 8
        },
        start: function(input, dom, display, output, story) {
            this.input = input = D.query(input);
            this.dom = Demo.docify(dom = D.query(dom));
            this.display = display = D.query(display);
            this.output = output = D.query(output);
            this.story = story;
            this.intent(input);
            var self = this,
                next = function(){ self.next(); };
            this._exec = function() {
                self.execute(self.dom);
            };
            this._tick = function() {
                if (self.index){ self.execute(self.dom); }
                setTimeout(next, self.calcPause());
            };
            this._tick();

            var update = function() {
                display.innerHTML = dom.stringify(true);
            };
            update();
            this._observer = new MutationObserver(update)
                .observe(this.dom.html, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    characterData: true
                });
        },
        restart: function() {
            this.index = 0;
            this.next();
        },
        next: function() {
            var code = this.story[this.index];
            if (code) {
                this.animate(this.input.value, code, function(s){ input.value = s; }, this._tick);
                this.index++;
            }
        },
        calcPause: function() {
            // base pause of current line, not next line
            var code = this.story[this.index-1] || '';
            // first line and comments go instantly
            return !code || (code.indexOf('//') === 0 && code.indexOf('\n') < 0) ? 0 :
                // others default to 250ms per symbol, with a minimum of 2s
                Math.max(code.replace(/\w|\s/g, '').length, this.timing.minTicks) * this.timing.tick;
        },
        intent: function(el) {
            var timeout, self = this;
            el.addEventListener("keydown", function() {
                if (timeout){ clearTimeout(timeout); }
                timeout = setTimeout(self._exec, self.timing.intent);
            });
        },
        execute: function(document) {
            var code = this.input.value;
            if (code.trim().indexOf('restart') === 0) {
                this.restart();
            } else {
                var result;
                try {
                    result = eval(code);
                    Demo.flash(result);
                } catch (e) {
                    e.code = code;
                    result = e;
                }
                if (this.output) {
                    if (result !== undefined) {
                        var log = this.output.innerHTML;
                        this.output.innerHTML = '<p class="line">'+
                            Demo.describe(result)+'</p>\n' + log;
                    }
                } else {
                    console.log(code);
                    if (result) {
                        console.log(result);
                    }
                }
            }
        },
        animate: function(text, next, update, finish) {
            var i = text.length, self = this, action = 'typing';
            (function step() {
                if (next.indexOf(text) < 0) {
                    action = 'backspace';
                    text = text.substr(0, --i);
                } else if (i < next.length) {
                    action = 'typing';
                    text = next.substr(0, ++i);
                } else {
                    return finish();
                }
                update(text);
                setTimeout(step, self.timing[action]);
            })();
        },
        index: 0
    };

    Demo.docify = function(el) {
        var d = document.createDocumentFragment();
        d.html = d.documentElement = document.createElement('html');
        d.appendChild(d.html);
        d.html.appendChild(d.body = document.createElement('body'));
        el.remove();
        d.body.appendChild(el);
        d.html.dot();
        try {
            delete d.parentNode;
            d.parentNode = window;
        } catch (e) {}
        return d;
    };

    Demo.describe = function(el) {
        if (document._.isList(el) && el.each) {
            return el.each(Demo.describe).join(', ');
        }
        if (el instanceof HTMLElement) {
            var id = el.getAttribute('id'),
                classes = el.getAttribute('class');
            return '&lt;'+
                el.tagName.toLowerCase()+
                (id ? '#'+id : '')+
                (classes ? '.'+classes.split(' ').join('.') : '')+
            '&gt;';
        }
        if (typeof el === "object") {
            return JSON.stringify(el);
        }
        return el && el.value || (el+'');
    }

    // this all hitches on css animations and stringify's _attr support
    Demo.highlight = function(el) {
        if (el.setAttribute) {
            el.setAttribute('_highlight', 'true');
        }
    };
    Demo.unhighlight = function(el) {
        if (el.removeAttribute) {
            el.removeAttribute('_highlight');
        }
    };
    var flashTimeout;
    Demo.flash = function(el) {
        if (el && el.each) {
            if (flashTimeout){ clearTimeout(flashTimeout); }
            flashTimeout = setTimeout(function() {
                el.each(Demo.highlight);
                setTimeout(function() {
                    el.each(Demo.unhighlight);
                }, 1000);
            }, Demo.flash.time || 100);
        }
    };

    window.Demo = Demo;


})(window, document);