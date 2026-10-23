import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

// Cross-invocation global memory store
const globalStore: Map<string, { data: any; updatedAt: number }> =
  (globalThis as any).__smtSyncMemoryStore || new Map();
(globalThis as any).__smtSyncMemoryStore = globalStore;

// Universal writable directory across serverless / docker / local
const DATA_DIR = path.join(os.tmpdir(), "smt_sync_users");

function getUserFile(telegramId: string) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = path.join(DATA_DIR, `${telegramId}.json`);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("[UserSync API] Temp dir read fallback:", e);
  }
  return null;
}

function saveUserFile(telegramId: string, payload: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = path.join(DATA_DIR, `${telegramId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(payload), "utf8");
  } catch (e) {
    console.warn("[UserSync API] Temp dir write fallback:", e);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get("telegramId");

    if (!telegramId) {
      return NextResponse.json({ ok: false, error: "telegramId is required" }, { status: 400 });
    }

    // 1. Check memory cache first (fastest, ~1ms)
    const cached = globalStore.get(String(telegramId));
    if (cached) {
      return NextResponse.json({
        ok: true,
        data: cached.data,
        updatedAt: cached.updatedAt,
        source: "memory",
      });
    }

    // 2. Check disk /tmp storage
    const fileData = getUserFile(String(telegramId));
    if (fileData) {
      globalStore.set(String(telegramId), {
        data: fileData.data,
        updatedAt: fileData.updatedAt || Date.now(),
      });
      return NextResponse.json({
        ok: true,
        data: fileData.data,
        updatedAt: fileData.updatedAt,
        source: "disk",
      });
    }

    return NextResponse.json({ ok: true, data: null, message: "No remote state yet" });
  } catch (error: any) {
    console.error("[UserSync GET] Error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { telegramId, data } = body;

    if (!telegramId || !data) {
      return NextResponse.json({ ok: false, error: "telegramId and data are required" }, { status: 400 });
    }

    const payload = {
      data,
      updatedAt: Date.now(),
    };

    // Update memory
    globalStore.set(String(telegramId), payload);

    // Update disk /tmp
    saveUserFile(String(telegramId), payload);

    return NextResponse.json({ ok: true, updatedAt: payload.updatedAt });
  } catch (error: any) {
    console.error("[UserSync POST] Error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
