(function(window, D) {
    "use strict";

    var Demo = function Demo(el) {
        if (!(this instanceof Demo)) {
            return new Demo(el);
        }
        if (!el.demo) {
            this.init(el);
        }
    };
    Demo.prototype = {
        timing: {
            intent: 1000,
            backspace: 25,
            typing: 50,
            tick: 250,
            minTicks: 8
        },
        init: function(el) {
            var self = el.demo = this;
            self.root = el;
            self.display = el.query('demo-dom');
            self.input = el.query('demo-in');
            self.output = el.query('demo-out');

            self.intent(self.input);
            self._exec = function() {
                self.execute(self.doc);
            };

            if (self.input.children.length) {
                self.initStory();
            }
            if (self.display) {
                self.doc = Demo.docify(self.display.children);
                self.initDisplay();
            } else {
                // a document w/no body content
                self.doc = Demo.docify(new DOMxList());
            }
            self.initControls();
        },
        initDisplay: function() {
            var self = this;
            function update() {
                self.display.innerHTML = self.doc.body.stringify(true);
            }
            update();
            self._observer = new MutationObserver(update)
                .observe(self.doc.html, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    characterData: true
                });
        },
        initStory: function() {
            var self = this;
            self._next = function(){ self.next(); };
            self.story = self.input.children.each('textContent');
            self.input.innerHTML = '';
            this._tick = function() {
                if (self.index){ self.execute(self.doc); }
                setTimeout(self._next, self.calcPause());
            };
            this._tick();
        },
        initControls: function() {
            var self = this,
                stop = self.root.query('[stop]'),
                start = self.root.query('[start]');
            self._stop = function() {
                self.stopped = true;
                self.root.classList.add('stopped');
            };
            self._start = function() {
                self.root.classList.remove('stopped');
                if (!(self.index in self.story)) {
                    self.index = 0;
                }
                self.stopped = false;
                self.next();
            };
            self.input.addEventListener('keydown', self._stop);
            if (stop) {
                stop.addEventListener('click', self._stop);
            }
            if (start) {
                start.addEventListener('click', self._start);
            }
        },
        next: function() {
            var self = this,
                code = self.story[self.index];
            if (code && !self.stopped) {
                var input = self.input;
                self.animate(self.input.value, code, function(s){ input.value = s; }, self._tick);
                self.index++;
            } else if (!code) {
                self._stop();
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
            var code = this.input.value,
                result;
            if (code && code.indexOf('//') !== 0) {
                try {
                    result = eval(code);
                    Demo.flash(result);
                } catch (e) {
                    e.code = code;
                    result = e;
                }
                if (this.output) {
                    var log = this.output.innerHTML;
                    this.output.innerHTML = '<p class="line">'+
                        Demo.describe(result)+'</p>' + log;
                } else {
                    console.log(code);
                    console.log(result);
                }
            }
        },
        animate: function(text, next, update, finish) {
            var i = text.length, self = this, action = 'typing';
            (function _step() {
                if (!self.stopped) {
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
                    setTimeout(_step, self.timing[action]);
                }
            })();
        },
        index: 0
    };

    Demo.docify = function(dom) {
        var d = document.createDocumentFragment();
        d.html = d.documentElement = document.createElement('html');
        d.appendChild(d.html);
        d.html.appendChild(d.body = document.createElement('body'));
        dom.each(function(el) {
            el.remove();
            d.body.append(el);
        });
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
        if (el instanceof Node) {
            return el.value;
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

    Demo.onload = function() {
        D.queryAll('demo-x').each(Demo);
    };

    window.Demo = Demo;
    Demo.onload();// early availability
    D.addEventListener('DOMContentLoaded', Demo.onload);// eventual consistency

})(window, document);