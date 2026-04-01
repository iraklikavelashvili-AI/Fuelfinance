# FuelFinance Automation Workflows

All automated steps live in the `workflows/` folder as `.yaml` files.
Each file is plain text — edit it directly, no coding required.

---

## Setup (one time, per machine)

```bash
npm install
npx playwright install chromium
cp .env.example .env
# then edit .env and add your own email + password
```

---

## How to run a workflow

```bash
node scripts/run.js workflows/01-login.yaml
# or use the shortcut:
npm run login
```

---

## All Workflows

| # | File | What it does | Run command |
|---|------|--------------|-------------|
| 01 | `workflows/01-login.yaml` | Log in to FuelFinance | `npm run login` |

> Add new rows here whenever you add a new workflow file.

---

## How to add a new step to a workflow

Open the relevant `.yaml` file and add a new block at the bottom.
Each step follows this pattern:

```yaml
- step: 7
  name: "What this step does (plain English)"
  action: click
  selector: "button.my-button"
```

### Available actions

| Action | What it does | Required fields |
|--------|-------------|-----------------|
| `navigate` | Go to a URL | `value: "https://..."` |
| `fill` | Type into a field | `selector:`, `value:` |
| `click` | Click an element | `selector:` or `text:` |
| `wait_for_url` | Pause until URL matches | `value: "**/path**"` |
| `wait` | Pause for N milliseconds | `value: 2000` |
| `screenshot` | Save a screenshot | `value: "screenshots/name.png"` |
| `select` | Pick from a dropdown | `selector:`, `value:` |
| `press` | Press a keyboard key | `value: "Enter"` |

### Finding selectors

The easiest way: right-click any element in Chrome → **Inspect** →
right-click the highlighted HTML → **Copy** → **Copy selector**.

Paste that as the `selector:` value in your step.

---

## Credentials

Each person stores their own credentials in a **local `.env` file** (never committed to Git).

```
EMAIL=your-email@fuelfinance.me
PASSWORD=your-password
```

In workflow files, write `${EMAIL}` and `${PASSWORD}` — the runner substitutes them automatically.

---

## Sharing workflows with teammates

1. Workflow `.yaml` files are committed to Git — teammates pull and get them automatically.
2. Each teammate creates their own `.env` with their credentials.
3. Everyone runs the same workflow, with their own login.
