/**
 * Block accidental reads/writes to remote production DB during local development.
 * Set ALLOW_PRODUCTION_DATABASE=true to override (e.g. one-off migration).
 */
export function assertSafeDatabaseUrl(databaseUrl: string | undefined): void {
  if (!databaseUrl) return
  if (process.env.NODE_ENV === 'production') return
  if (process.env.NODE_ENV === 'test') return
  if (process.env.ALLOW_PRODUCTION_DATABASE === 'true') return

  const url = databaseUrl.toLowerCase()

  const isSupabase =
    url.includes('supabase.co') ||
    url.includes('pooler.supabase.com')

  const isRemotePostgres =
    url.startsWith('postgresql://') &&
    !url.includes('localhost') &&
    !url.includes('127.0.0.1') &&
    !url.includes('@db:5432/')

  if (isSupabase || isRemotePostgres) {
    throw new Error(
      [
        'DATABASE_URL points to a remote/production database.',
        'Local dev must use SQLite (file:./sqlite/dev.db) or local test Postgres (localhost:5433/jobflow_test).',
        '',
        'Recommended:',
        '  1) Copy env.test-postgres.example → .env.local',
        '  2) npm run db:test:sync',
        '  3) npm run dev:test',
        '',
        'To override (dangerous): ALLOW_PRODUCTION_DATABASE=true',
      ].join('\n')
    )
  }
}
