import Link from "next/link";
import { AdeyLogo } from "@/components/adey-logo";
import { Field } from "@/components/ui";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F4F6FB] px-4 py-8">
      <section className="w-full max-w-md rounded-xl border border-[#E7EBF3] bg-white p-6 shadow-[0_24px_48px_-24px_rgba(17,20,24,0.35)]">
        <div className="rounded-lg bg-[#111418] p-5">
          <AdeyLogo />
        </div>
        <h1 className="mt-8 text-3xl font-black tracking-tight">Reset Password</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">Password reset email delivery is a placeholder for the production mail provider integration.</p>
        <form className="mt-6 grid gap-4">
          <Field label="Email" placeholder="super@adeypass.local" type="email" />
          <button className="ap-button-primary h-12 text-sm font-black" type="button">Send Reset Link</button>
          <Link className="text-center text-sm font-bold text-[#7A5C00]" href="/login">Back to login</Link>
        </form>
      </section>
    </main>
  );
}
