import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "/";
  revalidatePath(path);
  return NextResponse.json({ ok: true, revalidated: path });
}
