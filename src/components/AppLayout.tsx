import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LogIn, 
  Book, 
  BookOpen, 
  GraduationCap, 
  Layers, 
  Trophy, 
  PenLine,
  Menu,
  Moon,
  Sun
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const publicNavItems = [
  { path: '/reading', label: 'Leitura', icon: BookOpen },
  { path: '/flashcards', label: 'Flashcards', icon: Layers },
  { path: '/grammar', label: 'Gramática', icon: GraduationCap },
  { path: '/quiz', label: 'Quiz', icon: Trophy },
  { path: '/practice', label: 'Prática', icon: PenLine },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // For non-authenticated users, show a simpler layout with top navigation
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-background">
        {/* Header for non-authenticated users */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Book className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">EnglishStudy</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {publicNavItems.map((item) => (
              <Button 
                key={item.path}
                variant={isActive(item.path) ? 'secondary' : 'ghost'} 
                size="sm" 
                asChild
              >
                <Link to={item.path}>
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              </Button>
            ))}
            
            <div className="ml-2 h-6 w-px bg-border" />
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="ml-1"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <Button asChild size="sm" className="ml-2">
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-2" />
                Entrar
              </Link>
            </Button>
          </nav>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <nav className="flex flex-col gap-2 mt-6">
                  {publicNavItems.map((item) => (
                    <Button 
                      key={item.path}
                      variant={isActive(item.path) ? 'secondary' : 'ghost'} 
                      className="justify-start"
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link to={item.path}>
                        <item.icon className="h-4 w-4 mr-3" />
                        {item.label}
                      </Link>
                    </Button>
                  ))}
                  
                  <div className="my-2 h-px bg-border" />
                  
                  <Button asChild onClick={() => setMobileMenuOpen(false)}>
                    <Link to="/auth">
                      <LogIn className="h-4 w-4 mr-3" />
                      Entrar
                    </Link>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    );
  }

  // For authenticated users, show sidebar layout
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger className="-ml-1" />
            
            <div className="flex-1" />
          </header>

          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
