export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase-server";

const ALLOWED_EXTS = ["jpg", "jpeg", "png", "webp", "heic"];
const BUCKET_MAP: Record<string, string> = {
  receipt: "receipts",
  wishlist: "wishlist-photos",
  background: "app-backgrounds",
};

// POST { bucket, filename } → { signedUrl, publicUrl }
// Client uploads directly to Supabase storage via signedUrl (PUT),
// then saves the publicUrl to the relevant record.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bucket: bucketKey, filename } = await req.json() as { bucket?: string; filename?: string };
  if (!bucketKey || !filename) return NextResponse.json({ error: "bucket and filename required" }, { status: 400 });

  const bucket = BUCKET_MAP[bucketKey];
  if (!bucket) return NextResponse.json({ error: "Unknown bucket" }, { status: 400 });

  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  if (!ALLOWED_EXTS.includes(ext)) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });

  const path = `${user.id}/${Date.now()}.${ext}`;
  const db = serverDb();

  const { data, error } = await db.storage
    .from(bucket)
    .createSignedUploadUrl(path, { upsert: true } as never);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = db.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({
    signedUrl: (data as { signedUrl: string }).signedUrl,
    publicUrl: `${publicUrl}?t=${Date.now()}`,
  });
}
