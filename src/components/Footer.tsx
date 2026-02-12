import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 flex flex-col items-center justify-center gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
          <Link
            to="/privacy-policy"
            className="transition-colors hover:text-foreground hover:underline underline-offset-4"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms-of-service"
            className="transition-colors hover:text-foreground hover:underline underline-offset-4"
          >
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  )
}
