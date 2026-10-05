import { loadCart, saveCart, clearCart } from './cart-store.js';
import { currentUser, showAccountLink } from './session.js';
import { createToken, CardError } from './demo-pay.js';

const $ = (sel) => document.querySelector(sel);
const cart = loadCart(); // bookId -> quantity
const error = $('#checkout-error');
let user = null;
let total = 0;

const ADDRESS_FIELDS = { name: 'Full name', street: 'Street and number', city: 'City', postcode: 'Postcode', country: 'Country' };
const CARD_FIELDS = { number: '#card-number', expiry: '#card-expiry', cvc: '#card-cvc' };

// Text content only, never innerHTML (same rule as app.js).
function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function showError(message, field) {
  error.textContent = message;
  for (const input of document.querySelectorAll('#checkout-form input')) input.removeAttribute('aria-invalid');
  if (field) {
    field.setAttribute('aria-invalid', 'true');
    field.focus();
  }
}

// One line of the order: its quantity can change (1-10) or it can go.
function orderLine(line) {
  const li = el('li', undefined, 'order-line');
  li.dataset.testid = `line-${line.bookId}`;
  const id = `qty-${line.bookId}`;
  // Screen readers hear "Quantity of <title>"; the title is already on screen.
  const label = el('label', 'Quantity');
  label.append(el('span', ` of ${line.title}`, 'visually-hidden'));
  label.htmlFor = id;
  const qty = el('input');
  Object.assign(qty, { id, type: 'number', min: 1, max: 10, value: line.quantity });
  qty.addEventListener('change', () => {
    const n = Number(qty.value);
    if (Number.isInteger(n) && n >= 1 && n <= 10) cart.set(line.bookId, n);
    renderOrder();
  });
  const remove = el('button', 'Remove');
  remove.type = 'button';
  remove.setAttribute('aria-label', `Remove ${line.title}`);
  remove.addEventListener('click', () => {
    cart.delete(line.bookId);
    renderOrder();
  });
  li.append(el('span', line.title, 'title'), label, qty, el('span', `${line.lineTotal.toFixed(2)} EUR`), remove);
  return li;
}

async function renderOrder() {
  saveCart(cart);
  const empty = cart.size === 0;
  $('#empty-cart').hidden = !empty;
  $('#checkout-form').hidden = empty;
  if (empty) {
    $('#order-lines').replaceChildren();
    for (const id of ['subtotal', 'shipping', 'total']) $(`[data-testid="${id}"]`).textContent = '0.00';
    return;
  }
  $('#review').setAttribute('aria-busy', 'true');
  try {
    const res = await fetch('/api/cart/price', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: [...cart].map(([bookId, quantity]) => ({ bookId, quantity })) }),
    });
    const body = await res.json();
    if (!res.ok) return showError(body.error);
    showError('');
    $('#order-lines').replaceChildren(...body.lines.map(orderLine));
    $('[data-testid="subtotal"]').textContent = body.subtotal.toFixed(2);
    $('[data-testid="shipping"]').textContent = body.shipping.toFixed(2);
    $('[data-testid="total"]').textContent = body.total.toFixed(2);
    total = body.total;
    $('#pay-button').textContent = `Pay ${total.toFixed(2)} EUR`;
  } finally {
    $('#review').setAttribute('aria-busy', 'false');
  }
}

// What the shop says when it can't take the order, in the customer's words.
function orderFailure(status, body) {
  if (status === 402) return `Payment failed: ${body.error.replace(/^payment failed: /, '')}. No money was taken; try another card.`;
  if (status === 409) return 'Sorry, a book in your order just sold out. Change your order and try again.';
  if (status === 503) return 'Checkout is unavailable: the inventory service is not running. Start the shop with npm run start:all.';
  if (status === 400) return body.error;
  return 'Something went wrong. Please try again.';
}

$('#checkout-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target.elements;

  const email = form.email.value.trim();
  if (!email) return showError('Enter your email address.', form.email);
  const shipTo = {};
  for (const [name, label] of Object.entries(ADDRESS_FIELDS)) {
    shipTo[name] = form[name].value.trim();
    if (!shipTo[name]) return showError(`Enter your ${label.toLowerCase()}.`, form[name]);
  }

  let paymentToken;
  try {
    paymentToken = createToken({ number: $('#card-number').value, expiry: $('#card-expiry').value, cvc: $('#card-cvc').value });
  } catch (err) {
    if (err instanceof CardError) return showError(`Check your card: ${err.message}.`, $(CARD_FIELDS[err.field]));
    throw err;
  }

  const button = $('#pay-button');
  button.disabled = true;
  button.textContent = 'Paying…';
  showError('');
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: [...cart].map(([bookId, quantity]) => ({ bookId, quantity })), customer: { email }, shipTo, paymentToken }),
    });
    const body = await res.json();
    if (!res.ok) return showError(orderFailure(res.status, body));

    clearCart();
    cart.clear();
    $('#review').hidden = true;
    e.target.hidden = true;
    $('[data-testid="order-id"]').textContent = body.id;
    $('[data-testid="order-total"]').textContent = body.total.toFixed(2);
    $('#orders-link').hidden = !user;
    $('#confirmation').hidden = false;
    $('#confirmation-heading').focus();
  } catch {
    showError('Could not reach the shop. Check your connection and try again.');
  } finally {
    button.disabled = false;
    button.textContent = `Pay ${total.toFixed(2)} EUR`;
  }
});

user = await currentUser();
showAccountLink($('#account-link'), user);
if (user) {
  const email = $('#email');
  email.value = user.email;
  email.readOnly = true;
  $('#ship-name').value = user.name;
  $('#guest-note').hidden = true;
  const note = $('#signed-in-note');
  note.textContent = `Signed in as ${user.name}. This order will appear in your account.`;
  note.hidden = false;
}
await renderOrder();
