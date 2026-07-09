import ResetForm from "./reset-form";

export const metadata = {
  title: "RankHire BR | Recuperar senha",
  description: "Recupere sua senha com e-mail de redefinição enviado pelo Supabase.",
};

export default function ResetPage() {
  return (
    <div className="landing-dark min-h-screen flex items-center justify-center bg-[#030307] px-6 py-16">
      <ResetForm />
    </div>
  );
}
