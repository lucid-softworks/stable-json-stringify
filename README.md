# `@lucid-softworks/stable-json-stringify`

Deterministic JSON serialization with recursive key sorting, optional custom key
ordering, and standard JSON omission behavior.

```ts
import { stableJsonStringify } from "@lucid-softworks/stable-json-stringify";

stableJsonStringify({ z: 1, a: 2 }); // '{"a":2,"z":1}'
```

`space` follows `JSON.stringify` indentation limits. Circular structures throw
`CircularJsonError`; BigInt values remain unsupported like native JSON.
