# Impulse Testing

> E2E testing library that records user interactions and replays them as automated tests

Impulse Testing is a modern E2E testing library built on Puppeteer that allows you to record real user interactions in your browser and automatically replay them as tests. No coding required for test creation! Just click, type, and interact naturally with your application.

## Key Features

- **📹 Interactive Recording**: Record user interactions as YAML stories in a visible browser
- **🔄 Automated Replay**: Execute stories headlessly for fast, reliable testing
- **📸 Visual Regression**: Screenshot comparison with pixel-perfect diff detection
- **🎯 Smart Selectors**: Automatic generation of stable CSS selectors for elements
- **💻 CLI Interface**: Intuitive interactive shell for story management
- **🚀 CI/CD Ready**: Non-interactive mode designed for continuous integration
- **⚡ Zero Config**: Interactive onboarding with auto-detection of project types

## Quick Start

### 1. Initialize Your Project

Run Impulse Testing for the first time to set up your project:

```bash
npx @impulselab/testing --init
```

The interactive onboarding will:
- Create the `.testing/` directory structure
- Generate a `config.yml` with your project settings
- Auto-detect your framework (Next.js, Vite, etc.)
- Configure lifecycle commands for starting/stopping your application

### 2. Record Your First Story

Create a new test by recording your interactions:

```bash
npx @impulselab/testing --new
```

Then:
1. Enter a name for your story (e.g., "User Login Flow")
2. Confirm or edit the auto-generated ID (e.g., `user-login-flow`)
3. Enter your application's start URL (default: `http://localhost:3000`)
4. A browser window will open—interact with your app naturally
5. Click **"Take Snapshot"** to capture screenshots at key moments
6. Click **"Stop Recording"** when done

Your interactions are saved as a reusable YAML story in `.testing/stories/{story-id}/story.yml`.

### 3. Run Tests

#### Interactive Mode (Local Development)

```bash
npx @impulselab/testing
```

Select a story from the list and watch it execute. If screenshots differ, you'll see a visual diff and can choose to accept or reject changes.

#### CI Mode (Automated Testing)

```bash
npx @impulselab/testing --ci
```

Runs all stories headlessly with automatic failure on screenshot mismatches. Perfect for CI/CD pipelines.

## CLI Commands

### Default Mode (Interactive)

```bash
npx @impulselab/testing
```

Opens an interactive shell where you can:
- Browse and select existing stories
- Create new stories
- Execute tests with visual feedback

### Recording Mode

```bash
npx @impulselab/testing --new
```

Directly starts the story creation flow, skipping the interactive menu.

### CI/CD Mode

```bash
npx @impulselab/testing --ci
```

Runs all stories in non-interactive mode:
- No user prompts
- Auto-fails on screenshot mismatches
- Proper exit codes (0 = pass, 1 = fail)

### Run Specific Stories

```bash
# Run a single story
npx @impulselab/testing --story user-login

# Run multiple stories
npx @impulselab/testing --story login --story checkout --story profile

# Run specific stories in CI mode
npx @impulselab/testing --ci --story login --story checkout
```

### Help and Version

```bash
npx @impulselab/testing --help
npx @impulselab/testing --version
```

## Configuration

### Config File Structure

Impulse Testing uses `.testing/config.yml` to manage your test environment:

```yaml
lifecycle:
  start:
    - command: "npm run dev"
      keepAlive: true    # Keep process running during tests
    - command: "npm run db:start"
      timeout: 10000     # 10 seconds to for database startup
  stop:
    - command: "npm run db:stop"
      timeout: 10000

screenshots:
  diffThreshold: 0.001  # Percentage of pixels allowed to differ (0-100), we recommand using the smaller number possible
```

#### Configuration Options

**`lifecycle.start`**: Commands to start your application
  - `command`: Shell command to execute
  - `keepAlive`: If `true`, process stays running; if `false`, waits for completion
  - `timeout`: Maximum time to wait (milliseconds)

**`lifecycle.stop`**: Commands to stop your application and clean up resources

**`screenshots.diffThreshold`**: Tolerance for pixel differences
  - `0`: Pixel-perfect matching (strictest)
  - `0.001`: Allow 0.001% of pixels to differ (recommended)
  - Higher values: More tolerant of minor rendering differences

## Story Structure

Stories are stored as YAML files in `.testing/stories/{story-id}/story.yml`:

```yaml
id: user-login-flow
name: User Login Flow
start:
  url: http://localhost:3000
  resolution:
    width: 1920
    height: 1080
  pixelRatio: 1
  deviceScaleFactor: 1
actions:
  - type: click
    selector: "#login-button"
  - type: input
    selector: "#email"
    value: "user@example.com"
  - type: input
    selector: "#password"
    value: "password123"
  - type: click
    selector: "#submit-button"
  - type: screenshot
    name: "1760513305222-zd1kqk.png"
```

### Available Action Types

#### Navigation Actions
- `navigate`: Navigate to a URL
- `goBack`: Browser back button
- `goForward`: Browser forward button
- `reload`: Reload current page

