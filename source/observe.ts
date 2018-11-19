/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-observe
 */

import { BehaviorSubject, Observable, Subject } from "rxjs";

export function observe<T extends object>(instance: T): {
    observables: {
        [K in keyof T]: T[K] extends (...args: infer U) => any ? Observable<U> : Observable<T[K]>
    },
    proxy: T
} {
    const subjects = new Map<string | symbol, Subject<any>>();
    const proxy = new Proxy(instance, {
        get(target: any, name: string | symbol): any {
            let value = target[name];
            if (typeof value === "function") {
                value = function (this: any, ...args: any[]): any {
                    const result = target[name].apply(this, args);
                    const subject = subjects.get(name);
                    if (subject) {
                        subject.next(args);
                    }
                    return result;
                };
            }
            return value;
        },
        set(target: any, name: string | symbol, value: any): boolean {
            target[name] = value;
            const subject = subjects.get(name);
            if (subject) {
                subject.next(value);
            }
            return true;
        }
    });
    return {
        observables: new Proxy({}, {
            get(target: any, name: string | symbol): any {
                let subject = subjects.get(name);
                if (!subject) {
                    subject = (typeof instance[name] === "function") ?
                        new Subject<any>() :
                        new BehaviorSubject<any>(instance[name]);
                    subjects.set(name, subject);
                }
                return subject.asObservable();
            }
        }),
        proxy
    };
}
