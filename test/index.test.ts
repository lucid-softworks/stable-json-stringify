import { describe, expect, it } from "vitest";

import { CircularJsonError, stableJsonStringify } from "../src/index.js";

describe("stableJsonStringify", () => {
  it("sorts object keys recursively", () => {
    expect(stableJsonStringify({ z: 1, a: { y: 2, b: 3 } })).toBe(
      '{"a":{"b":3,"y":2},"z":1}',
    );
  });

  it("supports indentation and custom ordering", () => {
    expect(
      stableJsonStringify(
        { a: 1, b: 2 },
        { space: 2, compareKeys: (a, b) => b.localeCompare(a) },
      ),
    ).toBe('{\n  "b": 2,\n  "a": 1\n}');
    expect(stableJsonStringify([], { space: -1 })).toBe("[]");
    expect(stableJsonStringify({}, { space: "..............." })).toBe("{}");
  });

  it("uses JSON array and object omission semantics", () => {
    expect(stableJsonStringify([undefined, () => undefined, Symbol("x")])).toBe(
      "[null,null,null]",
    );
    expect(stableJsonStringify({ kept: null, omitted: undefined })).toBe(
      '{"kept":null}',
    );
    expect(stableJsonStringify(undefined)).toBeUndefined();
  });

  it("honors toJSON and permits shared non-circular references", () => {
    const shared = { value: 1 };
    expect(
      stableJsonStringify({ date: new Date(0), left: shared, right: shared }),
    ).toBe(
      '{"date":"1970-01-01T00:00:00.000Z","left":{"value":1},"right":{"value":1}}',
    );
    expect(stableJsonStringify({ toJSON: 1, value: 2 })).toBe(
      '{"toJSON":1,"value":2}',
    );
  });

  it("rejects circular values and bigint", () => {
    const value: { self?: unknown } = {};
    value.self = value;
    expect(() => stableJsonStringify(value)).toThrow(CircularJsonError);
    expect(() => stableJsonStringify(1n)).toThrow("Cannot serialize BigInt");
  });
});
