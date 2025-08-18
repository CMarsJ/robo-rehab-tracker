
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppContextType {
  language: 'es' | 'en' | 'pt' | 'ru';
  setLanguage: (lang: 'es' | 'en' | 'pt' | 'ru') => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  type: 'success' | 'info' | 'warning' | 'error';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const translations = {
  es: {
    dashboard: 'Terapia Bilateral',
    reports: 'Reportes',
    history: 'Historial',
    configuration: 'Configuración',
    trainingMode: 'Entrenamiento',
    therapyMode: 'Terapia',
    systemTitle: 'Terapia Robótica Bilateral',
    monitoringSystem: 'Sistema de Terapias',
    rehabilitation: 'Rehabilitación Robótica Bilateral Post-ACV',
    realTimeMonitoring: 'Monitoreo en Tiempo Real',
    nonPareticHand: 'Mano No Parética',
    pareticHand: 'Mano Parética',
    withSensors: 'Con Sensores',
    withExoskeleton: 'Con Exoesqueleto',
    inactive: 'Inactivo',
    active: 'Activo',
    therapyTimer: 'Temporizador de Terapia',
    duration: 'Duración (minutos)',
    start: 'Iniciar',
    pause: 'Pausar',
    restart: 'Reiniciar',
    ready: 'Listo',
    achievements: 'Logros de',
    weeklyProgress: 'Progreso semanal',
    monthlyProgress: 'Progreso mensual',
    completed: 'completado esta semana',
    effortAnalysis: 'Análisis de Esfuerzo del Paciente',
    patientAnalysis: 'Análisis del Paciente',
    averageWeeklyTime: 'Tiempo promedio semanal',
    minutes: 'min',
    week: 'semana',
    currentWeek: 'Semana actual',
    previousWeek: 'Semana anterior',
    notifications: 'Notificaciones',
    markAsRead: 'Marcar como leída',
    markAllAsRead: 'Marcar todas como leídas',
    noNotifications: 'No hay notificaciones',
    congratulationsTraining: 'Felicidades por completar el entrenamiento diario',
    sessionCompleted: 'Sesión de terapia completada exitosamente',
    locale: 'es-ES'
  },
  en: {
    dashboard: 'Bilateral Therapy',
    reports: 'Reports',
    history: 'History',
    configuration: 'Configuration',
    trainingMode: 'Training',
    therapyMode: 'Therapy',
    systemTitle: 'Bilateral Robotic Therapy',
    monitoringSystem: 'Therapy System',
    rehabilitation: 'Post-Stroke Bilateral Robotic Rehabilitation',
    realTimeMonitoring: 'Real-Time Monitoring',
    nonPareticHand: 'Non-Paretic Hand',
    pareticHand: 'Paretic Hand',
    withSensors: 'With Sensors',
    withExoskeleton: 'With Exoskeleton',
    inactive: 'Inactive',
    active: 'Active',
    therapyTimer: 'Therapy Timer',
    duration: 'Duration (minutes)',
    start: 'Start',
    pause: 'Pause',
    restart: 'Restart',
    ready: 'Ready',
    achievements: 'Achievements of',
    weeklyProgress: 'Weekly progress',
    monthlyProgress: 'Monthly progress',
    completed: 'completed this week',
    effortAnalysis: 'Patient Effort Analysis',
    patientAnalysis: 'Patient Analysis',
    averageWeeklyTime: 'Weekly average time',
    minutes: 'min',
    week: 'week',
    currentWeek: 'Current week',
    previousWeek: 'Previous week',
    notifications: 'Notifications',
    markAsRead: 'Mark as read',
    markAllAsRead: 'Mark all as read',
    noNotifications: 'No notifications',
    congratulationsTraining: 'Congratulations on completing daily training',
    sessionCompleted: 'Therapy session completed successfully',
    locale: 'en-US'
  },
  pt: {
    dashboard: 'Terapia Bilateral',
    reports: 'Relatórios',
    history: 'Histórico',
    configuration: 'Configuração',
    trainingMode: 'Treinamento',
    therapyMode: 'Terapia',
    systemTitle: 'Terapia Robótica Bilateral',
    monitoringSystem: 'Sistema de Terapia',
    rehabilitation: 'Reabilitação Robótica Bilateral Pós-AVC',
    realTimeMonitoring: 'Monitoramento em Tempo Real',
    nonPareticHand: 'Mão Não Parética',
    pareticHand: 'Mão Parética',
    withSensors: 'Com Sensores',
    withExoskeleton: 'Com Exoesqueleto',
    inactive: 'Inativo',
    active: 'Ativo',
    therapyTimer: 'Temporizador de Terapia',
    duration: 'Duração (minutos)',
    start: 'Iniciar',
    pause: 'Pausar',
    restart: 'Reiniciar',
    ready: 'Pronto',
    achievements: 'Conquistas de',
    weeklyProgress: 'Progresso semanal',
    monthlyProgress: 'Progresso mensal',
    completed: 'completado esta semana',
    effortAnalysis: 'Análise de Esforço do Paciente',
    patientAnalysis: 'Análise do Paciente',
    averageWeeklyTime: 'Tempo médio semanal',
    minutes: 'min',
    week: 'semana',
    currentWeek: 'Semana atual',
    previousWeek: 'Semana anterior',
    notifications: 'Notificações',
    markAsRead: 'Marcar como lida',
    markAllAsRead: 'Marcar todas como lidas',
    noNotifications: 'Nenhuma notificação',
    congratulationsTraining: 'Parabéns por completar o treinamento diário',
    sessionCompleted: 'Sessão de terapia concluída com sucesso',
    locale: 'pt-BR'
  },
  ru: {
    dashboard: 'Двусторонняя терапия',
    reports: 'Отчеты',
    history: 'История',
    configuration: 'Настройки',
    trainingMode: 'Тренировка',
    therapyMode: 'Терапия',
    systemTitle: 'Двусторонняя роботизированная терапия',
    monitoringSystem: 'Терапевтическая система',
    rehabilitation: 'Двусторонняя роботизированная реабилитация после инсульта',
    realTimeMonitoring: 'Мониторинг в реальном времени',
    nonPareticHand: 'Непаретичная рука',
    pareticHand: 'Паретичная рука',
    withSensors: 'С датчиками',
    withExoskeleton: 'С экзоскелетом',
    inactive: 'Неактивно',
    active: 'Активно',
    therapyTimer: 'Таймер терапии',
    duration: 'Продолжительность (минуты)',
    start: 'Начать',
    pause: 'Пауза',
    restart: 'Перезапуск',
    ready: 'Готов',
    achievements: 'Достижения',
    weeklyProgress: 'Недельный прогресс',
    monthlyProgress: 'Месячный прогресс',
    completed: 'завершено на этой неделе',
    effortAnalysis: 'Анализ усилий пациента',
    patientAnalysis: 'Анализ пациента',
    averageWeeklyTime: 'Среднее недельное время',
    minutes: 'мин',
    week: 'неделя',
    currentWeek: 'Текущая неделя',
    previousWeek: 'Предыдущая неделя',
    notifications: 'Уведомления',
    markAsRead: 'Отметить как прочитанное',
    markAllAsRead: 'Отметить все как прочитанные',
    noNotifications: 'Нет уведомлений',
    congratulationsTraining: 'Поздравляем с завершением ежедневной тренировки',
    sessionCompleted: 'Сеанс терапии успешно завершен',
    locale: 'ru-RU'
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'es' | 'en' | 'pt' | 'ru'>('es');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      darkMode,
      setDarkMode,
      notifications,
      addNotification,
      markNotificationAsRead,
      markAllNotificationsAsRead
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const useTranslation = () => {
  const { language } = useApp();
  return translations[language];
};
