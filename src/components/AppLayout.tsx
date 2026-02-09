import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {isAuthenticated && <AppSidebar />}
        
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            {isAuthenticated && <SidebarTrigger className="-ml-1" />}
            
            <div className="flex-1" />
            
            {!isAuthenticated && !isLoading && (
              <Button asChild variant="outline" size="sm">
                <Link to="/auth">
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </Link>
              </Button>
            )}
          </header>

          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
