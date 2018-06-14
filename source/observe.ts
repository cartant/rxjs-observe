/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-observe
 */

import { BehaviorSubject, Observable, Subject } from "rxjs";

export function observe<T extends object>(instance: T): {
    observables: {
        [K in keyof T]: T[K] extends Function ? Observable<any[]> : Observable<T[K]>
    },
    proxy: T
} {

    const subjects: { [key: string]: Subject<any> } = {};

    const proxy = new Proxy(instance, {
        get(target: any, name: string): any {
            let value = target[name];
            if (typeof value === "function") {
                value = function (this: any, ...args: any[]): any {
                    const result = target[name].apply(this, args);
                    const subject = subjects[name];
                    if (subject) {
                        subject.next(args);
                    }
                    return result;
                };
            }
            return value;
        },
        set(target: any, name: string, value: any): boolean {
            target[name] = value;
            const subject = subjects[name];
            if (subject) {
                subject.next(value);
            }
            return true;
        }
    });

    return {
        observables: new Proxy({}, {
            get(target: any, name: string): any {
                let subject = subjects[name];
                if (!subject) {
                    subjects[name] = subject = (typeof instance[name] === "function") ?
                        new Subject<any>() :
                        new BehaviorSubject<any>(instance[name]);
                }
                return subject.asObservable();
            }
        }),
        proxy
    };
}
