---
productId: toolpad-core
title: Persistent storage state
---

# Persistent storage state

<p class="description">Hooks for synchronizing React state with browser storage.</p>

Toolpad provides a set of primitives that harmonize how you deal with persisting global state in the browser. Through our hooks you can synchronise React state with local storage or session storage, or in the url as a query parameter. These hooks all follow a similar philosophy: they identify their data with a unique key and support rich data types through the use of codecs.

The hook's signature intentionally resembles the `React.useState` hook. Where the first parameter represents the key under which to store the state in the browser, and the second parameter corresponds to the initial value. An optional third parameter can be used to configure the hook.

## Local Storage

### String values

The default behavior of the hook is to read and write string values. All you have to do is provide a storage key and the hook does the rest. You can provide an initial value as the second parameter. Just like the `React.useState` hook, you can provide an initializer function in case calculating the initial value is a heavy operation. The hook will always return `null` during SSR and hydration.

{{"demo": "LocalStorageStateString.js"}}

Open this <a target="_blank" href="#string-values">page</a> in another tab to see the hook in action.

**important** Passing `null` to `setState` results in removing the value from storage.

### Rich data types

If you need to store values other than strings, you can use the `codec` parameter in the hook options to declare the methods used for serialization and deserialization. A codec contains a `parse` method and `stringify` method.

{{"demo": "LocalStorageStateCustom.js"}}

Codecs make it possible to use this hook in a type safe way.

### Error handling

The `useLocalStorageState` hook returns `null` when local storage is not available for some reason. Errors in the codec's `parse` method will always be propagated. If you want to handle parsing errors, you will have to do so in the codec.

{{"demo": "LocalStorageStateError.js"}}

### Custom validation

For complex data types you can pair these hooks with a typed validation library such as [`zod`](https://www.npmjs.com/package/zod).

{{"demo": "LocalStorageStateZod.js"}}

## Session Storage

The `useSessionStorageState` hook works identical to the [`useLocalStorageState`](#local-storage) hook, except that it reads and writes from `window.sessionStorage` instead of `window.localStorage`.

## Search Parameters

🚧 Coming soon

## Hook API

- [`useLocalStorageState()`](/toolpad/core/react-persistent-state/use-local-storage-state-api/)
- [`useSessionStorageState()`](/toolpad/core/react-persistent-state/use-session-storage-state-api/)
