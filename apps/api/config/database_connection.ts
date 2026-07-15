import env from '#start/env'

export const databaseConnection =
  env.get('DB_CONNECTION') ??
  (env.get('RAILWAY_ENVIRONMENT_NAME') === 'production' ? 'pg' : 'sqlite')
