import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { bleService, BLEService } from '@/services/bleService';
import { useToast } from '@/hooks/use-toast';
import { Bluetooth, BluetoothOff, AlertTriangle, Zap } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

const BLEStatusButton: React.FC = () => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSupported] = useState(BLEService.isSupported());

  useEffect(() => {
    bleService.onStatus((status) => {
      setIsConnected(status === 'connected');
      if (status === 'connected' && isConnecting) {
        setIsConnecting(false);
      }
    });

    bleService.onEmergency((emergency) => {
      setIsEmergency(emergency);
    });

    const interval = setInterval(() => {
      setIsConnected(bleService.isConnected());
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnecting]);

  const handleConnect = async () => {
    if (!isSupported) {
      toast({
        title: 'No soportado',
        description: 'Web Bluetooth no disponible. Usa Chrome o Edge.',
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);
    try {
      await bleService.connect();
      toast({ title: '✅ Conectado', description: `Conectado a ${bleService.getDeviceName() || 'ESP32'}` });
      setIsOpen(false);
    } catch (error: any) {
      if (error.name !== 'NotFoundError') {
        toast({ title: '❌ Error', description: error.message, variant: 'destructive' });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    bleService.disconnect();
    toast({ title: 'Desconectado', description: 'Bluetooth desconectado' });
  };

  const handleEmergency = async () => {
    await bleService.sendEmergency();
    toast({ title: '🚨 Emergencia', description: 'Comando enviado', variant: 'destructive' });
  };

  const getStatusEmoji = () => {
    if (isEmergency) return '🚨';
    if (isConnecting) return '🔄';
    if (isConnected) return '🔵';
    return '⚪';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`w-9 px-0 transition-all ${isEmergency ? 'animate-pulse' : ''}`}
        >
          <span className="text-base">{getStatusEmoji()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-popover dark:bg-gray-800" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b dark:border-gray-700">
            <Bluetooth className="h-4 w-4" />
            <h4 className="font-medium text-sm">Bluetooth (BLE)</h4>
            {isEmergency && (
              <Badge variant="destructive" className="text-[10px] animate-pulse">
                EMERGENCIA
              </Badge>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            <p className="font-medium">ESP32_IMU_BLE</p>
            <p className="text-[10px]">
              {isConnected
                ? `✅ Conectado a ${bleService.getDeviceName() || 'ESP32'}`
                : '⚪ No conectado'}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {!isConnected ? (
              <Button
                onClick={handleConnect}
                disabled={isConnecting || !isSupported}
                className="w-full h-8 text-xs"
                size="sm"
              >
                {isConnecting ? '🔄 Buscando...' : '🔵 Conectar'}
              </Button>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    onClick={() => bleService.startTherapy()}
                    className="h-7 text-[10px] bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Zap className="h-3 w-3 mr-1" /> START
                  </Button>
                  <Button
                    onClick={() => bleService.stopTherapy()}
                    variant="secondary"
                    className="h-7 text-[10px]"
                    size="sm"
                  >
                    🛑 STOP
                  </Button>
                </div>
                <Button
                  onClick={handleEmergency}
                  variant="destructive"
                  className="w-full h-7 text-[10px]"
                  size="sm"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" /> EMERGENCIA
                </Button>
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="w-full h-7 text-[10px]"
                  size="sm"
                >
                  Desconectar
                </Button>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default BLEStatusButton;
