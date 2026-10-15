import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'libsql://rectorado-herrejose.aws-ap-northeast-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || '';

export const db = createClient({
  url,
  authToken,
});

export default db;
