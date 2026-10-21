/**
 * Inside a workflow, a Swell call that's refused doesn't throw: it resolves
 * with `{ errors }` (or `{ error }` and no record), where the same call in a
 * function throws. A refused read would then look like a store with nothing in
 * it, and the run would save and email a report of zeros. Every call the
 * workflow makes goes through this wrapper, which turns a refusal into a thrown
 * error, so the step fails visibly instead.
 */

/** Thrown for a call Swell refused, with its method, path and reason. */
export class SwellRefusal extends Error {
  constructor(method: string, path: string, reason: string) {
    super(`Swell refused ${method.toUpperCase()} ${path}: ${reason}`);
    this.name = 'SwellRefusal';
  }
}

/**
 * The reason Swell gave, or null for a normal answer. A record that carries
 * its own `error` field (a notification that failed to send) is a normal
 * answer: it has an id. So is an empty result or a missing record.
 */
export function refusalReason(response: unknown): string | null {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    return null;
  }
  const body = response as Record<string, unknown>;
  if (body.errors && typeof body.errors === 'object' && Object.keys(body.errors).length > 0) {
    return JSON.stringify(body.errors);
  }
  if (typeof body.error === 'string' && body.error && !('id' in body) && !('results' in body)) {
    return body.error;
  }
  return null;
}

const CHECKED = new Set(['get', 'post', 'put', 'delete']);

/**
 * `swell` with every get, post, put and delete checked for a refusal. Anything
 * else (such as `settings()`) goes to the real client unchanged.
 */
export function failOnRefusal<T extends object>(swell: T): T {
  return new Proxy(swell, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') {
        return value;
      }
      if (typeof property !== 'string' || !CHECKED.has(property)) {
        return value.bind(target);
      }
      return async (path: string, ...rest: unknown[]) => {
        const response = await value.call(target, path, ...rest);
        const reason = refusalReason(response);
        if (reason) {
          throw new SwellRefusal(property, path, reason);
        }
        return response;
      };
    },
  });
}
