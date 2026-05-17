const mockKv = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
jest.mock('@upstash/redis', () => ({ Redis: { fromEnv: () => mockKv } }));
const handler = require('./session');

const SAMPLE = {
  id: 'ABC123',
  sprintName: 'Sprint 1',
  startDate: '2026-05-19',
  sprintLength: 5,
  createdAt: Date.now(),
  participants: {},
  availability: {},
};

function req(method, query = {}, body = null) {
  return { method, query, body };
}

function res() {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}

beforeEach(() => jest.clearAllMocks());

describe('GET', () => {
  test('returns session data for valid id', async () => {
    mockKv.get.mockResolvedValue(SAMPLE);
    const r = res();
    await handler(req('GET', { id: 'ABC123' }), r);
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith(SAMPLE);
  });

  test('returns 400 when id is missing', async () => {
    const r = res();
    await handler(req('GET', {}), r);
    expect(r.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 for unknown id', async () => {
    mockKv.get.mockResolvedValue(null);
    const r = res();
    await handler(req('GET', { id: 'NOPE' }), r);
    expect(r.status).toHaveBeenCalledWith(404);
  });
});

describe('POST', () => {
  test('saves data with 2-hour TTL and returns ok', async () => {
    mockKv.set.mockResolvedValue('OK');
    const r = res();
    await handler(req('POST', {}, SAMPLE), r);
    expect(mockKv.set).toHaveBeenCalledWith('sprint_session_ABC123', SAMPLE, { ex: 7200 });
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith({ ok: true });
  });

  test('returns 400 when body has no id', async () => {
    const r = res();
    await handler(req('POST', {}, { sprintName: 'oops' }), r);
    expect(r.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when body is missing', async () => {
    const r = res();
    await handler(req('POST', {}, null), r);
    expect(r.status).toHaveBeenCalledWith(400);
  });
});

describe('DELETE', () => {
  test('deletes session and returns ok', async () => {
    mockKv.del.mockResolvedValue(1);
    const r = res();
    await handler(req('DELETE', { id: 'ABC123' }), r);
    expect(mockKv.del).toHaveBeenCalledWith('sprint_session_ABC123');
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith({ ok: true });
  });

  test('returns 400 when id is missing', async () => {
    const r = res();
    await handler(req('DELETE', {}), r);
    expect(r.status).toHaveBeenCalledWith(400);
  });
});

test('returns 405 for unsupported methods', async () => {
  const r = res();
  await handler(req('PATCH'), r);
  expect(r.status).toHaveBeenCalledWith(405);
});
