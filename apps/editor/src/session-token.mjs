// The hash is a one-time bootstrap credential. Reloads reuse this tab's session.
export function readSessionToken(location, storage, history) {
  const supplied = new URLSearchParams(location.hash.slice(1)).get('token');
  let token = supplied;
  try {
    if (supplied) storage.setItem('axiom.session-token', supplied);
    else token = storage.getItem('axiom.session-token');
  } catch { /* The bootstrap URL still works when browser storage is disabled. */ }
  history.replaceState(null, '', location.pathname + location.search);
  return token;
}
