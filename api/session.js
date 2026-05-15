const { Redis } = require('@upstash/redis');
const kv = Redis.fromEnv();

const KEY_PREFIX = 'sprint_session_';
const SESSION_TTL_SECS = 2 * 60 * 60; // 2 hours

module.exports = async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const data = await kv.get(KEY_PREFIX + id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const data = req.body;
    if (!data || !data.id) return res.status(400).json({ error: 'Invalid data' });
    await kv.set(KEY_PREFIX + data.id, data, { ex: SESSION_TTL_SECS });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    await kv.del(KEY_PREFIX + id);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
