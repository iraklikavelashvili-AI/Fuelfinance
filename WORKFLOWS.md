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
# IMPORTANT: if your password has special characters, wrap it in quotes:
# PASSWORD="your-password-here"
```

---

## Folder structure

```
workflows/
  shared/
    login.yaml                    ← just the login steps
  coldiq/
    01-data-sources.yaml          ← login + go to ColdIQ > Data Sources
  [next-client]/
    01-something.yaml             ← add new folders per client
```

---

## All Workflows

### Shared
| # | File | What it does | Run command |
|---|------|--------------|-------------|
| — | `shared/login.yaml` | Log in only | `npm run login` |

### ColdIQ
| # | File | What it does | Run command |
|---|------|--------------|-------------|
| 01 | `coldiq/01-data-sources.yaml` | Login → ColdIQ → Data Sources | `npm run coldiq:data-sources` |

> To add a new client: create a new folder under `workflows/` and add your `.yaml` files inside.
> Add a new row to the table above so teammates can find it easily.

---

## How to add a new step

Open the relevant `.yaml` file in Notepad and add a block at the bottom.
Copy any existing step and change the fields. Steps are numbered — just continue the count.

```yaml
- step: 7
  name: "What this step does (plain English)"
  action: click
  text: "Button label visible on screen"
```

### Available actions

| Action | What it does | Required fields |
|--------|-------------|-----------------|
| `navigate` | Go to a URL | `value: "https://..."` |
| `fill` | Type into a field | `selector:`, `value:` |
| `click` | Click something by CSS | `selector:` |
| `click` | Click something by visible text | `text:` |
| `wait` | Pause for N milliseconds | `value: 2000` |
| `wait_for_url` | Wait until URL matches pattern | `value: "**/path**"` |
| `screenshot` | Save a screenshot | `value: "screenshots/name.png"` |
| `select` | Pick from a dropdown | `selector:`, `value:` |
| `press` | Press a keyboard key | `value: "Enter"` |

### Finding selectors

Right-click any element in Chrome → **Inspect** →
right-click the highlighted HTML → **Copy** → **Copy selector**.
Paste as the `selector:` value.

For buttons and links it's usually easier to use `text:` with the exact label you see on screen.

---

## Credentials

Each person stores their own credentials in a local `.env` file (never shared via Git).

```
EMAIL=your-email@fuelfinance.me
PASSWORD="your-password"
```

In workflow files, write `${EMAIL}` and `${PASSWORD}` — the runner fills them in automatically.

---

## Sharing workflows with teammates

1. Workflow `.yaml` files are in Git — teammates pull and get them automatically.
2. Each teammate creates their own `.env` with their credentials.
3. Everyone runs the same workflow with their own login.
