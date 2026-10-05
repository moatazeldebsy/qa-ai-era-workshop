// Sales reporting for the shop's back office (Topic 7). Works on a list of
// orders as the shop stores them:
//   { id, state, placedAt, customer: { email }, lines: [{ bookId, title, quantity, lineTotal }], total }
//
// Revenue means money the shop keeps: cancelled orders were never charged,
// and refunded orders were paid back.

const cents = (n) => Math.round(n * 100) / 100;

export function salesReport(orders) {
  const byBook = new Map();
  const byCustomer = new Map();
  let revenue = 0;

  for (const order of orders) {
    revenue += order.total;
    byCustomer.set(order.customer.email, cents((byCustomer.get(order.customer.email) ?? 0) + order.total));
    for (const line of order.lines) {
      const book = byBook.get(line.bookId) ?? { bookId: line.bookId, title: line.title, copies: 0, revenue: 0 };
      book.copies += line.quantity;
      book.revenue = cents(book.revenue + line.lineTotal);
      byBook.set(line.bookId, book);
    }
  }

  const topCustomer = [...byCustomer].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return {
    orders: orders.length,
    revenue: cents(revenue),
    averageOrderValue: orders.length ? cents(revenue / orders.length) : 0,
    books: [...byBook.values()].sort((a, b) => b.revenue - a.revenue || a.bookId - b.bookId),
    topCustomer: topCustomer ? { email: topCustomer[0], spent: topCustomer[1] } : null,
  };
}
