import { Link, createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated, useConvexAuth } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Filter, Shield, Trash2, Youtube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { signIn } = useAuthActions()
  const { isLoading } = useConvexAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center space-y-8 bg-gradient-to-b from-background to-muted/20">
        <div className="space-y-6 max-w-4xl animate__animated animate__fadeInUp">
          <div className="inline-flex items-center justify-center p-2 bg-muted/50 rounded-full mb-4 ring-1 ring-border">
            <span className="text-sm font-medium px-2 flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-500" />
              Manage your YouTube subscriptions
            </span>
          </div>

          <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-foreground mb-2">
            UNSUB<span className="text-primary">.</span>
          </h1>

          <p className="text-3xl md:text-5xl font-bold tracking-tight text-muted-foreground">
            Clean up your YouTube feed.
          </p>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto text-balance font-light leading-relaxed pt-4">
            Bulk unsubscribe from channels you no longer watch.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center animate__animated animate__fadeInUp animate__delay-1s">
          <Authenticated>
            <Button
              asChild
              size="lg"
              className="font-bold text-lg h-14 px-8 rounded-full shadow-lg hover:shadow-primary/20 transition-all"
            >
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </Authenticated>
          <Unauthenticated>
            <Button
              size="lg"
              onClick={() => void signIn('google')}
              className="font-bold text-lg h-14 px-8 rounded-full shadow-lg hover:shadow-primary/20 transition-all gap-2"
            >
              Login with Google
            </Button>
            <p className="text-xs text-muted-foreground mt-2 sm:mt-0 sm:hidden">
              Secure authentication via Google
            </p>
          </Unauthenticated>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <CardTitle className="text-xl">Bulk Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Select multiple channels and unsubscribe in one click. No more
                  tedious manual removal.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <Filter className="w-6 h-6 text-blue-500" />
                </div>
                <CardTitle className="text-xl">Smart Filtering</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  See which channels haven't posted in years.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
                <CardTitle className="text-xl">Safe & Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Official YouTube API integration. Your data stays private and
                  we never store your credentials.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
