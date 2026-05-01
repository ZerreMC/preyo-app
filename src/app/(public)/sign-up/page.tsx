import {SignUpForm} from "@/features/auth";

export default function SignUpPage() {
    return (
        <main
            className="relative min-h-dvh overflow-hidden bg-[linear-gradient(160deg,#ECF8EE_0%,#FFFDF8_60%)] px-4 py-10">
            <div
                className="pointer-events-none absolute right-0 top-0 size-48 rounded-full bg-[rgba(57,184,107,0.22)] blur-3xl"/>
            <div
                className="pointer-events-none absolute -left-16 top-1/4 size-40 rounded-full bg-[rgba(255,138,61,0.18)] blur-3xl"/>

            <div
                className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-md flex-col justify-center space-y-6">
                <div className="inline-flex items-center gap-2">
          <span
              className="flex size-9 items-center justify-center rounded-2xl bg-white text-lg font-black text-brand shadow-sm">
            P
          </span>
                    <span className="text-2xl font-black tracking-tight text-text-primary">
            preyo
          </span>
                </div>

                <SignUpForm/>
            </div>
        </main>
    );
}