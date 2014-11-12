[domx][home] is a small, [extensible][extend] library to help you enjoy the DOM in a simple, direct, and very powerful way.

Please check out the [demo][demo], the [API][api] and the [F.A.Q.][faq]

[home]: http://esha.github.io/domx
[demo]: http://esha.github.io/domx#Demo
[api]: http://esha.github.io/domx#API
[faq]: http://esha.github.io/domx#FAQ

[Bower][bower]: `bower install domx`  
[NPM][npm]: `npm install domx`   
[Component][component]: `component install esha/domx`  
[![Build Status](https://travis-ci.org/esha/domx.png?branch=master)](https://travis-ci.org/esha/domx)  

[npm]: https://npmjs.org/package/domx
[bower]: http://bower.io/
[component]: http://component.io/

#### Full Version:

Download: [domx.min.js][full-min] or [domx.js][full]  

Includes [`each()`][each], [`document.extend()`][extend], [`query()`][query], [`queryAll()`][queryAll], [`only()`][only], [`not()`][not], [`all()`][all], [`closest()`][closest], [`farthest()`][farthest], [`append()`][append], [`remove()`][remove], [`xValue`][xValue], [`queryName`][queryName], [`queryNameAll`][queryNameAll], [`repeat()`][repeat], [`toArray()`][toArray], [emmet abbreviations][abbr] in [`append()`][emmet], and [dot()][dot]:  

[full-min]: https://raw.github.com/esha/domx/master/dist/domx.min.js
[full]: https://raw.github.com/esha/domx/master/dist/domx.js

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

[xValue]: http://esha.github.io/domx#xValue
[queryName]: http://esha.github.io/domx#queryName()
[queryNameAll]: http://esha.github.io/domx#queryNameAll()

[repeat]: http://esha.github.io/domx#repeat

[emmet]: http://esha.github.io/domx#append(emmet)
[abbr]: http://docs.emmet.io/abbreviations/syntax/

[dot]: http://esha.github.io/domx#dot

#### Base Version:

Download: [domx.base.min.js][base-min]  or  [domx.base.js][base]  

Includes [`each()`][each], [`document.extend()`][extend], [`query()`][query], [`queryAll()`][queryAll], [`only()`][only], [`not()`][not], [`all()`][all], [`closest()`][closest], [`farthest()`][farthest], [`append()`][append], [`remove()`][remove], and [`toArray()`][toArray]:  

[base-min]: http://raw.github.com/esha/domx/master/dist/domx.base.min.js
[base]: http://raw.github.com/esha/domx/master/dist/domx.base.js

#### Plugin Versions:

Features stripped out of the "base" version, packaged as plugins for a la carte inclusion.  

Download:
* [domx.emmet.js][emmet-plugin] - supports [emmet][emmet] [abbreviations][abbr] for `append()`
* [domx.xvalue.js][xvalue-plugin] - adds [`xValue`][xValue] getter/setter, [`queryName`][queryName], and [`queryNameAll`][queryNameAll]
* [domx.repeat.js][repeat-plugin] - adds [`repeat()`][repeat] function
* [domx.dot.js][dot-plugin] - supports dot-traversal of elements when [`data-domx-dot`][dot] attribute or [`dot()`][dot] function is applied to a parent
* [domx.stringify.js][stringify-plugin] - generates a string version of the DOM for the demo (also not in the "full" version)

[emmet-plugin]: http://raw.github.com/esha/domx/master/dist/domx.emmet.js
[xvalue-plugin]: http://raw.github.com/esha/domx/master/dist/domx.xvalue.js
[repeat-plugin]: http://raw.github.com/esha/domx/master/dist/domx.repeat.js
[dot-plugin]: http://raw.github.com/esha/domx/master/dist/domx.dot.js
[stringify-plugin]: http://raw.github.com/esha/domx/master/dist/domx.stringify.js

### Release History
* 2014-05-04 [v0.7.0][] (first public release)
* 2014-05-13 [v0.8.1][] (repeat(), append())
* 2014-05-30 [v0.9.1][] (not(), all(), dot())
* 2014-09-08 [v0.10.3][] (utmost(), complete xvalue rewrite)
* 2014-09-22 [v0.11.2][] (s/utmost()/farthest(), closest(), value change events)
* 2014-10-28 [v0.12.0][] (reorganize secondary versions/plugins)
* 2014-11-10 [v0.13.1][] (s/DOMxList/XList, s/properValue/xValue, list.queryName[All])

[v0.7.0]: https://github.com/esha/domx/tree/0.7.0
[v0.8.1]: https://github.com/esha/domx/tree/0.8.1
[v0.9.1]: https://github.com/esha/domx/tree/0.9.1
[v0.10.3]: https://github.com/esha/domx/tree/0.10.3
[v0.11.2]: https://github.com/esha/domx/tree/0.11.2
[v0.12.0]: https://github.com/esha/domx/tree/0.12.0
[v0.13.1]: https://github.com/esha/domx/tree/0.13.1
