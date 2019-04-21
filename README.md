# rxjs-observe

[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/cartant/rxjs-observe/blob/master/LICENSE)
[![NPM version](https://img.shields.io/npm/v/rxjs-observe.svg)](https://www.npmjs.com/package/rxjs-observe)
[![Build status](https://img.shields.io/travis/cartant/rxjs-observe.svg)](http://travis-ci.org/cartant/rxjs-observe)
[![dependency status](https://img.shields.io/david/cartant/rxjs-observe.svg)](https://david-dm.org/cartant/rxjs-observe)
[![devDependency Status](https://img.shields.io/david/dev/cartant/rxjs-observe.svg)](https://david-dm.org/cartant/rxjs-observe#info=devDependencies)
[![peerDependency Status](https://img.shields.io/david/peer/cartant/rxjs-observe.svg)](https://david-dm.org/cartant/rxjs-observe#info=peerDependencies)
[![Greenkeeper badge](https://badges.greenkeeper.io/cartant/rxjs-observe.svg)](https://greenkeeper.io/)

### What is it?

It's an `observe` function that can be used to create observable sources for an arbitrary object's property assignements and method calls.

### Why might you need it?

If you need to convert an imperative API to an observable API, you might find this useful.

## Install

Install the package using NPM:

```
npm install rxjs-observe --save
```

TypeScript 3.0 or later is required, as the type declaration for `observe` uses [generic rest parameters](https://github.com/Microsoft/TypeScript/wiki/What's-new-in-TypeScript#generic-rest-parameters).

## Usage

Pass an object instance to `observe` and receive an `observables` object - that contains observable sources for the object's properties and methods - and a `proxy`:

```ts
import { observe } from "rxjs-observe";

const instance = { name: "Alice" };
const { observables, proxy } = observe(instance);
observables.name.subscribe(value => console.log(name));
proxy.name = "Bob";
```

`observe` can be passed optional callbacks that will be implemented in the proxy - the observed instance does not need to implement them - and forwarded to an observable with the same name:

```ts
import { callback, observe } from "rxjs-observe";

const instance = { name: "Alice" };
const { observables, proxy } = observe(instance, {
  init: callback()
});
observables.init.subscribe(() => console.log("init"));
proxy.init();
```

`observe` can be called inside a constructor and the `proxy` can be returned, as in this Angular component:

```ts
import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import { switchMapTo, takeUntil } from "rxjs/operators";
import { callback, observe } from "rxjs-observe";

@Component({
  selector: "some-component",
  template: "<span>Some useless component that writes to the console</span>"
})
class SomeComponent {
  @Input() public name: string;
  constructor() {
    const { observables, proxy } = observe(this as SomeComponent, {
      ngOnInit: callback(),
      ngOnDestroy: callback()
    });
    observables.ngOnInit.pipe(
      switchMapTo(observables.name),
      takeUntil(observables.ngOnDestroy)
    ).subscribe(value => console.log(value));
    return proxy;
  }
}
```

However, such a component implementation is ... unconventional, so proceed with caution, but ... YOLO.