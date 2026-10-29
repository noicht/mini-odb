// Servidor mínimo para probar diagnose.js desde el navegador (sin dependencias).
// Uso: poné server.mjs e index.html junto a diagnose.js y corré: node server.mjs
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { diagnose } from './diagnose.js';
import { validateManual } from './utils/validarManual.js';

const manual = JSON.parse(readFileSync(new URL('./data/manual.json', import.meta.url), 'utf8'));
const { warnings } = validateManual(manual); // los errores ya frenan la carga en diagnose.js
const PORT = process.env.PORT || 3000;

const send = (res, status, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(status, { 'Content-Type': type });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
};

createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    // Se lee en cada pedido para ver los cambios del HTML sin reiniciar.
    return send(res, 200, readFileSync(new URL('./index.html', import.meta.url), 'utf8'), 'text/html; charset=utf-8');
  }
  if (req.method === 'GET' && req.url === '/api/vehicles') {
    return send(res, 200, manual.vehicles.map(v => ({
      id: v.id,
      name: v.name,
      codes: Object.keys(v.codes).map(k => k.trim().toUpperCase()),
    })));
  }
  if (req.method === 'GET' && req.url === '/api/manual-status') {
    return send(res, 200, { warnings });
  }
  if (req.method === 'POST' && req.url === '/api/diagnose') {
    let raw = '';
    req.on('data', chunk => (raw += chunk));
    req.on('end', () => {
      try {
        const input = JSON.parse(raw);
        send(res, 200, diagnose(input)); // se llama a tu diagnose.js real
      } catch (e) {
        send(res, 400, { error: `${e.name}: ${e.message}` });
      }
    });
    return;
  }
  send(res, 404, { error: 'No encontrado' });
}).listen(PORT, () => console.log(`Probador en http://localhost:${PORT}`));