import { AdeyLogo } from "@/components/adey-logo";
import { SetupForm } from "@/components/auth/setup-form";

export default function SetupPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F4F6FB] px-4 py-8">
      <section className="w-full max-w-xl rounded-xl border border-[#E7EBF3] bg-white p-6 shadow-[0_24px_48px_-24px_rgba(17,20,24,0.35)]">
        <div className="rounded-lg bg-[#111418] p-5">
          <AdeyLogo />
        </div>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-[#B38F00]">First admin setup</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Create Super Admin</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">This setup endpoint only works while there are zero users in the database.</p>
        <SetupForm />
      </section>
    </main>
  );
}
