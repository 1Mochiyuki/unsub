import { Link } from '@tanstack/react-router'
import { useAction, useConvexAuth, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { LogIn, LogOut } from 'lucide-react'
import { api } from 'convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ModeToggle } from '@/components/ModeToggle'

export default function Header() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { signOut } = useAuthActions()
  const revokeGoogleToken = useAction(api.youtube.revokeGoogleToken)
  const handleSignOut = async () => {
    await revokeGoogleToken()
    await signOut()
  }
  const user = useQuery(api.users.getMe)

  return (
    <header className="px-6 py-4 flex items-center justify-between bg-background border-b border-border text-foreground shadow-lg backdrop-blur-md sticky top-0 z-50">
      <Link to="/" className="hover:opacity-80 transition-opacity shrink-0">
        <h1 className="text-2xl font-black tracking-tight italic text-primary">
          UNSUB<span className="not-italic">.</span>
        </h1>
      </Link>

      {isAuthenticated && !isLoading && (
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/dashboard">Dashboard</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/history">History</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )}

      <div className="flex items-center gap-4">
        <ModeToggle />
        {isAuthenticated && !isLoading ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="w-10 h-10 border-2 border-border shadow-lg hover:border-primary/50 transition-colors cursor-pointer">
                <AvatarImage
                  src={user?.image ?? undefined}
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 bg-card border-border"
              align="end"
            >
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive hover:bg-card/80 hover:text-destructive/90 focus:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          !isLoading && (
            <Link to="/login">
              <Button
                variant="outline"
                className="border-border hover:bg-card/80 hover:text-foreground text-muted-foreground rounded-xl"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </Link>
          )
        )}
      </div>
    </header>
  )
}
