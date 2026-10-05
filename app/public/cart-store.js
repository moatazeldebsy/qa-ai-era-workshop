// The cart survives moving between pages (shop → checkout) in sessionStorage:
// per tab, gone when the tab closes. Storage can be unavailable (private
// windows, blocked site data), so every access is guarded and the shop still
// works, it just forgets the cart on navigation.
const KEY = 'quality-books-cart';

/** The saved cart as a Map of bookId -> quantity (empty if none). */
export function loadCart() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
    return new Map(saved.filter(([id, qty]) => Number.isInteger(id) && Number.isInteger(qty) && qty > 0));
  } catch {
    return new Map();
  }
}

export function saveCart(cart) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify([...cart]));
  } catch {
    // storage unavailable: the cart lives only on this page
  }
}

export function clearCart() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing saved
  }
}
