/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-observe
 */
/*tslint:disable:no-unused-expression*/

import { expect } from "chai";
import { Observable } from "rxjs";
import { observe } from "./observe";

describe("observe", () => {

    describe("outside a constructor", () => {

        class Person {
            constructor(public age: number, public name: string) {}
            greet(greeting: string): string { return `${greeting}, ${this.name}.`; }
        }

        it("should observe properties", () => {
            const person = new Person(32, "Alice");
            const observables = observe(person);
            const received: (number | string)[] = [];
            observables.age.subscribe(value => received.push(value));
            observables.name.subscribe(value => received.push(value));
            expect(received).to.deep.equal([]);
            observables.proxy.age = 42;
            observables.proxy.name = "Bob";
            expect(received).to.deep.equal([42, "Bob"]);
        });

        it("should observe functions", () => {
            const person = new Person(32, "Alice");
            const observables = observe(person);
            const called: any[][] = [];
            observables.greet.subscribe(args => called.push(args));
            expect(called).to.deep.equal([]);
            observables.proxy.greet("Hi");
            expect(called).to.deep.equal([["Hi"]]);
        });
    });

    describe("inside a constructor", () => {

        class Person {
            age$: Observable<number>;
            name$: Observable<string>;
            greet$: Observable<any[]>;
            constructor(public age: number, public name: string) {
                const observables = observe<Person>(this);
                this.age$ = observables.age;
                this.name$ = observables.name;
                this.greet$ = observables.greet;
                return observables.proxy;
            }
            greet(greeting: string): string { return `${greeting}, ${this.name}.`; }
        }

        it("should observe properties", () => {
            const person = new Person(32, "Alice");
            expect(person).to.have.property("age$");
            expect(person).to.have.property("name$");
            const received: (number | string)[] = [];
            person.age$.subscribe(value => received.push(value));
            person.name$.subscribe(value => received.push(value));
            expect(received).to.deep.equal([]);
            person.age = 42;
            person.name = "Bob";
            expect(received).to.deep.equal([42, "Bob"]);
        });

        it("should observe functions", () => {
            const person = new Person(32, "Alice");
            expect(person).to.have.property("greet$");
            const called: any[][] = [];
            person.greet$.subscribe(args => called.push(args));
            expect(called).to.deep.equal([]);
            person.greet("Hi");
            expect(called).to.deep.equal([["Hi"]]);
        });
    });
});
