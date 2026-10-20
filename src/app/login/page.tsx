import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getUser } from "@/lib/auth";
import { safeNext } from "@/lib/format";

export const metadata: Metadata = { title: "Sign in or register", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getUser()) redirect(next);
  return (
    <main className="container-x flex max-w-[1000px] flex-wrap items-stretch gap-6 pb-16 pt-10">
      <section className="card flex flex-[999_1_400px] flex-col gap-5 p-6 sm:p-8">
        <div>
          <h1 className="text-[26px] font-extrabold">Sign in or create an account</h1>
          <p className="text-sm text-muted">Use your Brunei mobile number or Google. New customers are registered automatically.</p>
        </div>
        {sp.error && <p role="alert" className="alert alert-error">Sign-in failed. Please try again.</p>}
        <LoginForm next={next} />
      </section>
      <aside className="flex flex-[1_1_280px] flex-col gap-4 rounded-3xl bg-ink p-8 text-white">
        <h2 className="text-[22px] font-extrabold">Why create an account?</h2>
        <ul className="flex flex-col gap-3.5">
          <li>✓ Track your orders and repairs in one place</li>
          <li>✓ Faster checkout with your saved details</li>
          <li>✓ Member-only deals</li>
        </ul>
        <p className="mt-auto text-[13px] text-[#aeb9ca]">You can also check out as a guest.</p>
      </aside>
    </main>
  );
}
