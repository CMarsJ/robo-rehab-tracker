
import React, { useEffect, useState } from 'react';
import { Home, FileText, Clock, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useApp, useTranslation } from '@/contexts/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { supabase } from '@/integrations/supabase/client';
const AppSidebar = () => {
  const t = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useApp();
  const { user, signOut } = useAuth();
  const { patientName } = useConfig();

  const menuItems = [
    {
      title: t.dashboard,
      url: '/',
      icon: Home,
    },
    {
      title: t.reports,
      url: '/reports',
      icon: FileText,
    },
    {
      title: t.history,
      url: '/history',
      icon: Clock,
    },
    {
      title: t.configuration,
      url: '/configuration',
      icon: Settings,
    },
  ];

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) { setAvatarUrl(null); return; }
      try {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url, display_name')
          .eq('user_id', user.id)
          .single();
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        } else {
          const metaUrl = (user as any)?.user_metadata?.avatar_url || (user as any)?.user_metadata?.picture || null;
          setAvatarUrl(metaUrl);
        }
      } catch {
        const metaUrl = (user as any)?.user_metadata?.avatar_url || (user as any)?.user_metadata?.picture || null;
        setAvatarUrl(metaUrl);
      }
    };
    loadProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">TR</span>
          </div>
          <div>
            <h2 className="font-semibold text-sm leading-tight">{t.systemTitle}</h2>
            <p className="text-xs text-muted-foreground">{language === 'es' ? 'Bilateral' : 'Bilateral'}</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    className="w-full justify-start"
                  >
                    <button 
                      onClick={() => navigate(item.url)}
                      className="flex items-center gap-2 w-full"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Mini perfil + Logout (reemplaza al toggle de modo) */}
      <SidebarFooter className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={patientName} />
            <AvatarFallback>{(patientName || 'P')[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{patientName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {(user && (user.email || (user as any)?.user_metadata?.name)) || 'Paciente'}
            </p>
          </div>
        </div>
        <Button onClick={handleLogout} variant="outline" className="mt-3 w-full">
          Cerrar sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;

