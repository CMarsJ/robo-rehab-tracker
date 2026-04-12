import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mqttService } from '@/services/mqttService';
import { useToast } from '@/hooks/use-toast';
import { Wifi, WifiOff, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface MQTTConfigProps {
  onConnectionChange?: (connected: boolean) => void;
}

const MQTTConfig: React.FC<MQTTConfigProps> = ({ onConnectionChange }) => {
  const { toast } = useToast();
  const [username, setUsername] = useState(localStorage.getItem('mqtt_username') || 'Monitoreo');
  const [password, setPassword] = useState(localStorage.getItem('mqtt_password') || 'Nosemeolvida1');
  const [topic, setTopic] = useState(localStorage.getItem('mqtt_topic') || 'esp32/data');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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

    // Guardar credenciales
    localStorage.setItem('mqtt_username', username);
    localStorage.setItem('mqtt_password', password);
    localStorage.setItem('mqtt_topic', topic);

    // Conectar
    mqttService.connect(username, password, topic);

    // Verificar conexión después de 3 segundos
    setTimeout(() => {
      setIsConnecting(false);
      if (mqttService.isConnected()) {
        toast({
          title: '✅ Conectado',
          description: 'Conexión exitosa a HiveMQ Cloud',
        });
        onConnectionChange?.(true);
        setIsOpen(false);
      } else {
        toast({
          title: '❌ Error de conexión',
          description: 'No se pudo conectar al broker MQTT',
          variant: 'destructive',
        });
        onConnectionChange?.(false);
      }
    }, 3000);
  };

  const handleDisconnect = () => {
    mqttService.disconnect();
    toast({
      title: 'Desconectado',
      description: 'Conexión MQTT cerrada',
    });
    onConnectionChange?.(false);
  };

  const isConnected = mqttService.isConnected();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              Conectado
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-gray-400" />
              Configurar MQTT
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración MQTT
          </DialogTitle>
          <DialogDescription>
            Conecta a HiveMQ Cloud para recibir datos reales
          </DialogDescription>
        </DialogHeader>
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-sm">HiveMQ Cloud</CardTitle>
            <CardDescription className="text-xs">
              7e8350d563654f49b9e95c47ac4bbb21.s1.eu.hivemq.cloud:8884
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-0">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Usuario MQTT"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isConnected}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Contraseña MQTT"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isConnected}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Tópico</Label>
              <Input
                id="topic"
                type="text"
                placeholder="sensor/data"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isConnected}
              />
            </div>
            <div className="flex gap-2">
              {!isConnected ? (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? 'Conectando...' : 'Conectar'}
                </Button>
              ) : (
                <Button
                  onClick={handleDisconnect}
                  variant="destructive"
                  className="w-full"
                >
                  Desconectar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default MQTTConfig;
