import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { ThemeProvider } from 'tanstack-theme-kit'
import Header from '../components/Header'
import { Footer } from '../components/Footer'
import appCss from '../styles.css?url'
import { Toaster } from '@/components/ui/sonner'
import ConvexProvider from '@/integrations/convex/provider'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'UNSUB.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <meta
        name="google-site-verification"
        content="prslihA2wkf0MqQBbzIoTp5d_15y1bq881iIB738GfU"
      />
      <head>
        <HeadContent />
      </head>
      <body>
        <ConvexProvider>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </ThemeProvider>
        </ConvexProvider>
        <Toaster />
        <Scripts />
      </body>
    </html>
  )
}
