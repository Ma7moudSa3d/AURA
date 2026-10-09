import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x py-32 text-center">
      <p className="h-display gold-text text-8xl">404</p>
      <Link href="/" className="btn-ghost mt-8">AURA</Link>
    </div>
  );
}
