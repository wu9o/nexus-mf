# ROADMAP

## Phase 1: Core Framework Refactoring (Completed)

- [x] **Extract Core Logic into a Reusable Package**
  - **Status:** Done
  - **Details:** The core sandboxing and Module Federation logic has been successfully extracted from the main application into a new, reusable package located at `packages/core`. This package is named `@nexus-mf/core`.

- [x] **Restructure Project into Examples**
  - **Status:** Done
  - **Details:** The original applications under the `apps/` directory have been moved to `examples/`. They now serve as a clear demonstration of how to use the `@nexus-mf/core` framework.

- [x] **Update Documentation**
  - **Status:** Done
  - **Details:** The `README.md` and `README.zh-CN.md` files have been updated to reflect the new architecture, explaining the roles of the `@nexus-mf/core` package and the `examples/` directory. The local development commands have also been updated.

## Phase 2: Demonstration Foundation (In Progress)

- [x] **Make the examples representative**: Dashboard, user management, and settings now contain real UI state, independent routes, runtime metadata, loading boundaries, and responsive layouts.
- [x] **Add a minimal communication contract**: `@mf/shared-config` provides a namespaced `publish/subscribe` event bus for host-to-remote and remote-to-host demos.
- [x] **Show a safe CSS convention**: Example styles use per-application class prefixes so the current demo does not rely on global selectors.
- [x] **Add an example manifest**: Move remote name, entry URL, version, and enabled state out of `main-app/src/App.tsx`; the Host now loads and validates `remote-manifest.json` before rendering.

## Phase 3: Runtime Capabilities

- [x] **Remote Manifest MVP**: Development and production builds emit `remote-manifest.json`; the runtime loader validates entries and passes version/fallback metadata into `SandboxMFE`.
- [x] **Remote Manifest contract hardening**: Manifest entries now use `schemaVersion: 1`, support HTTPS/origin allowlists, and can carry Subresource Integrity metadata.
- [ ] **Remote Manifest trust and delivery hardening**: Add manifest signing, key rotation, CDN cache policy, and deployment-time integrity generation.
- [x] **Version management MVP**: `SandboxMFE` accepts an ordered `fallbackVersions` list, retries the next version after load/init/module failures, reports the selected version through `onLoad`, and the Dashboard includes a failure-injection rollback demo.
- [x] **CSS lifecycle MVP**: Remote-inserted `style` and stylesheet nodes are tagged and removed after the final mounted instance releases them; host-owned styles are left untouched.
- [x] **Typed communication MVP**: `@mf/shared-config` now validates message shape at runtime, adds id/timestamp metadata, supports source/type filtering, and publishes TypeScript event payload declarations.
- [ ] **Production CSS isolation**: Keep prefixed styles as the baseline, then evaluate CSS Modules or Shadow DOM where component and overlay libraries support it.
- [ ] **Observability and resilience**: Expose load timings, remote version, timeout, retry, fallback, and error information through callbacks and a host-side status panel.

## Phase 4: Productization

- [ ] **Improve API**: Refine the `SandboxMFE` API and publish `@nexus-mf/core` to npm.
- [ ] **Complete integration tests**: Cover manifest loading, version fallback, CSS cleanup, communication contracts, and browser navigation.
- [ ] **Add framework examples**: Create Vue and Svelte remotes after the React contract is stable.
- [ ] **Enhance sandbox capabilities**: Explore network request interception and more fine-grained global variable policies.
