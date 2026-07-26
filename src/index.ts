export interface StableJsonStringifyOptions {
  readonly space?: number | string;
  readonly compareKeys?: (left: string, right: string) => number;
}

export class CircularJsonError extends TypeError {
  override readonly name = "CircularJsonError";
  constructor() {
    super("Cannot serialize a circular JSON structure");
  }
}

/** Serializes JSON with deterministic object-key ordering. */
export function stableJsonStringify(
  value: unknown,
  options: StableJsonStringifyOptions = {},
): string | undefined {
  const indentation =
    typeof options.space === "number"
      ? " ".repeat(Math.min(10, Math.max(0, Math.trunc(options.space))))
      : (options.space ?? "").slice(0, 10);
  return serialize(
    value,
    "",
    indentation,
    options.compareKeys ?? ((left, right) => left.localeCompare(right)),
    new WeakSet(),
  );
}

function serialize(
  value: unknown,
  prefix: string,
  indentation: string,
  compareKeys: (left: string, right: string) => number,
  ancestors: WeakSet<object>,
): string | undefined {
  if (value !== null && typeof value === "object" && "toJSON" in value) {
    const toJSON = Reflect.get(value, "toJSON") as unknown;
    if (typeof toJSON === "function") {
      value = Reflect.apply(toJSON, value, []);
    }
  }
  if (typeof value === "bigint") throw new TypeError("Cannot serialize BigInt");
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (ancestors.has(value)) throw new CircularJsonError();
  ancestors.add(value);

  const nextPrefix = prefix + indentation;
  const separator = indentation ? ": " : ":";
  let result: string;
  if (Array.isArray(value)) {
    const items = value.map(
      (item) =>
        serialize(item, nextPrefix, indentation, compareKeys, ancestors) ??
        "null",
    );
    result = join("[", "]", items, prefix, nextPrefix, indentation);
  } else {
    const keys = Object.keys(value);
    keys.sort(compareKeys);
    const items = keys.flatMap((key) => {
      const serialized = serialize(
        Reflect.get(value, key) as unknown,
        nextPrefix,
        indentation,
        compareKeys,
        ancestors,
      );
      return serialized === undefined
        ? []
        : [`${JSON.stringify(key)}${separator}${serialized}`];
    });
    result = join("{", "}", items, prefix, nextPrefix, indentation);
  }
  ancestors.delete(value);
  return result;
}

function join(
  open: string,
  close: string,
  items: readonly string[],
  prefix: string,
  nextPrefix: string,
  indentation: string,
): string {
  if (items.length === 0) return open + close;
  return indentation
    ? `${open}\n${nextPrefix}${items.join(`,\n${nextPrefix}`)}\n${prefix}${close}`
    : `${open}${items.join(",")}${close}`;
}
