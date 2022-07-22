import * as http from 'http';
import getPort from 'get-port';
import { Readable } from 'stream';
import formidable from 'formidable';
import { execa, ExecaChildProcess } from 'execa';
import path from 'path';
import execFunction from './execFunction';

function redirectOutput(cp: ExecaChildProcess): ExecaChildProcess {
  if (cp.stdin) {
    process.stdin.pipe(cp.stdin);
  }
  if (cp.stdout) {
    cp.stdout.pipe(process.stdout);
  }
  if (cp.stderr) {
    cp.stderr.pipe(process.stderr);
  }
  return cp;
}

function streamToString(stream: Readable) {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

async function startServer(handler?: http.RequestListener) {
  const server = http.createServer(handler);
  const port = await getPort({ port: 3000 });
  let app: http.Server | undefined;
  await new Promise((resolve, reject) => {
    app = server.listen(port);
    app.once('listening', resolve);
    app.once('error', reject);
  });
  return {
    port,
    async stopServer() {
      await new Promise<void>((resolve, reject) => {
        if (app) {
          app.close((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    },
  };
}

async function buildRuntime() {
  await redirectOutput(
    execa('yarn', ['run', 'build:function-runtime'], {
      cwd: path.resolve(__dirname, '../../..'),
      stdio: 'pipe',
    }),
  );
}

describe('execFunction', () => {
  beforeAll(async () => {
    await buildRuntime();
  });

  test('basic', async () => {
    const { data, error } = await execFunction(`
      export default async function () {
        return 'hello world';
      }
    `);
    expect(error).toBeUndefined();
    expect(data).toBe('hello world');
  });

  test('sync function', async () => {
    const { data, error } = await execFunction(`
      export default function () {
        return 'hello world';
      }
    `);
    expect(error).toBeUndefined();
    expect(data).toBe('hello world');
  });

  test('logging', async () => {
    const { logs, error } = await execFunction(`
      export default function () {
        console.log('log: foo');
        console.info('info: foo');
        console.debug('debug: foo');
        console.warn('warn: foo');
        console.error('error: foo');
        return 1;
      }
    `);

    expect(error).toBeUndefined();
    expect(logs).toEqual([
      {
        level: 'log',
        args: ['log: foo'],
        timestamp: expect.any(Number),
      },
      {
        level: 'info',
        args: ['info: foo'],
        timestamp: expect.any(Number),
      },
      {
        level: 'debug',
        args: ['debug: foo'],
        timestamp: expect.any(Number),
      },
      {
        level: 'warn',
        args: ['warn: foo'],
        timestamp: expect.any(Number),
      },
      {
        level: 'error',
        args: ['error: foo'],
        timestamp: expect.any(Number),
      },
    ]);
  });

  test('setTimeout', async () => {
    const { data, error } = await execFunction(`
      const delay = (ms) => new Promise(r => setTimeout(r, ms));
      export default function () {
        let i = 1;
        return Promise.all([
          delay(30).then(() => i++),
          delay(10).then(() => i++),
          delay(20).then(() => i++),
        ]);
      }
    `);

    expect(error).toBeUndefined();
    expect(data).toEqual([3, 1, 2]);
  });

  test('clearTimeout', async () => {
    const { data, error } = await execFunction(`
      export default async function () {
        let timeoutCalled = false;
        let clearTimeoutCalled = false;
        const timeout = setTimeout(() => {
          timeoutCalled = true
        }, 20)
        setTimeout(()=> {
          clearTimeout(timeout)
          clearTimeoutCalled = true
        }, 10)
        
        await new Promise(r => setTimeout(r, 50))

        return { timeoutCalled, clearTimeoutCalled }
      }
    `);

    expect(error).toBeUndefined();
    expect(data).toEqual({ timeoutCalled: false, clearTimeoutCalled: true });
  });

  test('basic fetch', async () => {
    const { port, stopServer } = await startServer((req, res) => {
      res.write('hello world!');
      res.end();
    });

    try {
      const { data, error } = await execFunction(`
      export default async function () {
        const res = await fetch('http://localhost:${port}');
        if (!res.ok) {
          throw new Error(\`HTTP \${res.status}: \${res.statusText}\`)
        }
        return res.text();
      }
    `);

      expect(error).toBeUndefined();
      expect(data).toEqual('hello world!');
    } finally {
      await stopServer();
    }
  });

  test('fetch POST requests', async () => {
    const { port, stopServer } = await startServer(async (req, res) => {
      res.write(
        JSON.stringify({
          method: req.method,
          body: await streamToString(req),
        }),
      );
      res.end();
    });

    try {
      const { data, error } = await execFunction(`
      export default async function () {
        const res = await fetch('http://localhost:${port}', {
          method: 'POST',
          body: 'Foo body'
        });
        if (!res.ok) {
          throw new Error(\`HTTP \${res.status}: \${res.statusText}: \${await res.text()}\`)
        }
        return res.json();
      }
    `);

      expect(error).toBeUndefined();
      expect(data).toEqual({
        method: 'POST',
        body: 'Foo body',
      });
    } finally {
      await stopServer();
    }
  });

  test('fetch POST requests with Formdata', async () => {
    const { port, stopServer } = await startServer(async (req, res) => {
      const form = formidable({ multiples: true });
      form.parse(req, (err, fields) => {
        if (err) {
          res.statusCode = 500;
          res.end();
          return;
        }

        res.write(
          JSON.stringify({
            method: req.method,
            body: fields,
          }),
        );
        res.end();
      });
    });

    try {
      const { data, error } = await execFunction(`
      export default async function () {
        const body = new FormData();
        body.append('foo', 'bar');
        body.append('baz', 'quux');
        const res = await fetch('http://localhost:${port}', {
          method: 'POST',
          body
        });
        if (!res.ok) {
          throw new Error(\`HTTP \${res.status}: \${res.statusText}: \${await res.text()}\`)
        }
        return res.json();
      }
    `);

      expect(error).toBeUndefined();
      expect(data).toEqual({
        method: 'POST',
        body: {
          baz: 'quux',
          foo: 'bar',
        },
      });
    } finally {
      await stopServer();
    }
  });

  test('fetch bad status', async () => {
    const { port, stopServer } = await startServer((req, res) => {
      res.statusCode = 500;
      res.write('BOOM!');
      res.end();
    });

    try {
      const { data, error } = await execFunction(`
      export default async function () {
        const res = await fetch('http://localhost:${port}');
        if (!res.ok) {
          throw new Error(\`HTTP \${res.status}: \${res.statusText}: \${await res.text()}\`)
        }
        throw new Error('Expected to fail')
      }
    `);

      expect(data).toBeUndefined();
      expect(error).toHaveProperty('message', 'HTTP 500: Internal Server Error: BOOM!');
    } finally {
      await stopServer();
    }
  });
});
