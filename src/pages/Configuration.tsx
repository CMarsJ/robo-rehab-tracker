
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useApp, useTranslation } from '@/contexts/AppContext';
import { Settings, User, Bell, Palette, Volume2 } from 'lucide-react';

const Configuration = () => {
  const { darkMode, setDarkMode } = useApp();
  const t = useTranslation();
  const [notifications, setNotifications] = React.useState(true);
  const [volume, setVolume] = React.useState([70]);
  const [autoSave, setAutoSave] = React.useState(true);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t.configuration}</h1>
        <p className="text-muted-foreground">
          Personaliza la configuración del sistema según tus preferencias
        </p>
      </div>

      <div className="grid gap-6">
        {/* Configuración de Apariencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Apariencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Modo Oscuro</Label>
                <p className="text-sm text-muted-foreground">
                  Activa el tema oscuro para una mejor experiencia visual
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Notificaciones del Sistema</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe notificaciones sobre sesiones completadas y logros
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Audio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Audio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Volumen del Sistema</Label>
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>{volume[0]}%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Datos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Datos y Almacenamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-save">Guardado Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Guarda automáticamente los datos de las sesiones
                </p>
              </div>
              <Switch
                id="auto-save"
                checked={autoSave}
                onCheckedChange={setAutoSave}
              />
            </div>
            
            <div className="pt-4 border-t">
              <Button variant="destructive" className="w-full">
                Limpiar Datos de Sesiones
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Esta acción eliminará todos los datos históricos de las sesiones. 
                Esta acción no se puede deshacer.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Información del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Versión del Sistema</p>
                <p className="font-medium">v1.0.0</p>
              </div>
              <div>
                <p className="text-muted-foreground">Última Actualización</p>
                <p className="font-medium">18 Jun 2024</p>
              </div>
              <div>
                <p className="text-muted-foreground">Modo Actual</p>
                <p className="font-medium">Terapia</p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>
                <p className="font-medium text-medical-green">Conectado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Configuration;
