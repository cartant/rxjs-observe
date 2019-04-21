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
  proxy: T & C;
} {
  const defaultedCallbacks: {} = callbacks || {};
  const subjects = new Map<string | symbol, Subject<any>>();
  const proxy = new Proxy(instance, {
    get(target: any, name: string | symbol) {
      const callbacksValue = defaultedCallbacks[name];
      const targetValue = target[name];
      let value = callbacksValue && !targetValue
          ? callbacksValue
          : targetValue;
      if (typeof value === "function") {
        const functionValue = value;
        value = function(this: any, ...args: any[]): any {
          const result = functionValue.apply(this, args);
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
      return (
        Object.getOwnPropertyDescriptor(target, name) ||
        Object.getOwnPropertyDescriptor(defaultedCallbacks, name)
      );
    },
    has(target: any, name: string | symbol) {
      return name in target || name in defaultedCallbacks;
    },
    ownKeys(target: any) {
      return [
        ...Reflect.ownKeys(target),
        ...Reflect.ownKeys(defaultedCallbacks)
      ];
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
              typeof instance[name] === "function" ||
              typeof defaultedCallbacks[name] === "function"
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
