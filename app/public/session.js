// Who is signed in, for the header link on every page. The session itself is
// an HttpOnly cookie that scripts can't read; the server answers /api/auth/me.

/** The signed-in user ({ id, name, email }), or null for a guest. */
export async function currentUser() {
  const res = await fetch('/api/auth/me');
  return res.ok ? (await res.json()).user : null;
}

/** Turns the header's "Sign in" link into "My account" when signed in. */
export function showAccountLink(link, user) {
  link.textContent = user ? 'My account' : 'Sign in';
}
