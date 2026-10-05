import { loadCart, saveCart } from './cart-store.js';
import { currentUser, showAccountLink } from './session.js';

const cart = loadCart(); // bookId -> quantity, kept across pages

const $ = (sel) => document.querySelector(sel);

// Builds an element with text content only - never innerHTML, so nothing from
// the API (or the assistant) is ever parsed as HTML.
function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

async function loadBooks(query = '') {
  const res = await fetch(`/api/books?q=${encodeURIComponent(query)}`);
  const { books } = await res.json();
  const list = $('#book-list');
  list.replaceChildren();
  for (const book of books) {
    const li = el('li', undefined, 'book');
    li.dataset.testid = `book-${book.id}`;
    li.append(el('span', book.title, 'title'), el('span', book.author, 'author'), el('span', `${book.price.toFixed(2)} EUR`, 'price'));
    const button = document.createElement('button');
    button.textContent = book.stock > 0 ? 'Add to cart' : 'Out of stock';
    button.disabled = book.stock === 0;
    button.setAttribute('aria-label', `Add ${book.title} to cart`);
    button.addEventListener('click', () => addToCart(book.id));
    li.appendChild(button);
    list.appendChild(li);
  }
}

async function addToCart(bookId) {
  cart.set(bookId, (cart.get(bookId) ?? 0) + 1);
  await renderCart();
}

// While a price request is in flight the cart says so (aria-busy), for
// screen readers and for tests that need to know when the cart has settled.
let pricing = 0;
function setBusy(delta) {
  pricing += delta;
  $('#cart').setAttribute('aria-busy', String(pricing > 0));
}

async function renderCart() {
  const items = [...cart].map(([bookId, quantity]) => ({ bookId, quantity }));
  const error = $('#cart-error');
  error.textContent = '';
  if (items.length === 0) return true;
  setBusy(+1);
  try {
    const res = await fetch('/api/cart/price', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    const body = await res.json();
    if (!res.ok) {
      error.textContent = body.error;
      return false;
    }
    $('#cart-lines').replaceChildren(...body.lines.map((l) => el('li', `${l.quantity} × ${l.title} — ${l.lineTotal.toFixed(2)} EUR`)));
    $('[data-testid="subtotal"]').textContent = body.subtotal.toFixed(2);
    $('[data-testid="shipping"]').textContent = body.shipping.toFixed(2);
    $('[data-testid="total"]').textContent = body.total.toFixed(2);
    saveCart(cart);
    $('#checkout-link').hidden = false;
    return true;
  } finally {
    setBusy(-1);
  }
}

async function loadRecommendations() {
  const res = await fetch('/api/recommendations');
  const { books } = await res.json();
  const list = $('#recommendations');
  list.replaceChildren(...books.map((b) => el('li', b.title)));
  $('#recs-loading').hidden = true;
  list.hidden = false;
}

$('#search').addEventListener('input', (e) => loadBooks(e.target.value));

$('#assistant-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const question = $('#question').value;
  $('#assistant-answer').textContent = 'Thinking…';
  const res = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  const body = await res.json();
  $('#assistant-answer').textContent = body.answer ?? body.error;
});

loadBooks();
loadRecommendations();
renderCart(); // a cart brought back from the checkout page
currentUser().then((user) => showAccountLink($('#account-link'), user));
