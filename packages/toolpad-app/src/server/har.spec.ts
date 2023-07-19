import fetch from 'node-fetch';
import { listen } from '@mui/toolpad-utils/http';
import getPort from 'get-port';
import { createHarLog, withHarInstrumentation } from './har';
import { streamToString } from '../utils/streams';

describe('har', () => {
  test('headers in array form', async () => {
    const port = await getPort();
    const { stopServer } = await listen(async (req, res) => {
      res.write(
        JSON.stringify({
          body: await streamToString(req),
          method: req.method,
          headers: req.headers,
        }),
      );
      res.end();
    }, port);

    try {
      const har = createHarLog();
      const instrumentedfetch = withHarInstrumentation(fetch, { har });

      const res = await instrumentedfetch(`http://localhost:${port}`, {
        headers: [['foo', 'bar']],
        method: 'POST',
        body: 'baz',
      });

      expect(res.ok).toBeTruthy();

      const body = await res.json();

      expect(body).toEqual(
        expect.objectContaining({
          body: 'baz',
          method: 'POST',
          headers: expect.objectContaining({
            foo: 'bar',
          }),
        }),
      );
    } finally {
      await stopServer();
    }
  });
});
