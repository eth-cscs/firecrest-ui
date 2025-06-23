# Getting Started

## Local Development

### Requirements
- Node.js >= 22.0.0
- Yarn

### Backend Configuration

To connect the UI with the backend, create a `.env` file based on the provided `env_example` file. The variables in the `.env` file should be configured according to the backend environment you intend to use.

### Local Backend Setup

To simplify running the FirecREST API locally, we provide a set of Docker environments pre-configured with all required dependencies. Ensure [Docker](https://www.docker.com/) is installed and running on your machine. Follow the instructions for local development of the FirecREST API v2.

### Remote Backend Setup

If your infrastructure includes a remote FirecREST API instance, update your `.env` file accordingly to connect to the remote backend.

### Local UI Development with a Local FirecREST Environment

#### Prerequisites
Ensure the following tools are installed:
```bash
node --version
yarn --version
```

#### Steps to Run the UI Locally
1. Install dependencies:
    ```bash
    yarn install
    ```

2. Start the development server:
    ```bash
    yarn run dev
    ```

3. Open the UI in your browser at [http://localhost:3000/](http://localhost:3000/). You should see a login page (Keycloak).

#### Authentication
Use the following credentials to log in:
```plaintext
Client: fireuser
Secret: password
```

### Notes
- Ensure all dependencies are up-to-date for a smooth development experience.
- Refer to the FirecREST API documentation for additional backend configuration details.
- For troubleshooting, consult the project's issue tracker or documentation.