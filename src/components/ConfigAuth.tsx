
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';

interface ConfigAuthProps {
  onAuthenticate: (password: string) => void;
  error?: string;
}

const ConfigAuth: React.FC<ConfigAuthProps> = ({ onAuthenticate, error }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuthenticate(password);
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Lock className="w-12 h-12 mx-auto mb-4 text-primary" />
          <CardTitle>Acceso Restringido</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ingrese la clave para acceder a la configuración del sistema
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Clave de Acceso</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese la clave"
                className="mt-1"
              />
              {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Acceder
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigAuth;
