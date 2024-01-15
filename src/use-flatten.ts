import type { FlattenVal } from "value-enhancer";
import { type ReadonlyVal, isVal, identity, flatten } from "value-enhancer";

import { useDebugValue, useEffect, useRef, useState } from "react";
import { useForceUpdate, useIsomorphicLayoutEffect } from "./utils";

/**
 * Accepts a val from anywhere and returns the latest value of the flatten val.
 * Re-rendering is triggered when the derived value changes (`Object.is` comparison from React `useState`).
 *
 * @param val$ A val of val.
 * @returns the value of the flatten val.
 */
export function useFlatten<TValOrValue = any>(
  val$: ReadonlyVal<TValOrValue>
): FlattenVal<TValOrValue>;
/**
 * Accepts a val from anywhere and returns the latest value of the flatten val.
 * Re-rendering is triggered when the derived value changes (`Object.is` comparison from React `useState`).
 *
 * @param val$ A val of val.
 * @returns the value of the flatten val.
 */
export function useFlatten<TValOrValue = any>(
  val$?: ReadonlyVal<TValOrValue>
): FlattenVal<TValOrValue> | undefined;
/**
 * Accepts a val from anywhere and returns the latest value of the flatten val.
 * Re-rendering is triggered when the derived value changes (`Object.is` comparison from React `useState`).
 *
 * @param val$ A val of val.
 * @param get A pure function that gets the inner from `val$`.
 * @param eager Trigger subscription callback synchronously. Default false.
 * @returns the value of the flatten val.
 */
export function useFlatten<TSrcValue = any, TValOrValue = any>(
  val$: ReadonlyVal<TSrcValue>,
  get: (value: TSrcValue) => TValOrValue,
  eager?: boolean
): FlattenVal<TValOrValue>;
/**
 * Accepts a val from anywhere and returns the latest value of the flatten val.
 * Re-rendering is triggered when the derived value changes (`Object.is` comparison from React `useState`).
 *
 * @param val$ A val of val.
 * @param get A pure function that gets the inner from `val$`.
 * @param eager Trigger subscription callback synchronously. Default false.
 * @returns the value of the flatten `val$`, or undefined if val is undefined.
 */
export function useFlatten<TSrcValue = any, TValOrValue = any>(
  val$: ReadonlyVal<TSrcValue> | undefined,
  get: (value: TSrcValue) => TValOrValue,
  eager?: boolean
): FlattenVal<TValOrValue> | undefined;
export function useFlatten<TSrcValue = any, TValOrValue = any>(
  val$?: ReadonlyVal<TSrcValue>,
  get = identity as (value: TSrcValue) => TValOrValue,
  eager?: boolean
): FlattenVal<TValOrValue> | undefined {
  const [value, setValue] = useState<FlattenVal<TValOrValue> | undefined>(
    () => {
      if (isVal(val$)) {
        const innerVal$ = get(val$.value);
        return isVal(innerVal$) ? innerVal$.value : innerVal$;
      }
    }
  );
  const getRef = useRef(get);
  // track last src value after value is set
  const lastSrcValueRef = useRef(val$?.value);
  const forceUpdate = useForceUpdate();

  useIsomorphicLayoutEffect(() => {
    // keep track of the latest `get` before entering
    // `useEffect` stage to avoid stale value due to async update
    getRef.current = get;
  }, [get]);

  useEffect(() => {
    if (val$) {
      const innerVal$ = flatten(val$, value =>
        getRef.current((lastSrcValueRef.current = value))
      );

      // check stale value due to async update
      if (val$.value !== lastSrcValueRef.current) {
        setValue(innerVal$.get);
      }

      return innerVal$.reaction(() => {
        setValue(innerVal$.get);
        // re-rendering is triggered based on val reaction not from React `useState`
        forceUpdate();
      }, eager);
    } else {
      setValue((lastSrcValueRef.current = void 0));
    }
  }, [val$, eager]);

  useDebugValue(value);

  return value;
}
