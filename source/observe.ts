/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-observe
 */

import { BehaviorSubject, Observable, Subject } from "rxjs";

export type Observables<T extends object, C extends object = {}> = {
  [K in keyof T]: T[K] extends (...args: infer U) => any
    ? Observable<U>
    : Observable<T[K]>;
} &
  {
    [K in keyof C]: C[K] extends (...args: infer U) => any
      ? Observable<U>
      : Observable<C[K]>;
  };

export function observe<T extends object, C extends object>(
  instance: T,
  callbacks?: C
): {
  observables: Observables<T, C>;
  proxy: T & C;
} {
  const fallbacks: {} = callbacks || {};
  const functions = new Map<Function, Function>();
  const subjects = new Map<string | symbol, Subject<any>>();
  const proxy = new Proxy(instance, {
    get(target: any, name: string | symbol) {
      const fallbackValue = fallbacks[name];
      const targetValue = target[name];
      let value = fallbackValue && !targetValue ? fallbackValue : targetValue;
      if (typeof value === "function") {
        const functionValue = value;
        let functionWrapper = functions.get(functionValue);
        if (!functionWrapper) {
          functionWrapper = function(this: any, ...args: any[]): any {
            const result = functionValue.apply(this, args);
            const subject = subjects.get(name);
            if (subject) {
              subject.next(args);
            }
            return result;
          };
          functions.set(functionValue, functionWrapper);
        }
        value = functionWrapper;
      }
      return value;
    },
    getOwnPropertyDescriptor(target: any, name: string | symbol) {
      return (
        Object.getOwnPropertyDescriptor(target, name) ||
        Object.getOwnPropertyDescriptor(fallbacks, name)
      );
    },
    has(target: any, name: string | symbol) {
      return name in target || name in fallbacks;
    },
    ownKeys(target: any) {
      return [...Reflect.ownKeys(target), ...Reflect.ownKeys(fallbacks)];
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
              typeof fallbacks[name] === "function"
                ? new Subject<any>()
                : new BehaviorSubject(instance[name]);
            subjects.set(name, subject);
          }
          return subject.asObservable();
        }
      }
    ),
    proxy
  };
}

export function callback<T extends Function>(): T {
  return (() => {}) as any;
}
