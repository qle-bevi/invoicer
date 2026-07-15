import { existsSync } from 'node:fs'
import app from '@adonisjs/core/services/app'
import { BaseSchema } from '@adonisjs/lucid/schema'
import Database from 'better-sqlite3'
import { databaseConnection } from '#config/database_connection'

interface LegacyUser {
  id: number
  full_name: string | null
  email: string
  password: string
  created_at: string
  updated_at: string | null
}

interface LegacyAccessToken {
  id: number
  tokenable_id: number
  type: string
  name: string | null
  hash: string
  abilities: string
  created_at: string | null
  updated_at: string | null
  last_used_at: string | null
  expires_at: string | null
}

export default class extends BaseSchema {
  async up() {
    if (databaseConnection !== 'pg') {
      return
    }

    const sqlitePath = app.tmpPath('db.sqlite3')

    if (!existsSync(sqlitePath)) {
      return
    }

    const sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true })

    try {
      const users = sqlite.prepare('SELECT * FROM users ORDER BY id').all() as LegacyUser[]
      const accessTokens = sqlite
        .prepare('SELECT * FROM auth_access_tokens ORDER BY id')
        .all() as LegacyAccessToken[]

      if (users.length > 0) {
        await this.db.table('users').insert(users).onConflict('id').ignore()
      }

      if (accessTokens.length > 0) {
        await this.db.table('auth_access_tokens').insert(accessTokens).onConflict('id').ignore()
      }

      await this.db.rawQuery(`
        SELECT setval(
          pg_get_serial_sequence('users', 'id'),
          COALESCE(MAX(id), 1),
          MAX(id) IS NOT NULL
        )
        FROM users
      `)
      await this.db.rawQuery(`
        SELECT setval(
          pg_get_serial_sequence('auth_access_tokens', 'id'),
          COALESCE(MAX(id), 1),
          MAX(id) IS NOT NULL
        )
        FROM auth_access_tokens
      `)

      console.info(
        `Migrated ${users.length} users and ${accessTokens.length} access tokens from SQLite`
      )
    } finally {
      sqlite.close()
    }
  }

  async down() {
    // Keep migrated production data intact if this migration is rolled back.
  }
}
