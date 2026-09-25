/**
 * =============================================================================
 * TOAFL PBA — Seed script (supabase/seed.ts)
 * =============================================================================
 * Membuat akun admin default + baris exam_config singleton.
 *
 * Cara menjalankan (dari root project, pastikan .env.local terisi):
 *   npm run seed          # otomatis memuat .env.local (node --env-file)
 * atau manual:
 *   node --env-file=.env.local ./node_modules/.bin/tsx supabase/seed.ts
 *
 * Query layer: langsung @supabase/supabase-js via client service-role
 * (lib/supabase/admin.ts) — BUKAN Prisma. Client ini menembus RLS sehingga
 * bisa menulis ke tabel yang di-migration dengan default-deny policy.
 * =============================================================================
 */

// NOTE: File ini dieksekusi oleh tsx di Node.js (bukan bagian dari bundle
// Next.js), jadi lib/supabase/admin.ts tidak bisa diimpor apa adanya karena
// ada guard `import "server-only"`. Guard tersebut justru menegaskan aturan
// yang sama: file ini adalah kode server-side dan TIDAK BOLEH diimpor dari
// client component. Karena itu kita buat client service-role secara identik
// di sini (URL + SUPABASE_SERVICE_ROLE_KEY dari environment).
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
// ws: fallback WebSocket untuk Node.js 20 (supabase-js >= 2.5x butuh native
// WebSocket yang baru tersedia stabil di Node >= 22).
import ws from "ws";

const DEFAULT_ADMIN_PASSWORD = "ganti-saya-123";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Isi .env.local terlebih dahulu lalu jalankan ulang seed."
    );
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws as never },
  });

  // 1) Hash password default memakai bcryptjs (sama seperti lib/auth/password.ts).
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  // 2) Insert satu baris users dengan role='admin', nim_nip='admin'.
  //    On-conflict diabaikan agar seed aman dijalankan berulang kali.
  const { error: userError } = await supabase.from("users").insert({
    nim_nip: "admin",
    nama_lengkap: "Administrator",
    email: "admin@toafl.test",
    password_hash: passwordHash,
    role: "admin",
    is_active: true,
  });

  if (userError) {
    if (userError.code === "23505") {
      console.log("Admin sudah ada — skip insert users.");
    } else {
      throw new Error(`Gagal insert admin: ${userError.message}`);
    }
  } else {
    console.log("Akun admin dibuat (nim_nip='admin').");
  }

  // 3) Insert baris default exam_config (id=1, is_open=false) bila belum ada.
  const { error: configError } = await supabase
    .from("exam_config")
    .upsert({ id: 1, is_open: false }, { ignoreDuplicates: true });

  if (configError) {
    throw new Error(`Gagal insert exam_config: ${configError.message}`);
  }
  console.log("exam_config default siap (id=1, is_open=false).");

  console.log("\n==============================================");
  console.log("!!! GANTI PASSWORD ADMIN INI SEGERA SETELAH DEPLOY PERTAMA !!!");
  console.log(`Login  : nim_nip 'admin'`);
  console.log(`Pass   : '${DEFAULT_ADMIN_PASSWORD}'`);
  console.log("==============================================\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
