import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Query sederhana ke Supabase (select now()) untuk memastikan
 * koneksi database hidup, lalu mengembalikan { ok: true, timestamp }.
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const supabase = getSupabaseAdminClient();

    // Query sederhana: ambil satu baris berisi now() dari pg via RPC fallback,
    // atau select ringan pada tabel yang hampir selalu ada.
    const { error } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    // PGRST116/PGRST205 (tabel tidak ditemukan) tetap dianggap "koneksi OK"
    // selama tidak ada error jaringan; error lain dianggap gagal.
    if (error && error.code !== "42P01" && !/does not exist|Could not find/i.test(error.message)) {
      return NextResponse.json(
        { ok: false, timestamp, error: error.message },
        { status: 503 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, timestamp, error: message },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, timestamp });
}
