import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { isAuthenticated, isLoading } = useConvexAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
      <div className="max-w-4xl mx-auto text-center space-y-8 p-8">
        <h1 className="text-5xl md:text-6xl tracking-tight italic mb-4">
          UNSUB<span className="text-primary not-italic">.</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl">
          Clean up your YouTube subscriptions
        </p>
      </div>
    </div>
  )
}
