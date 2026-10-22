import { db, EndpointError } from "sdk";
import { trainees } from "../schema.js";

const COACH_CHAT_ID = 548019148;

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  const username = (user?.username || "").toLowerCase().replace(/^@/, "");

  if (user?.id !== COACH_CHAT_ID && username !== "onyshchenkosergey") {
    throw new EndpointError("Forbidden: Coach access only", { code: "FORBIDDEN" });
  }

  const allTrainees = await db.select().from(trainees).all();
  return { ok: true, trainees: allTrainees };
}
