# FirecREST v2 UI

FirecREST UI is a web application providing the basic functionnalities to interact with a FirecREST API backend. 

FirecREST provides a REST API through which developers can interact with HPC resources (Schedulers, Filesystems, etc.). In addition FirecREST provides methods to authenticate and authorize, execution of  jobs through, file-system operations, and access to accounting or status information.

# Development

### Compile and run the web application 

## Requirements
- Node.js >= 21.0.0

## Local UI development with a local FirecREST environment

The requirements for the web app development are node and yarn.
```shellscript
node --version
yarn --version
```

Once the libraries are available
```shellscript
yarn install
yarn run dev
```

Open the UI on http://localhost:3000/, a login page (Keycloak) should show up.

Authenticate with the follwing credentials:
```credentials
client: fireuser
secret: password
```

## Docker

To simplify running FirecREST locally we provide a set of local Docker environments that already contain all required dependencies. Please make sure [Docker](https://www.docker.com/) is installed and running on your machine.

### Configuration

Please ensure that the FirecREST Docker Compose environment is running. To connect the UI with the backend, you need to create a ```.env``` file (refer to the provided env_example file for guidance).

### Authx

The FirecREST environment includes a set of default access configurations (Keycloak settings) that enable the UI to authenticate with an IDM.

## Helm Chart Repository

Our repository includes a dedicated [Helm Chart Repository](./helm) for deploying **firecrest-ui** using Helm.

For detailed instructions on how to add our Helm repository and install the chart, please refer to the [Helm Chart Repository README](./helm/README.md).


## UI software stack

📖 See the [Remix docs](https://remix.run/docs) and the [Remix Vite docs](https://remix.run/docs/en/main/future/vite) for details on supported features.

## License Notice for Tailwind UI Components

Firecrest-UI includes UI components that may be derived from Tailwind UI, a product by Tailwind Labs. Tailwind UI is subject to its own [Tailwind UI license](https://tailwindui.com/license), which prohibits redistribution of its components and templates.

### What This Means for You
- Firecrest-UI **does not distribute Tailwind UI components or templates directly**.
- If you are using Firecrest-UI and wish to modify or redistribute it, you **must ensure** that any Tailwind UI components you use are covered by a valid Tailwind UI license.
- Tailwind CSS itself is licensed under the **MIT License**, which allows free and open-source usage.

### Compliance Guidelines
- If you have purchased a Tailwind UI license, you may use its components **for your own projects or client work** but **cannot redistribute** them as open-source.
- Ensure that any UI components included in Firecrest-UI are either custom-built or derived from freely available Tailwind CSS styles.

For more details, please refer to the [Tailwind UI License](https://tailwindui.com/license).