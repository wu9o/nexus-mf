# NexusMF: The Pluggable Micro-Frontend Framework

**NexusMF** is a powerful, sandbox-based micro-frontend framework designed to connect and manage independent web applications seamlessly. It provides a robust architecture for building scalable, isolated, and maintainable large-scale projects. The name "Nexus" reflects its core mission: to act as a central hub that orchestrates multiple applications into a single, cohesive user experience.

This repository contains the core implementation of NexusMF and a demo showcasing its capabilities.

**[>> Live Demo <<](https://wu9o.github.io/mf/)**

---

**English** | [中文](./README.zh-CN.md)

### Core Features

- **Pluggable Sandbox Mechanism**: Designed to support multiple sandboxing solutions (currently using Garfish), ensuring that each micro-app runs in a completely isolated environment to prevent style conflicts and global variable pollution.
- **Module Federation**: Utilizes Webpack 5's Module Federation for dynamic, at-runtime loading of micro-apps.
- **Framework Agnostic**: While the demo is built with React, the core framework is designed to be compatible with any web technology.
- **Monorepo Architecture**: Managed with `pnpm` workspaces, providing a streamlined development experience.
- **Centralized Configuration**: A dedicated `@mf/shared-config` package manages shared configurations for consistency and easy maintenance.
- **Developer-Friendly**: Comes with a pre-configured CI/CD workflow for easy deployment and a clear solution for handling deep linking in SPA environments.

### Architecture Overview

NexusMF's architecture consists of a **Shell Application** (the Nexus) and multiple **Micro-Applications**.

```
+-------------------------------------------------+
|                  Browser                        |
| +---------------------------------------------+ |
| |              Shell App (main-app)           | |
| | +-----------------------------------------+ | |
| | |         Layout (Nav Menu, Header)       | | |
| | +-----------------------------------------+ | |
| | |                                         | | |
| | |  +-----------------------------------+  | | |
| | |  |        Micro-App Sandbox          |  | | |
| | |  |  (e.g., Dashboard / Settings)     |  | | |
| | |  +-----------------------------------+  | | |
| | |                                         | | |
| | +-----------------------------------------+ | |
| +---------------------------------------------+ |
+-------------------------------------------------+
```

- **Shell App (`apps/main-app`)**:
  - Acts as the main container and entry point for the user.
  - Manages the overall page layout, navigation menu, and routing logic.
  - Is responsible for loading the appropriate micro-app into a sandboxed environment based on the current URL.

- **Micro Apps (`apps/dashboard`, `apps/settings`, etc.)**:
  - Are complete, standalone React applications.
  - Are exposed as remote modules via Module Federation.
  - Run inside a sandbox within the Shell App, completely unaware of other micro-apps.

### Key Implementation Details

#### 1. Sandboxed MFE Loader (`SandboxMFE.js`)

This is the core component that differentiates this project. Instead of directly mounting a remote component, the `SandboxMFE.js` component in the Shell App performs the following steps:
1. Creates a new sandbox instance using `@garfish/browser-vm`.
2. Loads the micro-app's `remoteEntry.js` using the native `window` to make the container globally available.
3. Injects the remote container, along with shared libraries like React, into the sandbox's global scope.
4. Executes the bootstrap code of the micro-app inside the sandbox, effectively rendering the entire micro-app in an isolated environment.

#### 2. Dependency Sharing

To optimize performance and ensure stability, critical libraries are shared between the Shell App and all micro-apps. This is configured in the `ModuleFederationPlugin`'s `shared` option. Only essential, singleton-required libraries are explicitly shared:
- `react`
- `react-dom`
- `react-router-dom`
- `@arco-design/web-react`

#### 3. Deep Linking on GitHub Pages

GitHub Pages is a static hosting service and does not natively support SPA routing. To solve 404 errors when accessing deep links directly (e.g., `/mf/dashboard/details`), we use a simple and effective trick:
- The GitHub Actions deployment workflow (`.github/workflows/deploy.yml`) copies the root `index.html` to `404.html`.
- When GitHub Pages encounters a non-existent path, it serves the `404.html` file, which is actually our main application.
- React Router then picks up the URL from the address bar and renders the correct route.

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/wu9o/mf.git
    cd mf
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Run all applications concurrently:**
    This command will start the Shell App and all micro-apps in parallel.
    ```bash
    pnpm --parallel --stream -r start
    ```

- Shell App: `http://localhost:3000`
- Dashboard App: `http://localhost:3001`
- User Management App: `http://localhost:3002`
- Settings App: `http://localhost:3003`
