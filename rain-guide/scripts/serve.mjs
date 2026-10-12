import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const host = '127.0.0.1';
const port = 4173;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};

function isInsideRoot(path) {
  const part = relative(root, path);
  return part === '' || (!isAbsolute(part) && part !== '..' && !part.startsWith(`..${sep}`));
}

function reply(request, response, status, message) {
  const body = Buffer.from(message, 'utf8');
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': body.length,
  });
  response.end(request.method === 'HEAD' ? undefined : body);
}

const server = createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    reply(request, response, 405, 'Method not allowed.');
    return;
  }

  let pathname;
  try {
    // Decode before checking traversal, including encoded slashes and dot segments.
    pathname = decodeURIComponent((request.url ?? '/').split('?')[0]);
  } catch {
    reply(request, response, 400, 'Invalid URL encoding.');
    return;
  }

  if (!pathname.startsWith('/') || /[\u0000-\u001f\\:]/.test(pathname)) {
    reply(request, response, 400, 'Invalid path.');
    return;
  }
  if (pathname.split('/').some((part) => part.startsWith('.') || part === 'node_modules')) {
    reply(request, response, 403, 'Forbidden path.');
    return;
  }

  try {
    let path = resolve(root, `.${pathname}`);
    if (!isInsideRoot(path)) {
      reply(request, response, 403, 'Forbidden path.');
      return;
    }
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    // Resolve symlinks/junctions so they cannot expose files outside this project.
    path = await realpath(path);
    if (!isInsideRoot(path)) {
      reply(request, response, 403, 'Forbidden path.');
      return;
    }
    if (!(await stat(path)).isFile()) {
      reply(request, response, 404, 'Not found.');
      return;
    }
    const body = await readFile(path);
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(path).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': body.length,
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    const missing = ['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code);
    const denied = ['EACCES', 'EPERM'].includes(error.code);
    reply(request, response, missing ? 404 : denied ? 403 : 500,
      missing ? 'Not found.' : denied ? 'Access denied.' : 'Unable to serve this file.');
  }
});

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `端口 ${port} 已被占用。请关闭先前的预览服务后重试。`
    : `无法启动预览服务：${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`雨间 · Rainward 本地预览：http://${host}:${port}/`);
  console.log('按 Ctrl+C 停止。仅本机可访问；无需安装 npm 依赖。');
});
