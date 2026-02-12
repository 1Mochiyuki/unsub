import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { signIn } = useAuthActions()
  const { isAuthenticated, isLoading } = useConvexAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 overflow-hidden relative">
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 bg-card border-border backdrop-blur-xl p-10 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] z-10 transition-all duration-500 hover:border-border">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-primary to-primary/90 mb-2 shadow-lg">
            <LogIn className="w-8 h-8 text-foreground" />
          </div>
          <h2 className="text-4xl font-black tracking-tight text-foreground italic">
            UNSUB<span className="text-primary not-italic">.</span>
          </h2>
          <p className="text-muted-foreground font-medium">
            Take back control of your YouTube feed
          </p>
        </div>

        <div className="pt-4">
          <Button
            size="lg"
            onClick={() => void signIn('google')}
            className="w-full h-14 bg-background hover:bg-muted text-foreground font-bold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl flex items-center justify-center gap-3 border-none"
          >
            Sign in with Google
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
            Secure Authentication via Convex
          </p>
        </div>
      </div>
    </div>
  )
}
