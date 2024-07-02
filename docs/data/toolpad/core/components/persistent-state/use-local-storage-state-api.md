# useLocalStorageState API

<p class="description">API reference for the useLocalStorageState hook.</p>

:::success
For examples and details on the usage of this React hook, visit the demo pages:

- [useLocalStorageState](/toolpad/core/react-persistent-state/)

:::

## Import

```js
import useLocalStorageState from '@toolpad/core/useLocalStorageState';
// or
import { useLocalStorageState } from '@toolpad/core';
```

Learn about the difference by reading this [guide](https://mui.com/material-ui/guides/minimizing-bundle-size/) on minimizing bundle size.

## Reference

### `useLocalStorageState`

```js
const [state, setState] = useLocalStorageState('my-key', 'initial value');
```

**Parameters**

- `key`: `string | null` The key under which to store the value in `window.localStorage`.
- `initialValue`: `T | null | () => T` The value to return when nothing is found for the `key` in `window.localStorage`. The value can be lazy computed by providing a function to this parameter.
- `options?`: `object` Additional options for this hook.
  - `codec?`: `Codec<T>` A codec that can encode and decode values of type V to and from strings.
    - `parse`: `(raw: string) => T` Decodes a string value into a value of type V.
    - `stringify`: `(value: T) => string` Encodes a value of type V into a string.

**Returns**

`[T | null, React.Dispatch<React.SetStateAction<T | null>>]` Similar to `React.setState` result, it returns an tupple where the first item represents the state, and the second item a setter for the state.
