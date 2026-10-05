import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-xl font-semibold text-brand-700 mb-1">
          SQI College of ICT
        </h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

        <LoginForm />
      </div>
    </main>
  );
}
