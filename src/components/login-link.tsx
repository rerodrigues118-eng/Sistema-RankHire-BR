"use client";

import Link from "next/link";

export default function LoginLink() {
  return (
    <Link
      href="/login"
      prefetch={false}
      className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
    >
      Ir para login
    </Link>
  );
}
