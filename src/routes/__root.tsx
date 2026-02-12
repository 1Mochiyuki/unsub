import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { ThemeProvider } from 'tanstack-theme-kit'
import Header from '../components/Header'
import appCss from '../styles.css?url'
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
      <head>
        <HeadContent />
      </head>
      <body>
        <ConvexProvider>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <Header />
            <div className="flex-1">{children}</div>
          </ThemeProvider>
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  )
}
