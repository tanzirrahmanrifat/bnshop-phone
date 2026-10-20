import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-x flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold">Page not found</h1>
      <p className="text-muted">The page you are looking for doesn&apos;t exist or was moved.</p>
      <div className="flex gap-3">
        <Link href="/" className="btn btn-dark">Home</Link>
        <Link href="/shop" className="btn btn-outline">Shop</Link>
      </div>
    </main>
  );
}
