import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  LogOut,
  Video,
  Users,
  Settings,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutShellProps {
  children: React.ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If no user, just render children (likely auth page)
  if (!user) return <div className="min-h-screen bg-background text-foreground">{children}</div>;

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <div className={`
          flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group
          ${isActive
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}
        `}>
          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'group-hover:text-primary transition-colors'}`} />
          <span className="font-medium">{label}</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 border-r border-border/50 bg-card/50 backdrop-blur-xl p-6 relative z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold font-display tracking-tight">StreamLine</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem href="/" icon={Users} label="Dashboard" />
          {/* <NavItem href="/history" icon={History} label="Call History" /> */}
          <NavItem href="/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="mt-auto pt-6 border-t border-border/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-border"
              style={{ backgroundColor: user.avatarColor, color: '#fff' }}
            >
              {user.email?.slice(0, 2).toUpperCase() || 'NA'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.email || 'No email'}</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border/50 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold font-display">StreamLine</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="md:hidden fixed inset-0 bg-background z-50 flex flex-col p-6"
          >
            <div className="flex justify-end mb-8">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-6 h-6" />
              </Button>
            </div>
            <nav className="flex-1 space-y-4">
              <div onClick={() => setIsMobileMenuOpen(false)}>
                <NavItem href="/" icon={Users} label="Dashboard" />
              </div>
              <div onClick={() => setIsMobileMenuOpen(false)}>
                <NavItem href="/settings" icon={Settings} label="Settings" />
              </div>
            </nav>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
}
