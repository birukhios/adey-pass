import { AdeyLogo } from "@/components/adey-logo";
import { VerifyForm } from "@/components/verify-form";

type Props = { params: Promise<{ token: string }> };

export default async function VerifyPage({ params }: Props) {
  const { token } = await params;

  return (
    <main className="min-h-screen bg-[#F4F6FB] px-4 py-6">
      <div className="mx-auto max-w-lg">
        <div className="rounded-lg bg-[#111418] p-5"><AdeyLogo /></div>
        <section className="mt-5 rounded-xl border border-[#E7EBF3] bg-white p-6 shadow-[0_24px_48px_-24px_rgba(17,20,24,0.35)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#B38F00]">Identity verification</p>
          <h1 className="mt-2 text-3xl font-black">National/Fayda ID</h1>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">This prototype uses a mock/manual verification structure. No government API is connected.</p>
          <VerifyForm token={token} />
        </section>
      </div>
    </main>
  );
}
