# Railway deployment

The application is deployed by `.github/workflows/deploy-railway.yml` to the
Railway project `invoicer`.

| Git branch | GitHub environment | Railway environment |
| --- | --- | --- |
| `staging` | `staging` | `staging` |
| `master` | `production` | `production` |

Every push first runs linting, type-checking, tests, and a complete build. The
`api` and `web` services are deployed only after those checks pass. A manual
workflow run can target either environment.

Each GitHub environment owns a `RAILWAY_TOKEN` secret scoped to the matching
Railway environment. Rotate a token in Railway and update only the corresponding
GitHub environment secret.

The API uses one persistent SQLite volume per environment. Its start command
runs pending migrations before starting AdonisJS. The services expose Railway
domains, and the web service receives the matching public API URL at build time.

## Release flow

1. Merge or push a candidate revision to `staging`.
2. Validate the staging web and API deployments.
3. Merge the same revision to `master` to release it to production.

Do not bypass the `quality` job for production releases.
