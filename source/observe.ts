/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-observe
 */

import { BehaviorSubject, noop, Observable, Subject } from "rxjs";

export function observe<T extends object, C extends object>(
  instance: T,
  callbacks?: C
): {
  observables: {
    [K in keyof T]: T[K] extends (...args: infer U) => any
      ? Observable<U>
      : Observable<T[K]>
  } &
    {
      [K in keyof C]: C[K] extends (...args: infer U) => any
        ? Observable<U>
        : Observable<C[K]>
    };
  proxy: T;
} {
  const subjects = new Map<string | symbol, Subject<any>>();
  const proxy = new Proxy(instance, {
    get(target: any, name: string | symbol) {
      let value =
        callbacks && callbacks.hasOwnProperty(name)
          ? callbacks[name]
          : target[name];
      if (typeof value === "function") {
        const func = value;
        value = function(this: any, ...args: any[]): any {
          const result = func.apply(this, args);
          const subject = subjects.get(name);
          if (subject) {
            subject.next(args);
          }
          return result;
        };
      }
      return value;
    },
    getOwnPropertyDescriptor(target: any, name: string | symbol) {
      if (callbacks && callbacks.hasOwnProperty(name)) {
        return Object.getOwnPropertyDescriptor(callbacks, name);
      }
      return Object.getOwnPropertyDescriptor(target, name);
    },
    has(target: any, name: string | symbol) {
      if (callbacks && callbacks.hasOwnProperty(name)) {
        return name in callbacks || name in target;
      }
      return name in target;
    },
    ownKeys(target: any) {
      return [...Reflect.ownKeys(target), ...Reflect.ownKeys(callbacks || {})];
    },
    set(target: any, name: string | symbol, value: any) {
      target[name] = value;
      const subject = subjects.get(name);
      if (subject) {
        subject.next(value);
      }
      return true;
    }
  });
  return {
    observables: new Proxy(
      {},
      {
        get(target: any, name: string | symbol): any {
          let subject = subjects.get(name);
          if (!subject) {
            subject =
              typeof instance[name] === "function"
                ? new Subject<any>()
                : new BehaviorSubject<any>(instance[name]);
            subjects.set(name, subject);
          }
          return subject.asObservable();
        }
      }
    ),
    proxy
  };
}

export function callback<T = typeof noop>(): T {
  return noop as any;
}
