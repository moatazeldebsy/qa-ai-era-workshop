import { findBook } from './catalog.js';

export const FREE_SHIPPING_THRESHOLD = 50;
export const SHIPPING_FEE = 4.9;

/**
 * Price a cart. items: [{ bookId, quantity }].
 * Returns { lines, subtotal, shipping, total } or throws a ValidationError.
 *
 * BUG_MODE=cart re-introduces a classic regression (free shipping applied at
 * >= threshold on the *unrounded* per-line maths, and quantity ignored for the
 * shipping check). Lab 7 uses it to show a quality gate catching a defect
 * before release.
 */
export function priceCart(items, { bugMode = process.env.BUG_MODE } = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('items must be a non-empty array');
  }
  const lines = items.map(({ bookId, quantity }) => {
    const book = findBook(bookId);
    if (!book) throw new ValidationError(`unknown book ${bookId}`);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new ValidationError('quantity must be an integer from 1 to 10');
    }
    if (quantity > book.stock) {
      throw new ValidationError(`only ${book.stock} of "${book.title}" in stock`);
    }
    return { bookId: book.id, title: book.title, quantity, lineTotal: round(book.price * quantity) };
  });

  const subtotal = round(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  const shippingBase = bugMode === 'cart' ? Math.max(...lines.map((l) => l.lineTotal / l.quantity)) : subtotal;
  const shipping = shippingBase >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  return { lines, subtotal, shipping, total: round(subtotal + shipping) };
}

export class ValidationError extends Error {}

function round(n) {
  return Math.round(n * 100) / 100;
}
