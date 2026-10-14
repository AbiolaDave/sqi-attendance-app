import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fc] p-3 sm:p-5 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1440px] overflow-hidden rounded-[28px] bg-white shadow-[0_32px_100px_rgba(28,43,79,0.13)] sm:min-h-[calc(100vh-40px)] sm:rounded-[34px] lg:min-h-[calc(100vh-64px)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-[720px] overflow-hidden bg-[#17213c] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div
            aria-hidden="true"
            className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full border border-white/[0.08]"
          />
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-[370px] w-[370px] rounded-full border border-white/[0.08]"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-40 -left-28 h-[440px] w-[440px] rounded-full bg-brand-600/25 blur-3xl"
          />
          <div className="relative flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-cyan-400 text-xl font-black shadow-lg shadow-brand-500/25">
              S
            </span>
            <span>
              <span className="block text-base font-bold tracking-wide">
                SQI College
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Academic portal
              </span>
            </span>
          </div>

          <div className="relative max-w-xl py-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Your next chapter starts here
            </span>
            <h1 className="mt-7 text-5xl font-semibold leading-[1.08] tracking-tight xl:text-6xl">
              Learn with purpose.
              <span className="mt-2 block bg-gradient-to-r from-brand-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">
                Build your future.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
              One place for your classes, progress, assessments and the people
              helping you get where you want to go.
            </p>

            <div className="mt-11 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
                  Keep moving
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  Your learning, in sync
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
                  Stay connected
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  Your academic community
                </p>
              </div>
            </div>
          </div>

          <p className="relative text-xs text-slate-500">
            © {new Date().getFullYear()} SQI College of ICT
          </p>
        </section>

        <section className="flex min-h-[calc(100vh-24px)] flex-col justify-center px-6 py-12 sm:px-12 lg:min-h-0 lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-[420px]">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 text-lg font-black text-white shadow-lg shadow-brand-500/20">
                S
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-800">
                  SQI College
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Academic portal
                </span>
              </span>
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
              Welcome back
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-[34px]">
              Sign in to continue
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter your account details to access your academic workspace.
            </p>
            <div className="mt-8 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_12px_38px_rgba(28,43,79,0.055)] sm:p-7">
              <LoginForm />
            </div>
            <p className="mt-7 text-center text-xs text-slate-400">
              Secure access to the SQI academic platform
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
