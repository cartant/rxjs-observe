/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-observe
 */
/*tslint:disable:no-unused-expression rxjs-no-ignored-subscription*/

import { expect } from "chai";
import { Observable } from "rxjs";
import { callback, observe } from "./observe";

describe("observe", () => {
  describe("outside a constructor", () => {
    const job = Symbol("job");
    class Person {
      [job]: string;
      constructor(public age: number, public name: string) {}
      greet(greeting: string): string {
        return `${greeting}, ${this.name}.`;
      }
    }

    it("should observe properties", () => {
      const person = new Person(32, "Alice");
      const { observables, proxy } = observe(person);
      const values: (number | string)[] = [];
      observables.age.subscribe(value => values.push(value));
      observables.name.subscribe(value => values.push(value));
      expect(values).to.deep.equal([32, "Alice"]);
      proxy.age = 42;
      proxy.name = "Bob";
      expect(values).to.deep.equal([32, "Alice", 42, "Bob"]);
    });

    it("should observe functions", () => {
      const person = new Person(32, "Alice");
      const { observables, proxy } = observe(person);
      const calls: any[][] = [];
      observables.greet.subscribe(args => calls.push(args));
      expect(calls).to.deep.equal([]);
      proxy.greet("Hi");
      expect(calls).to.deep.equal([["Hi"]]);
    });

    it("should replay properties", () => {
      const person = new Person(32, "Alice");
      const { observables, proxy } = observe(person);
      proxy.age = 42;
      proxy.name = "Bob";
      const values: (number | string)[] = [];
      observables.age.subscribe(value => values.push(value));
      observables.name.subscribe(value => values.push(value));
      expect(values).to.deep.equal([42, "Bob"]);
    });

    it("should not replay functions", () => {
      const person = new Person(32, "Alice");
      const { observables, proxy } = observe(person);
      proxy.greet("Hi");
      const calls: any[][] = [];
      observables.greet.subscribe(args => calls.push(args));
      expect(calls).to.deep.equal([]);
    });

    it("should support symbols", () => {
      const person = new Person(32, "Alice");
      person[job] = "engineer";
      const { observables } = observe(person);
      observables[job].subscribe(value => expect(value).to.equal("engineer"));
    });
  });

  describe("inside a constructor", () => {
    class Person {
      age$: Observable<number>;
      name$: Observable<string>;
      greet$: Observable<[string]>;
      constructor(public age: number, public name: string) {
        const { observables, proxy } = observe(this as Person);
        this.age$ = observables.age;
        this.name$ = observables.name;
        this.greet$ = observables.greet;
        return proxy;
      }
      greet(greeting: string): string {
        return `${greeting}, ${this.name}.`;
      }
    }

    it("should observe properties", () => {
      const person = new Person(32, "Alice");
      expect(person).to.have.property("age$");
      expect(person).to.have.property("name$");
      const values: (number | string)[] = [];
      person.age$.subscribe(value => values.push(value));
      person.name$.subscribe(value => values.push(value));
      expect(values).to.deep.equal([32, "Alice"]);
      person.age = 42;
      person.name = "Bob";
      expect(values).to.deep.equal([32, "Alice", 42, "Bob"]);
    });

    it("should observe functions", () => {
      const person = new Person(32, "Alice");
      expect(person).to.have.property("greet$");
      const calls: any[][] = [];
      person.greet$.subscribe(args => calls.push(args));
      expect(calls).to.deep.equal([]);
      person.greet("Hi");
      expect(calls).to.deep.equal([["Hi"]]);
    });
  });

  describe("added callbacks", () => {
    class Component {
      onDestroy$: Observable<[]>;
      onInit$: Observable<[]>;
      constructor() {
        const { observables, proxy } = observe(this as Component, {
          onDestroy: callback<() => void>(),
          onInit: callback<() => void>()
        });
        this.onDestroy$ = observables.onDestroy;
        this.onInit$ = observables.onInit;
        return proxy;
      }
    }

    it("should observe added methods", () => {
      const component = new Component();

      expect(Object.getOwnPropertyNames(component)).to.include("onInit");
      expect(component.hasOwnProperty("onInit")).to.be.true;
      expect("onInit" in component).to.be.true;
      expect(component).to.have.property("onInit");

      expect(Object.getOwnPropertyNames(component)).to.include("onDestroy");
      expect(component.hasOwnProperty("onDestroy")).to.be.true;
      expect("onDestroy" in component).to.be.true;
      expect(component).to.have.property("onDestroy");

      let initialized = false;
      let destroyed = false;
      component.onInit$.subscribe(() => initialized = true);
      component.onDestroy$.subscribe(() => destroyed = true);
      component["onInit"]();
      component["onDestroy"]();
      expect(initialized).to.be.true;
      expect(destroyed).to.be.true;
    });

    it("should not override instance methods", () => {
      const instance = {
        /*tslint:disable-next-line:no-invalid-this*/
        init() { this.initialized = true; },
        initialized: false
      };
      const { observables, proxy } = observe(instance, {
        init: callback()
      });
      let initialized = false;
      observables.init.subscribe(() => initialized = true);
      proxy.init();
      expect(instance).to.have.property("initialized", true);
      expect(initialized).to.be.true;
    });
  });
});
