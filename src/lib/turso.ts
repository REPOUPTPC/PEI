import { createClient } from '@libsql/client';

const url =
  process.env.TURSO_DATABASE_URL ||
  'libsql://rectorado-herrejose.aws-ap-northeast-1.turso.io';

const authToken =
  process.env.TURSO_AUTH_TOKEN ||
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTIwMzQ0MzksImlkIjoiMDFhMTNkOTMtMzMwMS03YmE2LThkYTktOGI5N2U1MjdmNmMyIiwia2lkIjoidnM2Yl9rSmo5eXJSQkdqMXQ0WWhBUnlWcVg0Tmx6LXp2elhYeHVLQnV6RSIsInJpZCI6IjlmOWYzMDg3LTQyYTQtNDcwZi1hZDIwLTA5YzAxOTNkMmYzYSJ9.R5dpjGTcJyar2YF9WdPudtZMvYk_W31WEoGCG-GRtiIHE_4QbR_T8ekS7z1JOcY500ju-VboYpEH5M8dezRKBg';

export const db = createClient({
  url,
  authToken,
});

export default db;
