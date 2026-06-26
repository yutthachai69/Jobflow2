/**
 * Ensure .env.local points at local Docker test Postgres (not Supabase / not ambiguous).
 * Run: node scripts/ensure-local-test-env.js
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const localPath = path.join(root, '.env.local')
const examplePath = path.join(root, 'env.test-postgres.example')

const TEST_DB =
  'DATABASE_URL="postgresql://postgres:postgres@localhost:5433/jobflow_test"'
const TEST_DIRECT =
  'DIRECT_URL="postgresql://postgres:postgres@localhost:5433/jobflow_test"'

function hasLocalTestDb(content) {
  return (
    /localhost:5433\/jobflow_test/i.test(content) ||
    /127\.0\.0\.1:5433\/jobflow_test/i.test(content)
  )
}

function looksLikeProduction(content) {
  return /supabase\.co|pooler\.supabase/i.test(content)
}

let content = ''
if (fs.existsSync(localPath)) {
  content = fs.readFileSync(localPath, 'utf8')
} else if (fs.existsSync(examplePath)) {
  content = fs.readFileSync(examplePath, 'utf8')
  console.log('Created .env.local from env.test-postgres.example')
} else {
  content = [
    '# Local test DB (clone of production via npm run db:test:sync)',
    TEST_DB,
    TEST_DIRECT,
    'NEXT_PUBLIC_APP_URL="http://localhost:3000"',
    '',
  ].join('\n')
  console.log('Created minimal .env.local for local test Postgres')
}

function upsertEnvLine(text, key, value) {
  const line = `${key}=${value}`
  const re = new RegExp(`^${key}=.*$`, 'm')
  if (re.test(text)) {
    return text.replace(re, line)
  }
  return text.trimEnd() + '\n' + line + '\n'
}

if (looksLikeProduction(content) || !hasLocalTestDb(content)) {
  content = upsertEnvLine(content, 'DATABASE_URL', '"postgresql://postgres:postgres@localhost:5433/jobflow_test"')
  content = upsertEnvLine(content, 'DIRECT_URL', '"postgresql://postgres:postgres@localhost:5433/jobflow_test"')
  if (looksLikeProduction(content)) {
    console.log('Replaced Supabase URLs in .env.local with localhost:5433/jobflow_test')
  } else {
    console.log('Set DATABASE_URL / DIRECT_URL to local test Postgres in .env.local')
  }
}

fs.writeFileSync(localPath, content.endsWith('\n') ? content : content + '\n', 'utf8')
console.log('OK: .env.local is configured for local test Postgres on port 5433')
