import { ref } from "@vue/reactivity";
import { h } from "./h";
import { isFunction } from "@vue/share";
import type { Component, ComponentOptions } from "./component";

export interface AsyncComponentOptions {
  loader: () => Promise<unknown>;
  errorComponent?: Component;
  timeout?: number;
  delay?: number;
  loadingComponent?: Component;
  onError?: (
    err: unknown,
    retry: () => void,
    fail: () => void,
    attempts: number
  ) => void;
}

export function defineAsyncComponent(
  options: AsyncComponentOptions | AsyncComponentOptions["loader"]
): ComponentOptions {
  if (isFunction(options)) {
    // isFunction 收窄后是宽泛的 Function,断言回 loader 的具体签名
    options = { loader: options as AsyncComponentOptions["loader"] };
  }
  return {
    setup() {
      const {
        loader,
        errorComponent,
        timeout,
        delay,
        loadingComponent,
        onError,
      } = options;
      const loaded = ref(false);
      // 初始 null,出错后换成 Error —— 值类型会变,必须显式给泛型
      const error = ref<unknown>(null); // 加载错误
      const loading = ref(false); // 加载
      let comp: Component | null = null;
      // Node 的 clearTimeout 声明接受 undefined 而非 null,与类型声明对齐(运行时两者等价)
      let timeoutTimer: ReturnType<typeof setTimeout> | undefined = undefined;

      let loadingTimer: ReturnType<typeof setTimeout> | undefined = undefined;
      if (delay == null || delay === 0) loading.value = true;
      else {
        loadingTimer = setTimeout(() => {
          loading.value = true;
        }, delay);
      }

      let attempts = 0;
      function loadFunc(): Promise<unknown> {
        return loader().catch((err: unknown) => {
          // 手动处理异常
          if (onError) {
            console.log(1);

            return new Promise<unknown>((resolve, reject) => {
              const retry = () => resolve(loadFunc());
              const fail = () => reject(err);
              onError(err, retry, fail, ++attempts);
            });
          } else {
            throw err;
          }
        });
      }

      loadFunc()
        .then((value: unknown) => {
          // 兼容两种加载结果:带 default 的模块 或 组件本身
          comp =
            (value as { default?: Component })?.default || (value as Component);
          loaded.value = true;
        })
        .catch((err: unknown) => {
          console.error(err);

          error.value = err;
        })
        .finally(() => {
          loading.value = false;
          clearTimeout(loadingTimer);
          clearTimeout(timeoutTimer);
        });
      if (timeout) {
        timeoutTimer = setTimeout(() => {
          error.value = new Error(
            `Async component timed out after ${timeout}ms.`
          );
        }, timeout);
      }
      const defaultComponent = h("div", { a: 1 }, "moren");
      return () => {
        if (loaded.value) {
          return h(comp!);
        } else if (error.value && errorComponent) {
          return h(errorComponent);
        } else if (loading.value && loadingComponent) {
          return h(loadingComponent);
        } else {
          return defaultComponent;
        }
      };
    },
  };
}
