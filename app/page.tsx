import Link from "next/link";

export default function Home() {
  return (
    <Link
      href="/introduction"
      className="flex min-h-screen items-center justify-center"
    >
      <div className="text-center">
        <h1 className="text-6xl font-bold">
          MREC
        </h1>

        <p className="mt-4 text-xl">
          Digital Identity
        </p>

        <p className="mt-10 text-sm opacity-60">
          Click Anywhere To Continue
        </p>
      </div>
    </Link>
  );
}