import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Book,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Sun,
  TrendingUp,
  User,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/reading', label: 'Leitura', icon: BookOpen },
  { path: '/flashcards', label: 'Flashcards', icon: Layers },
  { path: '/grammar', label: 'Gramática', icon: GraduationCap },
  { path: '/progress', label: 'Progresso', icon: TrendingUp },
];

const adminNavItems = [
  { path: '/admin', label: 'Administração', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { isAdmin, user, signOut, profile } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Utilizador';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border">
        <Link to="/" className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Book className="h-4 w-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold">EnglishStudy</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={item.label}
                  >
                    <Link to={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      tooltip={item.label}
                    >
                      <Link to={item.path}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} tooltip="Alternar tema">
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>{resolvedTheme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {user && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={displayName}>
                  <User className="h-4 w-4" />
                  <span className="truncate">{displayName}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut} tooltip="Sair">
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
