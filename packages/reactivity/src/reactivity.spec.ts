import { describe, expect, it, vi } from "vitest";
import {
  computed,
  effect,
  isReactive,
  isReadonly,
  proxyRefs,
  reactive,
  readonly,
  ref,
  shallowReactive,
  stop,
  toRefs,
  watch,
} from "./index";

describe("reactivity", () => {
  it("tracks, triggers and cleans conditional dependencies", () => {
    const state = reactive({ ok: true, a: 1, b: 2 });
    let value;
    let runs = 0;
    effect(() => {
      runs++;
      value = state.ok ? state.a : state.b;
    });
    state.ok = false;
    state.a++;
    expect(value).toBe(2);
    expect(runs).toBe(2);
  });

  it("supports runner and stop", () => {
    const state = reactive({ value: 1 });
    const onStop = vi.fn();
    let value;
    const runner = effect(() => (value = state.value), { onStop });
    stop(runner);
    state.value = 2;
    expect(value).toBe(1);
    runner();
    expect(value).toBe(2);
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("wraps replacement ref objects and caches computed values", () => {
    const source = ref({ count: 1 });
    source.value = { count: 2 };
    expect(isReactive(source.value)).toBe(true);
    const getter = vi.fn(() => source.value.count * 2);
    const doubled = computed(getter);
    expect(doubled.value).toBe(4);
    expect(doubled.value).toBe(4);
    expect(getter).toHaveBeenCalledOnce();
  });

  it("supports readonly, shallow proxies, toRefs and proxyRefs", () => {
    const raw = { nested: { count: 1 }, value: 1 };
    expect(isReadonly(readonly(raw))).toBe(true);
    expect(isReactive(shallowReactive(raw).nested)).toBe(false);
    const state = reactive(raw);
    const refs = toRefs(state) as any;
    refs.value.value = 2;
    expect(state.value).toBe(2);
    expect((proxyRefs({ value: ref(3), empty: null }) as any).value).toBe(3);
  });

  it("watches values and runs cleanup", async () => {
    const value = ref(0);
    const cleanup = vi.fn();
    const callback = vi.fn((_value, _old, onCleanup) => onCleanup(cleanup));
    const unwatch = watch(value, callback, { immediate: true });
    value.value++;
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(2);
    expect(cleanup).toHaveBeenCalledOnce();
    unwatch();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });
});
