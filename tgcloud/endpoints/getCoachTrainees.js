import { db } from 'sdk';
import { trainees } from 'schema';
import { desc } from 'sdk/db';

export default async function (input, context) {
  const list = await db.select()
    .from(trainees)
    .orderBy(desc(trainees.updatedAt))
    .all();

  return { ok: true, trainees: list || [] };
}
