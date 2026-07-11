import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { stdout } from 'node:process';
import { URL } from 'node:url';

const host = '127.0.0.1';
const port = 4175;
const mount = '/alien-shooter-containment/';
const root = resolve('dist');
const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
]);

createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', `http://${host}:${port}`).pathname;
  if (!pathname.startsWith(mount)) {
    response.writeHead(404).end('Not found');
    return;
  }
  const relative = pathname.slice(mount.length) || 'index.html';
  const candidate = resolve(join(root, normalize(relative)));
  const hasFile = candidate.startsWith(`${root}/`)
    && existsSync(candidate)
    && statSync(candidate).isFile();
  const acceptsHtml = request.headers.accept?.includes('text/html') === true;
  const isRoute = extname(relative) === '';
  const path = hasFile
    ? candidate
    : acceptsHtml && isRoute
      ? join(root, 'index.html')
      : null;
  if (path === null) {
    response.writeHead(404).end('Not found');
    return;
  }
  response.writeHead(200, {
    'content-type': contentTypes.get(extname(path)) ?? 'application/octet-stream',
  });
  createReadStream(path).pipe(response);
}).listen(port, host, () => {
  stdout.write(`Pages preview ready at http://${host}:${port}${mount}\n`);
});
