[domx][home] is a small, [extensible][extend] library to help you enjoy the DOM in a simple, direct, and very powerful way.

Please check out the [demo][demo], the [API][api] and the [F.A.Q.][faq].

[home]: http://esha.github.io/domx
[demo]: http://esha.github.io/domx#Demo
[api]: http://esha.github.io/domx#API
[faq]: http://esha.github.io/domx#FAQ

#### Full Version:

Download: [domx.min.js][full-min] or [domx.js][full] [![Build Status](https://travis-ci.org/esha/domx.png?branch=master)](https://travis-ci.org/esha/domx)  
[Bower][bower]: `bower install domx`  
[NPM][npm]: `npm install domx`   
[Component][component]: `component install esha/domx`  

Includes [`each()`][each], [`document.extend()`][extend], [`query()`][query], [`queryAll()`][queryAll], [`only()`][only], [`not()`][not], [`all()`][all], [`closest()`][closest], [`farthest()`][farthest], [`append()`][append], [`remove()`][remove], [`value`][value], [`toArray()`][toArray], [emmet abbreviations][abbr] in [`append()`][append-emmet], and [dot()traversal][dot-traversal]:  
* [domx.base.js][base]
* [domx.emmet.js][emmet]
* [domx.dot.js][dot]

[npm]: https://npmjs.org/package/domx
[bower]: http://bower.io/
[component]: http://component.io/

[full-min]: https://raw.github.com/esha/domx/master/dist/domx.min.js
[full]: https://raw.github.com/esha/domx/master/dist/domx.js

[core]: http://raw.github.com/esha/domx/master/src/core.js
[traverse]: http://raw.github.com/esha/domx/master/src/traverse.js
[append]: http://raw.github.com/esha/domx/master/src/append.js
[value]: http://raw.github.com/esha/domx/master/src/value.js
[emmet]: http://raw.github.com/esha/domx/master/dist/domx.emmet.js
[dot]: http://raw.github.com/esha/domx/master/dist/domx.dot.js
[stringify]: http://raw.github.com/esha/domx/master/dist/domx.stringify.js

[each]: http://esha.github.io/domx#each()
[toArray]: http://esha.github.io/domx#toArray()
[extend]: http://esha.github.io/domx#extend()

[query]: http://esha.github.io/domx#query()
[queryAll]: http://esha.github.io/domx#queryAll()
[only]: http://esha.github.io/domx#only()
[not]: http://esha.github.io/domx#not()
[all]: http://esha.github.io/domx#all()
[farthest]: http://esha.github.io/domx#farthest()
[closest]: http://esha.github.io/domx#closest()

[append]: http://esha.github.io/domx#append()
[remove]: http://esha.github.io/domx#remove()

[value]: http://esha.github.io/domx#value

[append-emmet]: http://esha.github.io/domx#append(emmet)
[abbr]: http://docs.emmet.io/abbreviations/syntax/

[dot-traversal]: http://esha.github.io/domx#dot-traversal

#### Base Version:

Download: [domx.min.js][base-min]  or  [domx.js][base]  

Includes [`each()`][each], [`document.extend()`][extend], [`query()`][query], [`queryAll()`][queryAll], [`only()`][only], [`not()`][not], [`all()`][all], [`closest()`][closest], [`farthest()`][farthest], [`append()`][append], [`remove()`][remove], and [`toArray()`][toArray]:  
* [domx.base.js][base]

[base-min]: http://raw.github.com/esha/domx/master/dist/domx.base.min.js
[base]: http://raw.github.com/esha/domx/master/dist/domx.base.js

#### Plugin Versions:

These are the features of the full version that are left out of the "base" version, packaged as plugins for a la carte inclusion: [emmet support][emmet-plugin], [values properties][values-plugin], [repeat support][repeat-plugin], and [dot traversal][dot-plugin]. Also, there is the [stringify][stringify-plugin] used for the [demo][demo].

[emmet-plugin]: http://raw.github.com/esha/domx/master/dist/domx.emmet.js
[values-plugin]: http://raw.github.com/esha/domx/master/dist/domx.values.js
[repeat-plugin]: http://raw.github.com/esha/domx/master/dist/domx.repeat.js
[dot-plugin]: http://raw.github.com/esha/domx/master/dist/domx.dot.js
[stringify-plugin]: http://raw.github.com/esha/domx/master/dist/domx.stringify.js

### Release History
* 2014-05-04 [v0.7.0][] (first public release)
* 2014-05-13 [v0.8.1][] (repeat(), append())
* 2014-05-30 [v0.9.1][] (not(), all(), dot())
* 2014-09-08 [v0.10.3][] (utmost(), complete values rewrite)
* 2014-09-22 [v0.11.2][] (s/utmost()/farthest(), closest(), value change events)
* 2014-10-28 [v0.12.0][] (reorganize secondary versions/plugins)

[v0.7.0]: https://github.com/esha/domx/tree/0.7.0
[v0.8.1]: https://github.com/esha/domx/tree/0.8.1
[v0.9.1]: https://github.com/esha/domx/tree/0.9.1
[v0.10.3]: https://github.com/esha/domx/tree/0.10.3
[v0.11.2]: https://github.com/esha/domx/tree/0.11.2
[v0.12.0]: https://github.com/esha/domx/tree/0.12.0
