import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, CheckCircle2, Scale, ShieldCheck } from 'lucide-react'

export const Route = createFileRoute('/terms-of-service')({
  component: TermsOfService,
})

function TermsOfService() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-20 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-lg">
            Last updated: February 12, 2026
          </p>
        </div>

        <div className="h-px bg-border my-8" />

        <div className="space-y-12">
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <CheckCircle2 className="h-6 w-6" />
              <h2 className="text-2xl font-semibold tracking-tight">
                Agreement to Terms
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using UNSUB., you agree to be bound by these Terms
              of Service. If you do not agree to these terms, please do not use
              our service. It's as simple as that.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <ShieldCheck className="h-6 w-6" />
              <h2 className="text-2xl font-semibold tracking-tight">
                Responsible Use
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              You agree to use UNSUB. only for lawful purposes. You agree not
              to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Violate any applicable laws or regulations.</li>
              <li>Infringe upon the rights of others.</li>
              <li>Interfere with or disrupt the service.</li>
              <li>
                Attempt to gain unauthorized access to any part of the service.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <AlertCircle className="h-6 w-6" />
              <h2 className="text-2xl font-semibold tracking-tight">
                Disclaimer
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              UNSUB. is provided "as is" and "as available" without any
              warranties of any kind. We do not guarantee that the service will
              be uninterrupted, error-free, or completely secure. Use it at your
              own risk.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <Scale className="h-6 w-6" />
              <h2 className="text-2xl font-semibold tracking-tight">
                Limitation of Liability
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              To the fullest extent permitted by law, UNSUB. shall not be liable
              for any indirect, incidental, special, consequential, or punitive
              damages arising out of or relating to your use of the service.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
