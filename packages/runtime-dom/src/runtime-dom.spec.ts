import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createApp,
  defineAsyncComponent,
  h,
  nextTick,
  onBeforeUnmount,
  onUnmounted,
  ref,
  render,
  Teleport,
} from "./index";

describe("runtime-dom", () => {
  let container: HTMLDivElement;
  beforeEach(() => {
    container = document.createElement("div");
  });

  it("mounts and patches element props and children", () => {
    render(h("div", { class: "old", id: "one" }, "hello"), container);
    expect(container.innerHTML).toBe(
      '<div class="old" id="one">hello</div>'
    );
    render(h("div", { class: "new" }, [h("span", null, "child")]), container);
    expect(container.innerHTML).toBe(
      '<div class="new"><span>child</span></div>'
    );
  });

  it("performs keyed diff with minimal correct ordering", () => {
    const children = (keys: string[]) =>
      h(
        "div",
        null,
        keys.map((key) => h("p", { key }, key))
      );
    render(children(["a", "b", "c", "d"]), container);
    render(children(["d", "b", "a", "e", "c"]), container);
    expect(container.textContent).toBe("dbaec");
  });

  it("batches component updates and supports createApp lifecycle", async () => {
    const count = ref(0);
    const beforeUnmount = vi.fn();
    const unmounted = vi.fn();
    const App = {
      setup() {
        onBeforeUnmount(beforeUnmount);
        onUnmounted(unmounted);
        return { count };
      },
      render() {
        return h("button", null, this.count);
      },
    };
    const app = createApp(App);
    app.mount(container);
    count.value = 1;
    count.value = 2;
    await nextTick();
    expect(container.textContent).toBe("2");
    app.unmount();
    expect(beforeUnmount).toHaveBeenCalledOnce();
    expect(unmounted).toHaveBeenCalledOnce();
    expect(container.innerHTML).toBe("");
  });

  it("compiles component templates at runtime", async () => {
    const message = ref("hello");
    createApp({
      template: '<div class="message">{{ message }}</div>',
      setup: () => ({ message }),
    }).mount(container);
    expect(container.innerHTML).toBe('<div class="message">hello</div>');
    message.value = "updated";
    await nextTick();
    expect(container.textContent).toBe("updated");
  });

  it("mounts multiple template roots through a Fragment", () => {
    createApp({
      template: "<h1>first</h1><p>second</p>",
    }).mount(container);
    expect(container.innerHTML).toBe("<h1>first</h1><p>second</p>");
  });

  it("mounts, moves and unmounts teleported children", () => {
    const first = document.createElement("div");
    first.id = "first";
    const second = document.createElement("div");
    second.id = "second";
    document.body.append(first, second);
    render(h(Teleport, { to: "#first" }, [h("span", null, "away")]), container);
    expect(first.textContent).toBe("away");
    render(h(Teleport, { to: "#second" }, [h("span", null, "moved")]), container);
    expect(first.textContent).toBe("");
    expect(second.textContent).toBe("moved");
    render(null, container);
    expect(second.textContent).toBe("");
    first.remove();
    second.remove();
  });

  it("renders an async component", async () => {
    const Async = defineAsyncComponent(() =>
      Promise.resolve({ render: () => h("div", null, "async") })
    );
    render(h(Async), container);
    await vi.waitFor(() => expect(container.textContent).toBe("async"));
  });
});
