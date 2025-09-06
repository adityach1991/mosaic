export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ ok: true, route: 'api root alive' });
    return;
  }
  res.status(405).json({ error: 'Method not allowed' });
}
