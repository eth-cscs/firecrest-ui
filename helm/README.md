# FirecREST UI Helm Chart Repository

This repository contains the Helm chart packages for the **firecrest-ui** application.

## How to Use This Repository

To add this repository to your Helm configuration, run the following commands:

```bash
helm repo add firecrest-ui https://eth-cscs.github.io/firecrest-ui/helm
helm repo update
```

After adding the repository, you can install the chart with:

```bash
helm install firecrest-ui firecrest-ui/firecrest-web-ui-v2 --version <version>
```

Replace `<version>` with the desired chart version as listed in the `index.yaml` file.

## Repository Structure

- **index.yaml:** An index file that lists all available chart versions.
- ***.tgz:** Compressed Helm chart packages for each release.

## Updates

This repository is automatically updated via our CI/CD workflow whenever a new release of **firecrest-ui** is created.
