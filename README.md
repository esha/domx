[domx][home] is a small, [extensible][x.add] library to help you embrace the native DOM in a simple, direct, and very powerful way.

Please check out the [demo][demo], the [API][api] and the [F.A.Q.][faq]

[home]: http://esha.github.io/domx
[demo]: http://esha.github.io/domx#Demo
[api]: http://esha.github.io/domx#API
[faq]: http://esha.github.io/domx#FAQ

[Bower][bower]: `bower install domx`  
[NPM][npm]: `npm install domx`   
[Component][component]: `component install esha/domx`  

[npm]: https://npmjs.org/package/domx
[bower]: http://bower.io/
[component]: http://component.io/

<!-- build/coverage status, climate -->
[![Build Status](https://travis-ci.org/esha/domx.png?branch=master)](https://travis-ci.org/esha/domx)  

<!-- npm, bower versions, downloads -->
[![Bower version](https://badge.fury.io/bo/domx.png)](http://badge.fury.io/bo/domx)
[![NPM version](https://badge.fury.io/js/domx.png)](http://badge.fury.io/js/domx)
[![Downloads per month](https://img.shields.io/npm/dm/domx.svg)](https://www.npmjs.org/package/domx)

<!-- deps status -->
[![Dependency Status](https://david-dm.org/esha/domx.png?theme=shields.io)](https://david-dm.org/esha/domx)
[![devDependency Status](https://david-dm.org/esha/domx/dev-status.png?theme=shields.io)](https://david-dm.org/esha/domx#info=devDependencies)

#### Basic Version:

Download: [domx.min.js][main-min], [domx.min.js.gz][domx-gz]  

Includes [`each()`][each], [`query()`][query], [`queryAll()`][queryAll], [`only()`][only], [`not()`][not], [`all()`][all], [`nearest()`][nearest], [`farthest()`][farthest], [`closest()`][closest], [`insert()`][insert], [`remove()`][remove], [`toArray()`][toArray], [`document.x.add()`][x.add], [`document.x.alias()`][x.alias], [emmet abbreviations][abbr] in [`insert()`][emmet], and [dot()][dot]:  

[main-min]: https://raw.github.com/esha/domx/master/dist/domx.min.js
[main]: https://raw.github.com/esha/domx/master/dist/domx.js
[main-gz]: https://raw.github.com/esha/domx/master/dist/domx.min.js.gz

[each]: http://esha.github.io/domx#each()
[toArray]: http://esha.github.io/domx#toArray()
[x.add]: http://esha.github.io/domx#x.add()
[x.alias]: http://esha.github.io/domx#x.alias()

[query]: http://esha.github.io/domx#query()
[queryAll]: http://esha.github.io/domx#queryAll()
[only]: http://esha.github.io/domx#only()
[not]: http://esha.github.io/domx#not()
[all]: http://esha.github.io/domx#all()
[farthest]: http://esha.github.io/domx#farthest()
[nearest]: http://esha.github.io/domx#nearest()
[closest]: http://esha.github.io/domx#closest()

[insert]: http://esha.github.io/domx#insert()
[remove]: http://esha.github.io/domx#remove()
[emmet]: http://esha.github.io/domx#insert(emmet)
[abbr]: http://docs.emmet.io/abbreviations/syntax/

[dot]: http://esha.github.io/domx#dot

#### Tiny Version:

Download: [domx.tiny.min.js][tiny-min], [domx.tiny.js.gz][tiny-gz]  

Includes [`each()`][each], [`query()`][query], [`queryAll()`][queryAll], [`only()`][only], [`not()`][not], [`all()`][all], [`nearest()`][nearest], [`farthest()`][farthest], [`closest()`][closest], [`insert()`][insert], [`remove()`][remove], [`document.x.add()`][x.add], [`document.x.alias()`][x.alias], and [`toArray()`][toArray]:  

[tiny-min]: http://raw.github.com/esha/domx/master/dist/domx.tiny.min.js
[tiny-gz]: http://raw.github.com/esha/domx/master/dist/domx.tiny.min.js.gz
[tiny]: http://raw.github.com/esha/domx/master/dist/domx.tiny.js

#### Full Version:

The basic version with the most useful plugins ([domx-value][xvalue] and [domx-repeat][repeat]) inserted. Those who used these plugins as part of the primary artifact prior to version 0.16.0 may use this artifact until they add the new projects for the plugins as dependencies.
Download: [domx.full.min.js][full-min], [domx.full.min.js.gz][full-gz]  

[full-min]: http://raw.github.com/esha/domx/master/dist/domx.full.min.js
[full-gz]: http://raw.github.com/esha/domx/master/dist/domx.full.min.js.gz

#### Dependent Projects:

These were originally part of [domx][domx] or its [demo][demo] and have been pulled out into separate projects.

Download:
* [domx-value.js][xvalue] - Extension that adds a powerful `xValue` getter/setter to nodes and `queryName(name)` and `queryNameAll(name)` functions to nodes and lists. These make it trivial to read/write rich, typed, and even nested model values to/from the DOM.
* [domx-repeat.js][repeat] - Extension that adds a `repeat([value])` function to nodes and lists for easy duplicating of DOM structures. It takes an optional value parameter that will set xValue for the repeated node(s) if you also are using the [domx-value][xvalue] extension.
* [domx-stringify.js][stringify] - Extension that adds a `stringify()` function to nodes and lists to generate string versions of DOM nodes.
* [demo-x][demo-x] - Web component for interactive, scripted code demos.
* [random-x][random-x] - Simple web component for random display of one of the child elements (mostly used as an example).

[xvalue]: http://github.com/esha/domx-value
[repeat]: http://github.com/esha/domx-repeat
[stringify]: http://github.com/esha/domx-stringify
[demo-x]: http://github.com/nbubna/demo-x
[random-x]: http://github.com/nbubna/random-x/

### Release History
* 2014-05-04 [v0.7.0][] (first public release)
* 2014-05-13 [v0.8.1][] (repeat(), append())
* 2014-05-30 [v0.9.1][] (not(), all(), dot())
* 2014-09-08 [v0.10.3][] (utmost(), complete xvalue rewrite)
* 2014-09-22 [v0.11.2][] (s/utmost()/farthest(), closest(), value change events)
* 2014-10-28 [v0.12.0][] (reorganize secondary versions/plugins)
* 2014-11-10 [v0.13.2][] (s/DOMxList/XList, s/properValue/xValue, list.queryName[All])
* 2014-11-10 [v0.14.2][] (document.x, s/D.extend/D.x.add, s/D._.resolve[]/D.x.alias(), 'x-' attributes)
* 2014-12-04 [v0.15.0][] (not(node), s/closest()/nearest(), polyfill version of closest())
* 2014-12-11 [v0.16.1][] (move xValue and repeat() out to [domx-value][xvalue] and [domx-repeat][repeat])
* 2016-09-22 [v0.17.0][] (s/append/insert to avoid conflict with Safari 10's unadvertised and undocumented HTMLElement.prototype.append)

[v0.7.0]: https://github.com/esha/domx/tree/0.7.0
[v0.8.1]: https://github.com/esha/domx/tree/0.8.1
[v0.9.1]: https://github.com/esha/domx/tree/0.9.1
[v0.10.3]: https://github.com/esha/domx/tree/0.10.3
[v0.11.2]: https://github.com/esha/domx/tree/0.11.2
[v0.12.0]: https://github.com/esha/domx/tree/0.12.0
[v0.13.2]: https://github.com/esha/domx/tree/0.13.2
[v0.14.2]: https://github.com/esha/domx/tree/0.14.2
[v0.15.0]: https://github.com/esha/domx/tree/0.15.0
[v0.16.1]: https://github.com/esha/domx/tree/0.16.1
[v0.17.0]: https://github.com/esha/domx/tree/0.17.0
