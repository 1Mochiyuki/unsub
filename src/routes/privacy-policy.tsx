import { createFileRoute } from "@tanstack/react-router";
import { Eye, FileText, Lock, Shield } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
    component: PrivacyPolicy,
});

function PrivacyPolicy() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-20 animate-in fade-in duration-500">
            <div className="space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Privacy Policy</h1>
                    <p className="text-muted-foreground text-lg">Last updated: February 18, 2026</p>
                </div>

                <div className="h-px bg-border my-8" />

                <div className="space-y-12">
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-primary">
                            <Shield className="h-6 w-6" />
                            <h2 className="text-2xl font-semibold tracking-tight">The Short Version</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            I respect your privacy. I don't sell your data. I only use your Google account
                            information to help you manage your YouTube subscriptions.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-primary">
                            <Eye className="h-6 w-6" />
                            <h2 className="text-2xl font-semibold tracking-tight">Data Collection</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            When you use UNSUB., I collect the following limited information:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                            <li>
                                <span className="font-medium text-foreground">Google Account Profile:</span> Name,
                                email address, and profile picture (to display in the header).
                            </li>
                            <li>
                                <span className="font-medium text-foreground">YouTube Data:</span> Your subscription
                                list and channel details (to help you unsubscribe).
                            </li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-primary">
                            <Lock className="h-6 w-6" />
                            <h2 className="text-2xl font-semibold tracking-tight">How UNSUB. Uses Your Data</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            I use this data strictly to provide the UNSUB. service. specifically:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                            <li>To authenticate you.</li>
                            <li>To show you a list of your subscriptions.</li>
                            <li>To process your unsubscribe requests.</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            I do <span className="font-bold text-foreground">NOT</span> sell, rent, or share your
                            personal information with third parties for marketing purposes.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-primary">
                            <FileText className="h-6 w-6" />
                            <h2 className="text-2xl font-semibold tracking-tight">Data Retention</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            I only hold onto your data as long as you have an account. If you choose to delete
                            your account, your data is removed from database.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-primary">
                            <Shield className="h-6 w-6" />
                            <h2 className="text-2xl font-semibold tracking-tight">Data Security</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            Data is encrypted in transit (HTTPS/TLS) and at rest (256-bit AES) using Convex
                            backend.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-primary">
                            <FileText className="h-6 w-6" />
                            <h2 className="text-2xl font-semibold tracking-tight">Third-Party Services</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            Convex hosts the backend database and provides authentication. See the{" "}
                            <a
                                href="https://convex.dev/legal/privacy"
                                className="text-primary hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Convex privacy policy
                            </a>{" "}
                            for details.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
