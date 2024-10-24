import { ref } from "@vue/reactivity";
import { h } from "./h";
import { isFunction } from "@vue/share";

export function defineAsyncComponent(options) {
  if (isFunction(options)) {
    options = { loader: options };
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
      const error = ref(false); // 超时
      const loading = ref(false); // 加载
      let comp = null;

      let loadingTimer = null;
      loadingTimer = setTimeout(() => {
        loading.value = true;
      }, delay);

      let attempts = 0;
      function loadFunc() {
        return loader().catch((err) => {
          // 手动处理异常
          if (onError) {
            console.log(1);

            return new Promise((resolve, reject) => {
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
        .then((value) => {
          comp = value;
          loaded.value = true;
        })
        .catch((err) => {
          console.error(err);

          error.value = true;
        })
        .finally(() => {
          loading.value = false;
          clearTimeout(loadingTimer);
        });
      if (timeout) {
        setTimeout(() => {
          error.value = true;
        }, timeout);
      }
      const defaultComponent = h("div", { a: 1 }, "moren");
      return () => {
        if (loaded.value) {
          return h(comp);
        } else if (error.value && errorComponent) {
          return h(errorComponent);
        } else if ((loading.value, loadingComponent)) {
          return h(loadingComponent);
        } else {
          return defaultComponent;
        }
      };
    },
  };
}
