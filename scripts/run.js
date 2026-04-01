require('dotenv').config();
const { chromium } = require('playwright');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// ── helpers ──────────────────────────────────────────────────
function resolveEnv(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/\$\{(\w+)\}/g, (_, key) => process.env[key] ?? `\${${key}}`);
}

function resolveStepValues(step) {
  const resolved = {};
  for (const [k, v] of Object.entries(step)) {
    resolved[k] = resolveEnv(v);
  }
  return resolved;
}

// ── step executor ─────────────────────────────────────────────
async function runStep(page, raw) {
  const step = resolveStepValues(raw);

  switch (step.action) {

    case 'navigate':
      await page.goto(step.value, { waitUntil: 'domcontentloaded' });
      break;

    case 'fill': {
      // try each comma-separated selector until one works
      const selectors = step.selector.split(',').map(s => s.trim());
      let filled = false;
      for (const sel of selectors) {
        try {
          await page.waitForSelector(sel, { timeout: 5000 });
          await page.fill(sel, step.value);
          filled = true;
          break;
        } catch (_) { /* try next */ }
      }
      if (!filled) throw new Error(`No selector found: ${step.selector}`);
      break;
    }

    case 'click': {
      if (step.text) {
        await page.click(`text=${step.text}`);
      } else {
        // try each comma-separated selector until one works
        const selectors = step.selector.split(/,(?![^(]*\))/g).map(s => s.trim());
        let clicked = false;
        for (const sel of selectors) {
          try {
            await page.waitForSelector(sel, { timeout: 5000 });
            await page.click(sel);
            clicked = true;
            break;
          } catch (_) { /* try next */ }
        }
        if (!clicked) throw new Error(`No selector found: ${step.selector}`);
      }
      break;
    }

    case 'wait_for_url':
      await page.waitForURL(step.value, { timeout: 15000 });
      break;

    case 'wait':
      await page.waitForTimeout(Number(step.value));
      break;

    case 'screenshot':
      fs.mkdirSync(path.dirname(step.value), { recursive: true });
      await page.screenshot({ path: step.value, fullPage: false });
      console.log(`     → saved to ${step.value}`);
      break;

    case 'select':
      await page.selectOption(step.selector, step.value);
      break;

    case 'press':
      await page.keyboard.press(step.value);
      break;

    default:
      throw new Error(`Unknown action: "${step.action}"`);
  }
}

// ── main ──────────────────────────────────────────────────────
async function runWorkflow(workflowPath) {
  const raw = fs.readFileSync(workflowPath, 'utf8');
  const workflow = yaml.load(raw);

  console.log('\n========================================');
  console.log(` ${workflow.name}`);
  console.log(` ${workflow.description}`);
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  let failed = false;
  for (const step of workflow.steps) {
    process.stdout.write(`  [${step.step}] ${step.name} ... `);
    try {
      await runStep(page, step);
      console.log('✓');
    } catch (err) {
      console.log('✗');
      console.error(`\n  ERROR: ${err.message}\n`);
      failed = true;
      break;
    }
  }

  if (!failed) {
    console.log('\n  All steps completed successfully.\n');
  }

  await page.waitForTimeout(2000);
  await browser.close();
}

// ── entry ─────────────────────────────────────────────────────
const workflowArg = process.argv[2];
if (!workflowArg) {
  console.error('\nUsage:  node scripts/run.js workflows/<name>.yaml\n');
  process.exit(1);
}

runWorkflow(path.resolve(workflowArg)).catch(err => {
  console.error(err);
  process.exit(1);
});
