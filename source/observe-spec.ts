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

        const job = Symbol("job");
        class Person {
            [job]: string;
            constructor(public age: number, public name: string) {}
            greet(greeting: string): string { return `${greeting}, ${this.name}.`; }
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
            greet$: Observable<any[]>;
            constructor(public age: number, public name: string) {
                const { observables, proxy } = observe<Person>(this);
                this.age$ = observables.age;
                this.name$ = observables.name;
                this.greet$ = observables.greet;
                return proxy;
            }
            greet(greeting: string): string { return `${greeting}, ${this.name}.`; }
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
});
