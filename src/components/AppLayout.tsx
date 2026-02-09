import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogIn, Book, BookOpen, GraduationCap } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

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
            <span className="text-lg font-bold hidden sm:inline">EnglishStudy</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Button 
              variant={location.pathname === '/reading' ? 'secondary' : 'ghost'} 
              size="sm" 
              asChild
            >
              <Link to="/reading">
                <BookOpen className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Leitura</span>
              </Link>
            </Button>
            <Button 
              variant={location.pathname === '/grammar' ? 'secondary' : 'ghost'} 
              size="sm" 
              asChild
            >
              <Link to="/grammar">
                <GraduationCap className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Gramática</span>
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-2" />
                Entrar
              </Link>
            </Button>
          </nav>
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
