import { db } from 'sdk';
import { trainees } from 'schema';
import { eq } from 'sdk/db';

export default async function (input, context) {
  const userId = context?.userId || input?.telegramId;
  if (!userId) {
    throw new Error('Unauthorized: missing userId');
  }

  const now = Date.now();
  const existing = await db.select().from(trainees).where(eq(trainees.telegramId, userId)).get();

  if (!existing) {
    const [newTrainee] = await db.insert(trainees).values({
      telegramId: userId,
      username: (input?.username || '').replace(/^@/, ''),
      firstName: input?.firstName || 'Атлет',
      coachId: input?.coachId || '548019148',
      status: 'new_lead',
      createdAt: now,
      updatedAt: now,
    }).returning().run();

    return { ok: true, trainee: newTrainee, created: true };
  } else {
    await db.update(trainees)
      .set({
        username: input?.username ? input.username.replace(/^@/, '') : existing.username,
        firstName: input?.firstName || existing.firstName,
        updatedAt: now,
      })
      .where(eq(trainees.telegramId, userId))
      .run();

    return { ok: true, trainee: existing, created: false };
  }
}
