
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BarChart3, FileText, Clock, Settings } from 'lucide-react';
import {
  Sidebar as SidebarContainer,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: BarChart3 },
  { title: 'Reportes', url: '/reportes', icon: FileText },
  { title: 'Historial', url: '/historial', icon: Clock },
  { title: 'Configuración', url: '/configuracion', icon: Settings },
];

export const Sidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const [isTrainingMode, setIsTrainingMode] = useState(true);

  const collapsed = state === 'collapsed';
  const isActive = (path: string) => location.pathname === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700';

  return (
    <SidebarContainer className={`${collapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}>
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TR</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Terapia Robótica</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Bilateral</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getNavCls({ isActive })}`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Mode Selector */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <SidebarGroupLabel className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
              Modo de Operación
            </SidebarGroupLabel>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="mode-switch" className="text-sm text-gray-700 dark:text-gray-300">
                  {isTrainingMode ? 'Entrenamiento' : 'Terapia'}
                </Label>
                <Switch
                  id="mode-switch"
                  checked={!isTrainingMode}
                  onCheckedChange={(checked) => setIsTrainingMode(!checked)}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isTrainingMode ? 'Registro base y práctica' : 'Sesiones asistidas reales'}
              </p>
            </div>
          </div>
        )}
      </SidebarContent>
    </SidebarContainer>
  );
};
