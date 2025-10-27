
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
    locale: 'es-ES',
    // Rankings
    position: 'Pos.',
    date: 'Fecha',
    glasses: 'Vasos',
    oranges: 'Naranjas',
    timePerGlass: 'Tiempo/Vaso',
    timePerOrange: 'Tiempo/Naranja',
    score: 'Puntaje',
    pointsPerSecond: 'Pts/Seg',
    pointsPerMinute: 'Pts/Min',
    noRecords: 'No hay registros aún',
    loginToViewRankings: 'Inicia sesión para ver rankings',
    rankingOrangeSqueeze: 'Ranking - Exprimiendo Naranjas',
    rankingNeuroLink: 'Ranking - NeuroLink',
    rankingFlappyBird: 'Ranking - Flappy Bird',
    // Hand Monitoring
    articulationAngles: 'Ángulos de Articulación',
    thumb: 'Pulgar',
    fingers: 'Dedos',
    // Simulator
    dataSimulator: 'Simulador de Datos',
    mqttConnected: 'MQTT Conectado',
    mqttDisconnected: 'MQTT Desconectado',
    receivingRealData: 'Recibiendo datos reales - Simulador deshabilitado',
    connectedNoData: 'Conectado pero sin datos - Habilite el simulador',
    enableSimulator: 'Habilitar Simulador',
    useSimulatedData: 'Usar datos simulados',
    automaticMode: 'Modo Automático',
    randomDataEvery30s: 'Datos aleatorios cada 30s',
    leftHandActive: 'Mano Izq. Activa',
    rightHandActive: 'Mano Der. Activa',
    leftHandNonParetic: 'Mano Izquierda (No Parética)',
    rightHandParetic: 'Mano Derecha (Parética)',
    muscularEffort: 'Esfuerzo Muscular',
    leftHand: 'Mano Izquierda',
    rightHand: 'Mano Derecha',
    sendSimulatedData: 'Enviar Datos Simulados',
    usingRealData: 'Usando Datos Reales',
    automaticModeActive: 'Modo Automático Activo',
    simulatorDisabled: 'Simulador Deshabilitado',
    logout: 'Cerrar sesión',
    days: 'días',
    completedThisWeek: 'completado esta semana',
    completedThisMonth: 'completado este mes'
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
    locale: 'en-US',
    // Rankings
    position: 'Pos.',
    date: 'Date',
    glasses: 'Glasses',
    oranges: 'Oranges',
    timePerGlass: 'Time/Glass',
    timePerOrange: 'Time/Orange',
    score: 'Score',
    pointsPerSecond: 'Pts/Sec',
    pointsPerMinute: 'Pts/Min',
    noRecords: 'No records yet',
    loginToViewRankings: 'Login to view rankings',
    rankingOrangeSqueeze: 'Ranking - Orange Squeeze',
    rankingNeuroLink: 'Ranking - NeuroLink',
    rankingFlappyBird: 'Ranking - Flappy Bird',
    // Hand Monitoring
    articulationAngles: 'Joint Angles',
    thumb: 'Thumb',
    fingers: 'Fingers',
    // Simulator
    dataSimulator: 'Data Simulator',
    mqttConnected: 'MQTT Connected',
    mqttDisconnected: 'MQTT Disconnected',
    receivingRealData: 'Receiving real data - Simulator disabled',
    connectedNoData: 'Connected but no data - Enable simulator',
    enableSimulator: 'Enable Simulator',
    useSimulatedData: 'Use simulated data',
    automaticMode: 'Automatic Mode',
    randomDataEvery30s: 'Random data every 30s',
    leftHandActive: 'Left Hand Active',
    rightHandActive: 'Right Hand Active',
    leftHandNonParetic: 'Left Hand (Non-Paretic)',
    rightHandParetic: 'Right Hand (Paretic)',
    muscularEffort: 'Muscular Effort',
    leftHand: 'Left Hand',
    rightHand: 'Right Hand',
    sendSimulatedData: 'Send Simulated Data',
    usingRealData: 'Using Real Data',
    automaticModeActive: 'Automatic Mode Active',
    simulatorDisabled: 'Simulator Disabled',
    logout: 'Logout',
    days: 'days',
    completedThisWeek: 'completed this week',
    completedThisMonth: 'completed this month'
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
    locale: 'pt-BR',
    // Rankings
    position: 'Pos.',
    date: 'Data',
    glasses: 'Copos',
    oranges: 'Laranjas',
    timePerGlass: 'Tempo/Copo',
    timePerOrange: 'Tempo/Laranja',
    score: 'Pontuação',
    pointsPerSecond: 'Pts/Seg',
    pointsPerMinute: 'Pts/Min',
    noRecords: 'Ainda não há registros',
    loginToViewRankings: 'Faça login para ver os rankings',
    rankingOrangeSqueeze: 'Ranking - Espremer Laranjas',
    rankingNeuroLink: 'Ranking - NeuroLink',
    rankingFlappyBird: 'Ranking - Flappy Bird',
    // Hand Monitoring
    articulationAngles: 'Ângulos de Articulação',
    thumb: 'Polegar',
    fingers: 'Dedos',
    // Simulator
    dataSimulator: 'Simulador de Dados',
    mqttConnected: 'MQTT Conectado',
    mqttDisconnected: 'MQTT Desconectado',
    receivingRealData: 'Recebendo dados reais - Simulador desabilitado',
    connectedNoData: 'Conectado mas sem dados - Habilite o simulador',
    enableSimulator: 'Habilitar Simulador',
    useSimulatedData: 'Usar dados simulados',
    automaticMode: 'Modo Automático',
    randomDataEvery30s: 'Dados aleatórios a cada 30s',
    leftHandActive: 'Mão Esq. Ativa',
    rightHandActive: 'Mão Dir. Ativa',
    leftHandNonParetic: 'Mão Esquerda (Não Parética)',
    rightHandParetic: 'Mão Direita (Parética)',
    muscularEffort: 'Esforço Muscular',
    leftHand: 'Mão Esquerda',
    rightHand: 'Mão Direita',
    sendSimulatedData: 'Enviar Dados Simulados',
    usingRealData: 'Usando Dados Reais',
    automaticModeActive: 'Modo Automático Ativo',
    simulatorDisabled: 'Simulador Desabilitado',
    logout: 'Sair',
    days: 'dias',
    completedThisWeek: 'completado esta semana',
    completedThisMonth: 'completado este mês'
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
    locale: 'ru-RU',
    // Rankings
    position: 'Поз.',
    date: 'Дата',
    glasses: 'Стаканы',
    oranges: 'Апельсины',
    timePerGlass: 'Время/Стакан',
    timePerOrange: 'Время/Апельсин',
    score: 'Счет',
    pointsPerSecond: 'Очк/Сек',
    pointsPerMinute: 'Очк/Мин',
    noRecords: 'Пока нет записей',
    loginToViewRankings: 'Войдите, чтобы увидеть рейтинг',
    rankingOrangeSqueeze: 'Рейтинг - Выжимание апельсинов',
    rankingNeuroLink: 'Рейтинг - NeuroLink',
    rankingFlappyBird: 'Рейтинг - Flappy Bird',
    // Hand Monitoring
    articulationAngles: 'Углы суставов',
    thumb: 'Большой палец',
    fingers: 'Пальцы',
    // Simulator
    dataSimulator: 'Симулятор данных',
    mqttConnected: 'MQTT подключен',
    mqttDisconnected: 'MQTT отключен',
    receivingRealData: 'Получение реальных данных - Симулятор отключен',
    connectedNoData: 'Подключено, но нет данных - Включите симулятор',
    enableSimulator: 'Включить симулятор',
    useSimulatedData: 'Использовать симулированные данные',
    automaticMode: 'Автоматический режим',
    randomDataEvery30s: 'Случайные данные каждые 30с',
    leftHandActive: 'Левая рука активна',
    rightHandActive: 'Правая рука активна',
    leftHandNonParetic: 'Левая рука (непаретичная)',
    rightHandParetic: 'Правая рука (паретичная)',
    muscularEffort: 'Мышечное усилие',
    leftHand: 'Левая рука',
    rightHand: 'Правая рука',
    sendSimulatedData: 'Отправить симулированные данные',
    usingRealData: 'Использование реальных данных',
    automaticModeActive: 'Автоматический режим активен',
    simulatorDisabled: 'Симулятор отключен',
    logout: 'Выйти',
    days: 'дней',
    completedThisWeek: 'завершено на этой неделе',
    completedThisMonth: 'завершено в этом месяце'
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
