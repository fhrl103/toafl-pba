import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Aplikasi TOAFL PBA</h1>
      <p className="text-gray-600">Selamat datang.</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Login
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
        >
          Dashboard Mahasiswa
        </Link>
        <Link
          href="/admin"
          className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
        >
          Admin
        </Link>
      </div>
    </main>
  );
}
