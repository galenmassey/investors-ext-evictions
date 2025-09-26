export function withLastError(promiseLike) {
  // Wrap a chrome.* promise (or thenable) and swallow runtime.lastError into a structured object.
  return Promise.resolve(promiseLike)
    .then((res) => ({ ok: true, res }))
    .catch((err) => {
      const msg = (chrome.runtime && chrome.runtime.lastError && chrome.runtime.lastError.message) || (err && err.message) || String(err);
      return { ok: false, error: msg };
    });
}