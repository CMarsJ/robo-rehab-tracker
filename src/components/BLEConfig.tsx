import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { bleService, BLEService } from '@/services/bleService';
import { useToast } from '@/hooks/use-toast';
import { Bluetooth, BluetoothOff, Settings, AlertTriangle, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BLEConfigProps {
  onConnectionChange?: (connected: boolean) => void;
}

const BLEConfig: React.FC<BLEConfigProps> = ({ onConnectionChange }) => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [isSupported] = useState(BLEService.isSupported());

  useEffect(() => {
    bleService.onStatus((status, message) => {
      const connected = status === 'connected';
      setIsConnected(connected);
      setDeviceName(bleService.getDeviceName());
      onConnectionChange?.(connected);
      
      if (status === 'error') {
        toast({
          title: '❌ Error BLE',
          description: message || 'Error de conexión Bluetooth',
          variant: 'destructive',
        });
      }
    });

    bleService.onEmergency((emergency) => {
      setIsEmergency(emergency);
      if (emergency) {
        toast({
          title: '🚨 ¡EMERGENCIA!',
          description: 'Se ha activado la parada de emergencia',
          variant: 'destructive',
        });
      }
    });

    // Comprobar estado actual
    setIsConnected(bleService.isConnected());
  }, []);

  const handleConnect = async () => {
    if (!isSupported) {
      toast({
        title: 'No soportado',
        description: 'Web Bluetooth no está disponible en este navegador. Usa Chrome o Edge.',
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);
    try {
      await bleService.connect();
      toast({
        title: '✅ Conectado',
        description: `Conectado a ${bleService.getDeviceName() || 'ESP32'}`,
      });
      setIsOpen(false);
    } catch (error: any) {
      if (error.name !== 'NotFoundError') {
        toast({
          title: '❌ Error de conexión',
          description: error.message || 'No se pudo conectar al dispositivo BLE',
          variant: 'destructive',
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    bleService.disconnect();
    toast({
      title: 'Desconectado',
      description: 'Conexión Bluetooth cerrada',
    });
    onConnectionChange?.(false);
  };

  const handleEmergency = async () => {
    await bleService.sendEmergency();
    toast({
      title: '🚨 Emergencia enviada',
      description: 'Comando de emergencia enviado al ESP32',
      variant: 'destructive',
    });
  };

  const handleStart = async () => {
    await bleService.startTherapy();
    toast({ title: '🚀 Inicio', description: 'Comando START enviado al ESP32' });
  };

  const handleStop = async () => {
    await bleService.stopTherapy();
    toast({ title: '🛑 Detenido', description: 'Comando STOP enviado al ESP32' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${isEmergency ? 'border-red-500 text-red-500 animate-pulse' : ''}`}
        >
          {isConnected ? (
            <>
              <Bluetooth className="h-4 w-4 text-blue-500" />
              {deviceName || 'Conectado'}
            </>
          ) : (
            <>
              <BluetoothOff className="h-4 w-4 text-muted-foreground" />
              Conectar BLE
            </>
          )}
          {isEmergency && <AlertTriangle className="h-4 w-4 text-red-500" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración Bluetooth
          </DialogTitle>
          <DialogDescription>
            Conecta al dispositivo ESP32_IMU_BLE vía Bluetooth
          </DialogDescription>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-sm">ESP32_IMU_BLE</CardTitle>
            <CardDescription className="text-xs">
              Web Bluetooth API • BLE (Bluetooth Low Energy)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-0">
            {/* Estado de conexión */}
            <div className="flex items-center gap-2">
              <Badge
                variant={isConnected ? 'default' : 'secondary'}
                className={isConnected ? 'bg-blue-500' : ''}
              >
                {isConnected ? '🔵 Conectado' : '⚪ Desconectado'}
              </Badge>
              {isEmergency && (
                <Badge variant="destructive" className="animate-pulse">
                  🚨 EMERGENCIA
                </Badge>
              )}
            </div>

            {!isSupported && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs text-yellow-700 dark:text-yellow-300">
                ⚠️ Web Bluetooth no está soportado en este navegador. Usa Chrome o Edge en escritorio.
              </div>
            )}

            {/* Botones de conexión */}
            <div className="flex gap-2">
              {!isConnected ? (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || !isSupported}
                  className="w-full"
                >
                  <Bluetooth className="h-4 w-4 mr-2" />
                  {isConnecting ? 'Buscando...' : 'Conectar Bluetooth'}
                </Button>
              ) : (
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="w-full"
                >
                  <BluetoothOff className="h-4 w-4 mr-2" />
                  Desconectar
                </Button>
              )}
            </div>

            {/* Controles de terapia (solo cuando conectado) */}
            {isConnected && (
              <div className="space-y-3 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Controles del ESP32</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleStart}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    START
                  </Button>
                  <Button
                    onClick={handleStop}
                    variant="secondary"
                    size="sm"
                  >
                    🛑 STOP
                  </Button>
                </div>
                <Button
                  onClick={handleEmergency}
                  variant="destructive"
                  className="w-full"
                  size="sm"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  EMERGENCIA
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default BLEConfig;
