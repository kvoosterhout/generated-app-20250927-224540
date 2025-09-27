import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Timer, LayoutDashboard, FolderKanban, Users, Clock, Menu, FileText, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Time Entries', href: '/time-entries', icon: Clock },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Reports', href: '/reports', icon: FileText },
];
const NavLinks = ({ className }: { className?: string; }) => (
  <nav className={cn("flex flex-col gap-2", className)}>
    {navigation.map((item) => (
      <NavLink
        key={item.name}
        to={item.href}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50',
            isActive && 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-slate-50 font-semibold'
          )
        }
      >
        <item.icon className="h-5 w-5" />
        {item.name}
      </NavLink>
    ))}
  </nav>
);
const AppLayout = () => {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?';
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-slate-50/50 dark:bg-slate-900/50 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <NavLink to="/" className="flex items-center gap-2 font-semibold font-display">
              <Timer className="h-6 w-6 text-blue-800" />
              <span className="text-xl">ChronoFlow</span>
            </NavLink>
          </div>
          <div className="flex-1">
            <div className="py-4 px-2 lg:px-4">
              <NavLinks />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-slate-50/50 dark:bg-slate-900/50 px-4 lg:h-[60px] lg:px-6">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <NavLink to="/" className="flex items-center gap-2 font-semibold font-display">
                  <Timer className="h-6 w-6 text-blue-800" />
                  <span className="text-xl">ChronoFlow</span>
                </NavLink>
              </div>
              <div onClick={() => setIsSheetOpen(false)}>
                <NavLinks className="p-4" />
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1" />
          <ThemeToggle className="relative top-0 right-0" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>{user?.email}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50/80 dark:bg-background p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
};
export default AppLayout;