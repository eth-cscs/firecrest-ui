# Contributing

Contributions to FirecREST UI are welcome. See [LICENSE](./LICENSE) for licensing terms and
[CONTRIBUTORS.md](./CONTRIBUTORS.md) for the list of contributors.

## Contribution guidelines

### Submission

- Submit your contributions as GitHub Pull Requests to the main public repository at
  https://github.com/eth-cscs/firecrest-ui targeting the `main` branch.
- When adding new features or fixing bugs not covered by existing tests, please also provide
  unit tests.
- Every source file must include the standard license header (see any existing file, or
  `LICENSE_HEADER`) — this is CI-enforced (`yarn run check-licence`) and will fail the build
  if missing.
- Before submitting, make sure the following all pass locally:
  - `yarn lint`
  - `yarn typecheck`
  - `yarn test`
  - `yarn build`
- If a change alters an existing API response shape this app depends on, or changes existing
  behavior in a way that isn't backward compatible, call that out explicitly in the PR
  description.

## Development setup

See the [README](./README.md) for local development setup (`yarn install`, `yarn dev`) and the
[deployment documentation](https://eth-cscs.github.io/firecrest-ui/deployment/) for how the app
is built and deployed.
