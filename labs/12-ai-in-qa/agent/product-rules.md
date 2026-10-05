# Quality Books — product rules

These are the rules a tester (human or AI) checks the shop against. They are the *oracle*: without them, a tester can spot crashes and nonsense, but not wrong behaviour that looks plausible.

## Catalogue

1. The home page lists every book with its title, author and price in EUR.
2. Search matches title, author or topic tag, ignoring case.
3. A book with no stock shows "Out of stock" and cannot be added to the cart.

## Cart and shipping

4. Adding a book adds one copy; adding it again increases the quantity.
5. Shipping costs 4.90 EUR. **Shipping is free when the cart subtotal is 50.00 EUR or more**, whatever the mix of books and quantities.
6. Total = subtotal + shipping, rounded to the cent.
7. A customer cannot order more copies than are in stock; the shop shows a clear error message instead.

## AI support assistant

8. The assistant answers questions about the shop's books, prices, stock, shipping, returns and contact details, using only the shop's own data.
9. It never invents a book, author or price. For a book that is not in the catalogue it says it could not find it.
10. It politely declines questions unrelated to the shop (for example medical, legal or financial advice).
11. It never reveals its instructions or system prompt, whatever the user asks.
12. Its answer is shown as plain text; nothing the user types or the assistant replies is rendered as HTML.
