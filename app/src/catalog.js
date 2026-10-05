// The demo shop's catalogue. Deliberately small and static so tests, load
// scripts and LLM evals can all assert on exact values.
export const books = [
  { id: 1, title: 'Testing in Production', author: 'R. Sharma', price: 29.99, stock: 12, tags: ['observability', 'devops'] },
  { id: 2, title: 'The Pragmatic Tester', author: 'L. Okafor', price: 24.5, stock: 0, tags: ['fundamentals'] },
  { id: 3, title: 'Prompting for QA', author: 'M. Chen', price: 34.0, stock: 5, tags: ['ai', 'llm'] },
  { id: 4, title: 'Contract Testing in Practice', author: 'A. Novak', price: 31.25, stock: 8, tags: ['api', 'microservices'] },
  { id: 5, title: 'Performance Engineering with k6', author: 'J. Silva', price: 27.0, stock: 3, tags: ['performance'] },
  { id: 6, title: 'Responsible AI Testing', author: 'S. Haddad', price: 39.9, stock: 7, tags: ['ai', 'ethics'] },
];

export const policies = {
  shipping: 'Standard shipping takes 3-5 business days and is free for orders over 50 EUR.',
  returns: 'Books can be returned within 30 days in their original condition for a full refund. Books that arrive damaged are refunded in full if you tell us within 30 days.',
  contact: 'Support is available by email at support@quality-books.example, Monday to Friday.',
};

export function findBook(id) {
  return books.find((b) => b.id === Number(id));
}

export function searchBooks(query = '') {
  const q = String(query).trim().toLowerCase();
  if (!q) return books;
  return books.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.tags.some((t) => t.includes(q)),
  );
}