#### Interaction Actions
- `click`: Click an element
- `input`: Type text into an input field
- `select`: Select dropdown option
- `check`: Check a checkbox or radio button
- `uncheck`: Uncheck a checkbox
- `hover`: Hover over an element
- `focus`: Focus an element
- `blur`: Remove focus from an element

#### Scrolling Actions
- `scroll`: Scroll the page
- `scrollIntoView`: Scroll element into viewport

#### Wait Actions
- `wait`: Wait for specified milliseconds
- `waitForSelector`: Wait for element to appear
- `waitForNavigation`: Wait for page navigation

#### Advanced Actions
- `uploadFile`: Upload files to file inputs
- `executeScript`: Execute custom JavaScript
- `screenshot`: Capture and compare screenshot

### Selector Strategy

Impulse Testing automatically generates stable CSS selectors using this priority:

1. **ID attribute** (`#unique-id`) - Most stable and preferred
2. **Test attributes** (`[data-testid="value"]`, `[data-test="value"]`) - Recommended for test stability
3. **Complex selectors** - Auto-generated using classes and structure

**Best Practice**: Add `data-testid` attributes to important elements for more reliable tests.

## Workflow

### Recording Workflow

1. **Start Recording**: Run `npx @impulselab/testing --new`
2. **Provide Metadata**: Enter story name, ID, and start URL
3. **Interact Naturally**: Click, type, and navigate as a real user would
4. **Capture Snapshots**: Click "Take Snapshot" button at key moments to capture visual states
5. **Stop Recording**: Click "Stop Recording" when your user flow is complete
6. **Story Saved**: Actions and screenshots are automatically saved to `.testing/stories/`

### Testing Workflow

#### Local Development

1. **Run Interactive Mode**: `npx @impulselab/testing`
2. **Select Story**: Choose from the list of available stories
3. **Watch Execution**: See each action execute in real-time
4. **Review Results**: If screenshots differ:
   - VS Code diff viewer opens automatically
   - Choose to accept new screenshot or keep baseline
   - Test passes only if you accept changes

#### CI/CD Pipeline

1. **Add to Pipeline**: Add `npx @impulselab/testing --ci` to your CI config
2. **Automatic Execution**: All stories run headlessly without user interaction
3. **Screenshot Validation**: Any pixel differences cause test failure
4. **Exit Codes**:
   - `0` = All tests passed
   - `1` = One or more tests failed

**Example GitHub Actions:**

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx @impulselab/testing --ci
```

## Screenshot Comparison

### Visual Regression Testing

When a story includes `screenshot` actions, Impulse Testing automatically:

1. **Captures** the current viewport as a PNG image
2. **Compares** pixel-by-pixel with the baseline screenshot
3. **Calculates** the percentage of different pixels
4. **Applies Threshold**: Uses `diffThreshold` from config (default 0.1%)

### Resolution Modes

#### Interactive Mode (Local)

When differences are detected:
- Opens VS Code diff viewer showing side-by-side comparison
- Presents CLI prompt with two options:
  - **Keep old screenshot (fail test)**: Baseline unchanged, test marked as failed
  - **Accept new screenshot (update baseline)**: Baseline updated, test passes
- User navigates with arrow keys and confirms with Enter

#### CI Mode (Automated)

When differences are detected:
- Automatically keeps old screenshot
- Marks test as failed
- No user interaction required
- No baseline updates

## Project Structure

```
.testing/                      # All test-related files
├── config.yml                 # Main configuration file
├── stories/                   # Test stories organized by ID
│   ├── user-login-flow/
│   │   └── story.yml          # Story actions and metadata
│   ├── checkout-process/
│   │   └── story.yml
│   └── ...
├── screenshots/               # Reference screenshots for comparison
│   ├── user-login-flow/
│   │   ├── 0.png
│   │   ├── 1.png
│   │   └── ...
│   └── ...
└── temp/                      # Temporary files (mismatched screenshots, errors)
    ├── error-1234567890.png   # Diagnostic screenshots on failures
    └── ...
```

**Important Files:**
- `config.yml`: Application lifecycle, screenshot settings, output options
- `stories/{id}/story.yml`: Recorded actions and test metadata
- `screenshots/{id}/*.png`: Baseline images for visual regression testing

## Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/impulse-studio/testing.git
cd testing

# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Run in development mode (uses demo/ directory)
pnpm dev
```

### Development Scripts

```bash
# Format code with Biome
pnpm format

# Type checking and linting
pnpm checks

# Run built CLI
pnpm start
```

### Project Scripts

- `pnpm build`: Compile TypeScript to `dist/`
- `pnpm dev`: Run CLI in development mode against `demo/` directory
- `pnpm format`: Auto-format code using Biome
- `pnpm checks`: Run TypeScript compiler and Biome linter (no emitting)

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

See [LICENSE](LICENSE.md) for details

---

**Built with**: [Puppeteer](https://pptr.dev) • [TypeScript](https://www.typescriptlang.org) • [Zod](https://zod.dev) • [Commander.js](https://github.com/tj/commander.js) • [Inquirer](https://github.com/SBoudrias/Inquirer.js) by [Impulse Lab](https://impulselab.ai)
