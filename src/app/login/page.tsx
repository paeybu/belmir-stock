import { login } from '@/lib/actions/auth'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center -mt-6 -mb-28 md:-mb-10">
      <div className="w-full max-w-sm">
        {/* brand mark — the punched-hole tag signature, at the door */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <span className="grid h-12 w-12 place-items-center rounded-[4px] bg-signal">
            <span className="block h-4 w-4 rounded-full border-[2.5px] border-signal-ink/80" />
          </span>
          <div className="leading-none">
            <span className="block font-display font-extrabold uppercase tracking-tight text-2xl">Belmir</span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-muted mt-1">
              Stock Control
            </span>
          </div>
        </div>

        <div className="sheet overflow-hidden">
          {/* hazard rule — the one accent at the entrance */}
          <div
            className="h-1.5"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, var(--color-ink) 0 7px, var(--color-signal) 7px 14px)',
            }}
          />
          <div className="p-7">
            <p className="kicker mb-5">Staff sign-in</p>
            <form action={login} className="flex flex-col gap-4">
              <div>
                <label className="field-label">Email</label>
                <input name="email" type="email" required autoComplete="email" className="field" />
              </div>
              <div>
                <label className="field-label">Password</label>
                <input name="password" type="password" required autoComplete="current-password" className="field" />
              </div>
              <button type="submit" className="btn-signal mt-2">Sign in</button>
            </form>
          </div>
        </div>

        <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted mt-5">
          Authorised access only
        </p>
      </div>
    </div>
  )
}
