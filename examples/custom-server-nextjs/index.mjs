import { createHandler } from '@toolpad/studio';
import next from 'next';
import * as url from 'url';
import express from 'express';

const currentDirectory = url.fileURLToPath(new URL('.', import.meta.url));

const dev = process.env.NODE_ENV === 'development';

// Create the host application
const app = express();

// Initialize the Toolpad Studio handler. Make sure to pass the base path
// const { handler } = await createHandler({ dev, base: '/my-toolpad-studio-app' });
// app.use('/my-toolpad-studio-app', handler);

// Initialize the Next.js app, basePath is set in next.config.mjs
const nextApp = next({ dev, dir: currentDirectory });
const handle = nextApp.getRequestHandler();
await nextApp.prepare();
app.use('/my-next-app', (req, res, nextFn) => {
  const parsedUrl = url.parse(req.originalUrl, true);
  handle(req, res, parsedUrl).catch(nextFn);
});

// Convenience redirect
app.get('/', (req, res) => res.redirect('/my-next-app'));

// Start the server
const server = app.listen(3001, () => {
  console.log(`Listening on http://localhost:${server.address().port}`);
});
