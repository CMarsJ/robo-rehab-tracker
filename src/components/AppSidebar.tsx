
import React from 'react';
import { Home, FileText, Clock, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useApp, useTranslation } from '@/contexts/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';

const AppSidebar = () => {
  const t = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useApp();

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

    </Sidebar>
  );
};

export default AppSidebar;
