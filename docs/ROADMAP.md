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

## Phase 2: Future Enhancements

- [ ] **Publish to npm**: Package and publish `@nexus-mf/core` to the npm registry to make it publicly available.
- [ ] **Improve API**: Refine the API of the `SandboxMFE` component for better flexibility and ease of use.
- [ ] **Add More Examples**: Create additional examples to showcase different use cases and framework integrations (e.g., Vue, Svelte).
- [ ] **Enhance Sandbox Capabilities**: Explore and integrate more advanced sandboxing features, such as network request interception or a more fine-grained global variable proxy.
- [ ] **Write Unit and Integration Tests**: Develop a comprehensive test suite for the `@nexus-mf/core` package to ensure its stability and reliability.
