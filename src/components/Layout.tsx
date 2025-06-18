
import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import NotificationDropdown from '@/components/NotificationDropdown';
import LanguageSelector from '@/components/LanguageSelector';
import DataSimulator from '@/components/DataSimulator';
import { useApp } from '@/contexts/AppContext';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { darkMode, setDarkMode } = useApp();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDarkMode(!darkMode)}
                  className="w-9 px-0"
                >
                  {darkMode ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
                <NotificationDropdown />
                <LanguageSelector />
              </div>
            </div>
          </header>
          
          {/* Content */}
          <div className="flex-1 p-6 overflow-auto">
            {children}
          </div>
        </main>
        
        {/* Data Simulator */}
        <DataSimulator />
      </div>
    </SidebarProvider>
  );
};

export default Layout;
