require('dotenv').config();
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// ── discover all workflow yaml files ─────────────────────────
function getWorkflows() {
  const base = path.join(__dirname, 'workflows');
  const results = [];

  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(full);
      } else if (entry.name.endsWith('.yaml')) {
        const relative = path.relative(__dirname, full).replace(/\\/g, '/');
        const parts = relative.split('/');
        const folder = parts.length > 2 ? parts[1] : 'shared';
        try {
          const wf = yaml.load(fs.readFileSync(full, 'utf8'));
          results.push({
            id: relative.replace(/[^a-zA-Z0-9]/g, '_'),
            file: relative,
            folder,
            name: wf.name || entry.name,
            description: wf.description || '',
            steps: Array.isArray(wf.steps) ? wf.steps.length : 0,
            stepList: Array.isArray(wf.steps) ? wf.steps.map(s => s.name || '') : [],
          });
        } catch (_) { /* skip invalid yaml */ }
      }
    }
  }

  scan(base);
  return results;
}

// ── API: list workflows ───────────────────────────────────────
app.get('/api/workflows', (req, res) => {
  res.json(getWorkflows());
});

// ── API: run a workflow (streams output via SSE) ──────────────
app.get('/api/run', (req, res) => {
  const file = req.query.file;
  if (!file || !file.startsWith('workflows/')) {
    res.status(400).json({ error: 'Invalid file path' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  function send(type, text) {
    res.write(`data: ${JSON.stringify({ type, text })}\n\n`);
  }

  const child = spawn('node', ['scripts/run.js', file], {
    cwd: __dirname,
    env: { ...process.env },
  });

  child.stdout.on('data', d => {
    d.toString().split('\n').forEach(line => send('log', line));
  });

  child.stderr.on('data', d => {
    d.toString().split('\n').forEach(line => send('error', line));
  });

  child.on('close', code => {
    send('done', code === 0 ? 'success' : 'failed');
    res.end();
  });

  req.on('close', () => child.kill());
});

// ── start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n========================================');
  console.log(' FuelFinance Workflows Dashboard');
  console.log('========================================');
  console.log(`\n Open this in your browser:\n http://localhost:${PORT}\n`);
});
