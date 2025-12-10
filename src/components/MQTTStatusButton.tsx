import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mqttService } from '@/services/mqttService';
import { useToast } from '@/hooks/use-toast';
import { Settings } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const MQTTStatusButton: React.FC = () => {
  const { toast } = useToast();
  const [username, setUsername] = useState(localStorage.getItem('mqtt_username') || 'ESP32');
  const [password, setPassword] = useState(localStorage.getItem('mqtt_password') || 'Juanesteban1');
  const [topic, setTopic] = useState(localStorage.getItem('mqtt_topic') || 'esp32/data');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Update connection status
  useEffect(() => {
    const checkStatus = () => {
      setIsConnected(mqttService.isConnected());
    };

    // Check immediately
    checkStatus();

    // Set up status callback
    mqttService.onStatus((status) => {
      setIsConnected(status === 'connected');
      if (status === 'connected' && isConnecting) {
        setIsConnecting(false);
      }
    });

    // Check periodically
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [isConnecting]);

  const handleConnect = () => {
    if (!username || !password) {
      toast({
        title: 'Credenciales requeridas',
        description: 'Por favor ingrese usuario y contraseña',
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);

    // Save credentials
    localStorage.setItem('mqtt_username', username);
    localStorage.setItem('mqtt_password', password);
    localStorage.setItem('mqtt_topic', topic);

    // Connect
    mqttService.connect(username, password, topic);

    // Verify connection after 3 seconds
    setTimeout(() => {
      setIsConnecting(false);
      if (mqttService.isConnected()) {
        toast({
          title: '✅ Conectado',
          description: 'Conexión exitosa a HiveMQ Cloud',
        });
        setIsOpen(false);
      } else {
        toast({
          title: '❌ Error de conexión',
          description: 'No se pudo conectar al broker MQTT',
          variant: 'destructive',
        });
      }
    }, 3000);
  };

  const handleDisconnect = () => {
    mqttService.disconnect();
    toast({
      title: 'Desconectado',
      description: 'Conexión MQTT cerrada',
    });
  };

  const getStatusEmoji = () => {
    if (isConnecting) return '📡';
    if (isConnected) return '📶';
    return '📵';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-9 px-0 transition-all"
        >
          <span className="text-base">{getStatusEmoji()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-popover dark:bg-gray-800" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b dark:border-gray-700">
            <Settings className="h-4 w-4" />
            <h4 className="font-medium text-sm">Configuración MQTT</h4>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">HiveMQ Cloud</p>
            <p className="text-[10px] break-all">7e8350d563654f49b9e95c47ac4bbb21.s1.eu.hivemq.cloud:8884</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Usuario MQTT"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isConnected}
                className="h-8 text-xs"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Contraseña MQTT"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isConnected}
                className="h-8 text-xs"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="topic" className="text-xs">Tópico</Label>
              <Input
                id="topic"
                type="text"
                placeholder="esp32/data"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isConnected}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {!isConnected ? (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full h-8 text-xs"
                size="sm"
              >
                {isConnecting ? '🟡 Conectando...' : 'Conectar'}
              </Button>
            ) : (
              <Button
                onClick={handleDisconnect}
                variant="destructive"
                className="w-full h-8 text-xs"
                size="sm"
              >
                Desconectar
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MQTTStatusButton;
