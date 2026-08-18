import Link from "next/link";

export default function ChoosePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <h1 className="mb-10 text-center text-4xl font-bold">
        Choose Experience
      </h1>

      <div className="flex flex-col gap-6">
        <Link
          href="/scan-id"
          className="w-80 rounded-2xl border p-6 text-center transition hover:scale-105"
        >
          <h2 className="text-2xl font-semibold">
            🪪 Employee ID Card
          </h2>

          <p className="mt-2 text-sm opacity-70">
            Scan employee ID card
          </p>
        </Link>

        <Link
          href="/scan-company"
          className="w-80 rounded-2xl border p-6 text-center transition hover:scale-105"
        >
          <h2 className="text-2xl font-semibold">
            💼 Business Card
          </h2>

          <p className="mt-2 text-sm opacity-70">
            Scan company business card
          </p>
        </Link>
      </div>

      <Link
        href="/introduction"
        className="mt-10 rounded-lg border px-6 py-3"
      >
        ← Back
      </Link>
    </main>
  );
}