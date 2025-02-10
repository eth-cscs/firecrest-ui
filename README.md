## FirecREST UI Helm Charts

This is a repository for a Helm chart to deploy [FirecREST UI](https://github.com/eth-cscs/firecrest-ui).

### Fetching the repository

```bash
helm repo add firecrest-ui https://eth-cscs.github.io/firecrest-ui
helm repo update
```

The available versions can be listed with

```bash
helm search repo firecrest-ui --versions
```

### Deploying the chart

```bash
helm install --create-namespace <deployment-name> -n <namespace> firecrest-ui --values values.yaml
```
