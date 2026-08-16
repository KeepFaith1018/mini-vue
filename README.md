# mini-vue

一个用于学习 Vue 3 核心源码的精简实现。项目关注关键执行链，而不是完整兼容 Vue。

## 模块

```text
share
  ├─ reactivity
  ├─ compiler-core
  └─ runtime-core
       └─ runtime-dom
```

- `reactivity`：`reactive`、`ref`、`computed`、`effect`、`watch` 和 readonly/shallow 代理。
- `runtime-core`：VNode、组件、渲染器、keyed diff、调度器和内置组件。
- `runtime-dom`：DOM 操作、属性/事件更新、`createApp` 和运行时模板编译。
- `compiler-core`：模板的 parse、transform 和 codegen。

## 核心链路

```text
reactive/ref → effect → scheduler → component update
template → AST → transform → codegen → render → VNode
VNode → patch → keyed diff → DOM
```

## 使用

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

```ts
import { createApp, ref } from "@vue/runtime-dom";

createApp({
  template: `<button @click="increment">{{ count }}</button>`,
  setup() {
    const count = ref(0);
    const increment = () => count.value++;
    return { count, increment };
  },
}).mount("#app");
```

## 有意省略

项目不实现 SSR/hydration、Suspense、Transition、SFC、`<script setup>`、HMR、Devtools、完整指令系统以及生产级错误处理。KeepAlive、Teleport 和异步组件也只保留能展示核心原理的功能。
