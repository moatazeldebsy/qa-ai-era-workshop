import { currentUser } from './session.js';

const $ = (sel) => document.querySelector(sel);

// Text content only, never innerHTML (same rule as app.js).
function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

async function postJson(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { ok: res.ok, status: res.status, body: res.status === 204 ? null : await res.json() };
}

// After signing in from the checkout page, go back there. Only known pages:
// a ?next= that takes any URL would be an open redirect.
function afterSignIn(user) {
  if (new URLSearchParams(location.search).get('next') === 'checkout') location.assign('/checkout.html');
  else showSignedIn(user);
}

function wireForm(form, url, fields) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const error = form.querySelector('[role="alert"]');
    const body = Object.fromEntries(fields.map((f) => [f, form.elements[f].value]));
    const res = await postJson(url, body);
    if (!res.ok) {
      error.textContent = res.body?.error ?? 'Something went wrong. Please try again.';
      return;
    }
    error.textContent = '';
    form.reset();
    afterSignIn(res.body.user);
  });
}

function orderRow(order) {
  const tr = el('tr');
  tr.dataset.testid = `order-${order.id}`;
  const books = order.lines.map((l) => `${l.quantity} × ${l.title}`).join(', ');
  tr.append(
    el('td', order.id.slice(0, 8)),
    el('td', new Date(order.placedAt).toLocaleString()),
    el('td', books),
    el('td', order.total.toFixed(2)),
    el('td', order.state, `state state-${order.state}`),
  );
  const actions = el('td');
  if (order.state === 'paid') {
    const cancel = el('button', 'Cancel order');
    cancel.type = 'button';
    cancel.setAttribute('aria-label', `Cancel order ${order.id.slice(0, 8)}`);
    cancel.addEventListener('click', () => cancelOrder(order.id, cancel));
    actions.append(cancel);
  }
  tr.append(actions);
  return tr;
}

async function cancelOrder(id, button) {
  button.disabled = true;
  const res = await postJson(`/api/orders/${encodeURIComponent(id)}/cancel`, {});
  $('#orders-error').textContent = res.ok ? '' : `Could not cancel the order: ${res.body?.error ?? 'unknown error'}.`;
  await loadOrders();
}

async function loadOrders() {
  const res = await fetch('/api/account/orders');
  if (!res.ok) return showSignedOut();
  const { orders } = await res.json();
  $('#orders tbody').replaceChildren(...orders.map(orderRow));
  $('#orders').hidden = orders.length === 0;
  $('#no-orders').hidden = orders.length > 0;
}

function showSignedOut() {
  $('#signed-in').hidden = true;
  $('#signed-out').hidden = false;
}

async function showSignedIn(user) {
  $('#profile-heading').textContent = `Hello, ${user.name}`;
  $('[data-testid="user-email"]').textContent = user.email;
  $('#signed-out').hidden = true;
  $('#signed-in').hidden = false;
  await loadOrders();
}

wireForm($('#sign-in-form'), '/api/auth/login', ['email', 'password']);
wireForm($('#register-form'), '/api/auth/register', ['name', 'email', 'password']);

$('#sign-out').addEventListener('click', async () => {
  await postJson('/api/auth/logout', {});
  showSignedOut();
});

const user = await currentUser();
if (user) await showSignedIn(user);
else showSignedOut();
