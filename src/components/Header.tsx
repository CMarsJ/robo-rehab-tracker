
import { useState, useEffect } from 'react';
import { Bell, Sun, Moon, Globe, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  timestamp: Date;
}

export const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('es');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      message: "¡Felicidades por completar el entrenamiento diario!",
      isRead: false,
      timestamp: new Date()
    },
    {
      id: '2',
      message: "Recuerda tu sesión de terapia programada para las 3:00 PM",
      isRead: false,
      timestamp: new Date()
    },
    {
      id: '3',
      message: "Nuevo reporte mensual disponible",
      isRead: false,
      timestamp: new Date()
    }
  ]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const changeLanguage = (newLanguage: string) => {
    setLanguage(newLanguage);
    // Aquí se implementaría la lógica de traducción
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const addNotification = (message: string) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      message,
      isRead: false,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Exponer función para agregar notificaciones globalmente
  useEffect(() => {
    (window as any).addNotification = addNotification;
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getLanguageText = (lang: string) => {
    const texts = {
      es: { name: 'Español', notifications: 'Notificaciones', markAllRead: 'Marcar todas como leídas' },
      en: { name: 'English', notifications: 'Notifications', markAllRead: 'Mark all as read' },
      pt: { name: 'Português', notifications: 'Notificações', markAllRead: 'Marcar todas como lidas' }
    };
    return texts[lang as keyof typeof texts] || texts.es;
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      <SidebarTrigger />
      
      <div className="flex items-center gap-4">
        {/* Idioma */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-300">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <DropdownMenuItem onClick={() => changeLanguage('es')} className="cursor-pointer">
              🇪🇸 Español
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('en')} className="cursor-pointer">
              🇺🇸 English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('pt')} className="cursor-pointer">
              🇧🇷 Português
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Modo Oscuro */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className="text-gray-600 dark:text-gray-300"
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Notificaciones */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-gray-600 dark:text-gray-300">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 text-xs bg-red-500">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {getLanguageText(language).notifications}
              </h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs p-1 h-auto"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  {getLanguageText(language).markAllRead}
                </Button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-3 border-b border-gray-100 dark:border-gray-600 last:border-b-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className={`text-sm flex-1 ${notification.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {notification.message}
                    </div>
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 h-auto"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {notification.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
