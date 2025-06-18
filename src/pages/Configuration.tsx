
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from '@/contexts/AppContext';
import { Settings, User, Database, Volume2 } from 'lucide-react';

const Configuration = () => {
  const t = useTranslation();
  const [volume, setVolume] = React.useState([70]);
  const [autoSave, setAutoSave] = React.useState(true);
  const [dataBackup, setDataBackup] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t.configuration}</h1>
        <p className="text-muted-foreground">
          Personaliza la configuración del sistema según tus preferencias
        </p>
      </div>

      <div className="grid gap-6">
        {/* Configuración de Audio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Audio del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Volumen de Notificaciones</Label>
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
              <Database className="w-5 h-5" />
              Gestión de Datos
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

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="data-backup">Respaldo de Datos</Label>
                <p className="text-sm text-muted-foreground">
                  Crear respaldos automáticos de los datos de terapia
                </p>
              </div>
              <Switch
                id="data-backup"
                checked={dataBackup}
                onCheckedChange={setDataBackup}
              />
            </div>
            
            <div className="pt-4 border-t space-y-3">
              <Button variant="outline" className="w-full">
                Exportar Datos de Sesiones
              </Button>
              <Button variant="destructive" className="w-full">
                Limpiar Datos de Sesiones
              </Button>
              <p className="text-xs text-muted-foreground">
                Esta acción eliminará todos los datos históricos de las sesiones. 
                Esta acción no se puede deshacer.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configuración del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Sistema de Terapia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Duración Predeterminada de Sesión</Label>
              <Slider
                defaultValue={[15]}
                max={60}
                min={5}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5min</span>
                <span>15min</span>
                <span>60min</span>
              </div>
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
