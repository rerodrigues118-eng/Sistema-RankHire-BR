import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <main className="max-w-md w-full p-8">
        <h1 className="text-2xl font-bold text-black mb-6">Acesse o sistema</h1>
        <p className="mb-6 text-sm text-gray-700">Para continuar, faça login no sistema.</p>
        <Link href="/login" className="inline-block bg-blue-600 text-white px-4 py-2 rounded">
          Ir para login
        </Link>
      </main>
    </div>
  );
}
