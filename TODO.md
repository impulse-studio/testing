# Impulse Testing - TODO

## Implemented
- [x] CLI interactive mode
- [x] Story recording with action capture
- [x] Story execution/playback
- [x] Screenshot comparison
- [x] CI mode (`--ci` flag)
- [x] Lifecycle management (app start/stop)
- [x] Database lifecycle hooks
- [x] Configuration via YAML
- [x] Action types (click, type, select, wait, navigate)
- [x] Screenshot capture on every step
- [x] Diff generation on failures
- [x] Headless browser support
- [x] Viewport configuration
- [x] Timeout configuration
- [x] Story execution with baseline comparison

## High Priority
- [ ] Init command for project bootstrapping
- [ ] Interactive configuration wizard
- [ ] Default config template generation
- [ ] .testing/ directory structure creation
- [ ] Framework detection (Next.js, Vite, CRA, Express)
- [ ] .gitignore integration
- [ ] HTML report generation
- [ ] JSON report generation
- [ ] Report configuration options
- [ ] Embedded screenshots in HTML reports
- [ ] Summary statistics in reports
- [ ] Report file naming and storage
- [ ] Auto-open report option
- [ ] Report retention policy

## Medium Priority
- [ ] Parallel story execution
- [ ] Worker thread/process management
- [ ] Browser instance pooling
- [ ] Result aggregation for parallel runs
- [ ] Custom assertion types (console logs)
- [ ] Custom assertion types (network requests)
- [ ] Custom assertion types (cookies)
- [ ] Custom assertion types (localStorage)
- [ ] Custom assertion types (performance)
- [ ] Custom assertion types (accessibility)
- [ ] Video recording on test execution
- [ ] Video recording on failure only
- [ ] Video retention policy
- [ ] Network request mocking
- [ ] API response mocking
- [ ] Network condition simulation
- [ ] Request payload verification
- [ ] Smart wait detection
- [ ] Automatic page ready detection
- [ ] DOM mutation monitoring
- [ ] Loading indicator detection

## Low Priority
- [ ] Browser console log capture
- [ ] Console error test failures
- [ ] Performance metrics collection (FCP, LCP, TBT, CLS, TTI)
- [ ] Retry logic for flaky tests
- [ ] Configurable retry strategies
- [ ] Custom action plugin system
- [ ] CI/CD platform integrations (GitHub Actions, GitLab CI, Jenkins, CircleCI)
- [ ] Cloud screenshot comparison service
- [ ] ML-based visual change detection

## Technical Debt & Code Quality
- [ ] Add comprehensive unit tests
- [ ] Add integration tests
- [ ] Improve error message clarity
- [ ] Add JSDoc comments for public APIs
- [ ] Set up ESLint configuration
- [ ] Set up Prettier configuration
- [ ] Optimize screenshot comparison algorithm
- [ ] Implement screenshot caching
- [ ] Reduce memory usage for large stories
- [ ] Improve browser launch time

## Developer Experience
- [ ] Add debug mode with verbose logging
- [ ] Improve CLI help text
- [ ] Add story validation command
- [ ] Add dry-run mode
- [ ] Generate .testing/README.md with quickstart
- [ ] Better error handling and messages
