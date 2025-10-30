
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Settings, User, Bell, Volume2, Save, Shield, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Configuracion = () => {
  const { user } = useAuth();
  const [patientName, setPatientName] = useState('');
  const [therapistName, setTherapistName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [sessionReminders, setSessionReminders] = useState(true);
  const [achievementNotifications, setAchievementNotifications] = useState(true);
  const [soundVolume, setSoundVolume] = useState([75]);
  const [autoSave, setAutoSave] = useState(true);
  const [dataBackup, setDataBackup] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, therapist_name, patient_age')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          const profile = data as any;
          if (profile.display_name) setPatientName(profile.display_name);
          if (profile.therapist_name) setTherapistName(profile.therapist_name);
          if (profile.patient_age) setPatientAge(profile.patient_age.toString());
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);

  const handleSaveSettings = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para guardar la configuración.",
        variant: 'destructive',
      });
      return;
    }

    const age = patientAge ? parseInt(patientAge) : null;
    
    if (patientAge && (isNaN(age!) || age! <= 0 || age! > 150)) {
      toast({
        title: "Error",
        description: "Por favor ingresa una edad válida (1-150 años).",
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: patientName,
          therapist_name: therapistName,
          patient_age: age
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Configuración guardada",
        description: "Todas las configuraciones han sido actualizadas correctamente.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: 'destructive',
      });
    }
  };

  const handleResetSettings = async () => {
    setPatientName('');
    setTherapistName('');
    setPatientAge('');
    setSessionReminders(true);
    setAchievementNotifications(true);
    setSoundVolume([75]);
    setAutoSave(true);
    setDataBackup(true);
    setPrivacyMode(false);
    
    toast({
      title: "Configuración restablecida",
      description: "Todas las configuraciones han sido restablecidas a los valores por defecto.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Configuración del Sistema
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Personaliza la configuración del sistema de rehabilitación
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Perfil del Usuario */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <User className="w-5 h-5" />
              Información del Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="patient-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre del Paciente
              </Label>
              <Input
                id="patient-name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Ingresa el nombre del paciente"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="patient-age" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Edad del Paciente
              </Label>
              <Input
                id="patient-age"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="Edad"
                type="number"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="therapist-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre del Terapeuta
              </Label>
              <Input
                id="therapist-name"
                value={therapistName}
                onChange={(e) => setTherapistName(e.target.value)}
                placeholder="Ingresa el nombre del terapeuta"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recordatorios de Sesión
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Recibe notificaciones para tus sesiones programadas
                </p>
              </div>
              <Switch
                checked={sessionReminders}
                onCheckedChange={setSessionReminders}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notificaciones de Logros
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Celebra tus avances y logros en la terapia
                </p>
              </div>
              <Switch
                checked={achievementNotifications}
                onCheckedChange={setAchievementNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sistema */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuración del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                Volumen de Sonido
              </Label>
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-gray-500" />
                <Slider
                  value={soundVolume}
                  onValueChange={setSoundVolume}
                  max={100}
                  min={0}
                  step={5}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem]">
                  {soundVolume[0]}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Guardado Automático
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Guarda automáticamente el progreso de las sesiones
                </p>
              </div>
              <Switch
                checked={autoSave}
                onCheckedChange={setAutoSave}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacidad y Seguridad */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacidad y Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Respaldo de Datos
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Crear copias de seguridad automáticas
                </p>
              </div>
              <Switch
                checked={dataBackup}
                onCheckedChange={setDataBackup}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Modo Privacidad
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Limitar el registro de datos sensibles
                </p>
              </div>
              <Switch
                checked={privacyMode}
                onCheckedChange={setPrivacyMode}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button variant="outline" onClick={handleResetSettings}>
              Restablecer
            </Button>
            <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Guardar Configuración
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracion;
