import Link from "next/link";

export default function IntroductionPage() {
  return (
    <Link
      href="/choose"
      className="flex min-h-screen items-center justify-center"
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          Welcome to MREC
        </h1>

        <p className="mt-4 max-w-lg">
          Experience our company profile through
          interactive technology and digital identity.
        </p>

        <p className="mt-10 text-sm opacity-60">
          Click Anywhere To Continue
        </p>
      </div>
    </Link>
  );
}