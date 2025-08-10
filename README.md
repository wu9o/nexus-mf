# Nexus MF - A Sandbox Framework for Webpack Module Federation

A practical sandbox framework for building and experimenting with **Webpack Module Federation (MF)**. This project provides a core package `@nexus-mf/core` and a set of examples to help developers quickly learn, experiment with, and build scalable micro-frontend applications.

**Keywords:** `webpack`, `webpack5`, `module-federation`, `mf`, `sandbox`, `micro-frontend`, `react`

**[>> Live Demo <<](https://wu9o.github.io/nexus-mf/)**

---

**English** | [中文](./README.zh-CN.md)

### Core Features

- **Reusable Core Package**: The core sandboxing and Module Federation logic is encapsulated in the `@nexus-mf/core` package, allowing you to easily integrate it into your own projects.
- **Pluggable Sandbox Mechanism**: Designed to support multiple sandboxing solutions (currently using Garfish), ensuring that each micro-app runs in a completely isolated environment to prevent style conflicts and global variable pollution.
- **Module Federation**: Utilizes Webpack 5's Module Federation for dynamic, at-runtime loading of micro-apps.
- **Monorepo Architecture**: Managed with `pnpm` workspaces, providing a streamlined development experience for both the core package and the examples.
- **Centralized Configuration**: A dedicated `@mf/shared-config` package manages shared configurations for consistency and easy maintenance.
- **Developer-Friendly**: Comes with a pre-configured CI/CD workflow for easy deployment and a clear solution for handling deep linking in SPA environments.

### Architecture Overview

NexusMF's architecture consists of a **Core Framework (`@nexus-mf/core`)** and multiple **Example Applications**.

```
+-------------------------------------------------+
|                  Browser                        |
| +---------------------------------------------+ |
| |         Example Shell App (main-app)        | |
| | +-----------------------------------------+ | |
| | |         Layout (Nav Menu, Header)       | | |
| | +-----------------------------------------+ | |
| | |                                         | | |
| | |  +-----------------------------------+  | | |
| | |  |        Micro-App Sandbox          |  | | |
| | |  |  (Rendered by @nexus-mf/core)     |  | | |
| | |  +-----------------------------------+  | | |
| | |                                         | | |
| | +-----------------------------------------+ | |
| +---------------------------------------------+ |
+-------------------------------------------------+
```

- **Core Framework (`packages/core`)**:
  - Provides the `SandboxMFE` component, which is responsible for creating a sandbox and loading a remote micro-frontend application.
  - Can be published to npm and used as a dependency in any host application.

- **Example Shell App (`examples/main-app`)**:
  - Acts as the main container and entry point for the user.
  - Manages the overall page layout, navigation menu, and routing logic.
  - Imports and uses the `SandboxMFE` component from `@nexus-mf/core` to load micro-apps.

- **Example Micro Apps (`examples/dashboard`, `examples/settings`, etc.)**:
  - Are complete, standalone React applications.
  - Are exposed as remote modules via Module Federation.
  - Run inside a sandbox within the Shell App.

### Key Implementation Details

#### 1. Sandboxed MFE Loader (`packages/core/src/SandboxMFE.js`)

This is the core component of the framework. Instead of directly mounting a remote component, the `SandboxMFE` component performs the following steps:
1. Creates a new sandbox instance using `@garfish/browser-vm`.
2. Loads the micro-app's `remoteEntry.js` using the native `window` to make the container globally available.
3. Injects the remote container, along with shared libraries like React, into the sandbox's global scope.
4. Executes the bootstrap code of the micro-app inside the sandbox, effectively rendering the entire micro-app in an isolated environment.

#### 2. Dependency Sharing

To optimize performance and ensure stability, critical libraries are shared between the shell application and all micro-apps. This is configured in the `ModuleFederationPlugin`'s `shared` option.

#### 3. Deep Linking on GitHub Pages

GitHub Pages is a static hosting service and does not natively support SPA routing. To solve 404 errors when accessing deep links directly (e.g., `/mf/dashboard/details`), we use a simple and effective trick:
- The GitHub Actions deployment workflow (`.github/workflows/deploy.yml`) copies the root `index.html` to `404.html`.
- When GitHub Pages encounters a non-existent path, it serves the `404.html` file, which is actually our main application.
- React Router then picks up the URL from the address bar and renders the correct route.

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/wu9o/nexus-mf.git
    cd nexus-mf
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Run all example applications concurrently:**
    This command will start the Shell App and all micro-apps in parallel.
    ```bash
    pnpm --parallel --stream -r --filter "./examples/**" start
    ```

- Shell App: `http://localhost:3000`
- Dashboard App: `http://localhost:3001`
- User Management App: `http://localhost:3002`
- Settings App: `http://localhost:3003`
