import type { Metadata } from "next";
import { TrackForm } from "@/components/TrackForm";

export const metadata: Metadata = {
  title: "Track your order or repair",
  description: "Check the status of your order or phone repair with your order number or repair ID and mobile number.",
};

export default function TrackPage() {
  return (
    <main className="container-x flex max-w-[720px] flex-col gap-6 pb-16 pt-8">
      <h1 className="text-3xl font-extrabold">Track your order or repair</h1>
      <TrackForm />
    </main>
  );
}
