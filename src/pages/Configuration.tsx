import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from '@/contexts/AppContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useGameConfig } from '@/contexts/GameConfigContext';
import ConfigAuth from '@/components/ConfigAuth';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Configuration = () => {
  const t = useTranslation();
  const { isAuthenticated, authenticate, patientName, therapistName, setPatientName, setTherapistName } = useConfig();
  const { orangeJuiceGoal, setOrangeJuiceGoal, enemySpeed, shotSpeed, setEnemySpeed, setShotSpeed, baseEnemyCount, setBaseEnemyCount } = useGameConfig();
  const [localOrangeGoal, setLocalOrangeGoal] = useState(orangeJuiceGoal.toString());
  const [localPatientName, setLocalPatientName] = useState(patientName);
  const [localTherapistName, setLocalTherapistName] = useState(therapistName);
  const [localEnemySpeed, setLocalEnemySpeed] = useState(enemySpeed);
  const [localShotSpeed, setLocalShotSpeed] = useState(shotSpeed);
  const [localBaseEnemyCount, setLocalBaseEnemyCount] = useState(baseEnemyCount);
  const [authError, setAuthError] = useState<string>('');
  const { user } = useAuth();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setLocalOrangeGoal(orangeJuiceGoal.toString());
  }, [orangeJuiceGoal]);

  useEffect(() => {
    setLocalPatientName(patientName);
  }, [patientName]);

  useEffect(() => {
    setLocalTherapistName(therapistName);
  }, [therapistName]);

  useEffect(() => {
    setLocalEnemySpeed(enemySpeed);
  }, [enemySpeed]);

  useEffect(() => {
    setLocalShotSpeed(shotSpeed);
  }, [shotSpeed]);

  useEffect(() => {
    setLocalBaseEnemyCount(baseEnemyCount);
  }, [baseEnemyCount]);

  useEffect(() => {
    const loadAvatar = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .single();
      if (data?.avatar_url) setAvatarPreview(data.avatar_url);
    };
    loadAvatar();
  }, [user]);

  const handleAuthenticate = (password: string) => {
    const success = authenticate(password);
    if (!success) {
      setAuthError('Clave incorrecta. Inténtalo de nuevo.');
    } else {
      setAuthError('');
    }
  };

  if (!isAuthenticated) {
    return <ConfigAuth onAuthenticate={handleAuthenticate} error={authError} />;
  }

  const handleSaveProfile = () => {
    setPatientName(localPatientName);
    setTherapistName(localTherapistName);
  };

  const handleUploadAvatar = async () => {
    if (!user || !avatarFile) return;
    try {
      setUploading(true);
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);
      setAvatarPreview(publicUrl);
      setAvatarFile(null);
    } catch (e) {
      console.error('Error uploading avatar:', e);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveGameConfig = () => {
    const goal = parseInt(localOrangeGoal);
    if (!isNaN(goal) && goal > 0) {
      setOrangeJuiceGoal(goal);
    }
  };

  const handleSaveNeuroLinkConfig = () => {
    setEnemySpeed(localEnemySpeed);
    setShotSpeed(localShotSpeed);
    setBaseEnemyCount(localBaseEnemyCount);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t.configuration}</h1>
        <p className="text-muted-foreground">Configuración del sistema y pacientes</p>
      </div>

      {/* Configuración de Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">👤 Configuración de Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarPreview || undefined} alt={localPatientName} />
              <AvatarFallback>{(localPatientName || 'P')[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setAvatarFile(f);
                if (f) setAvatarPreview(URL.createObjectURL(f));
              }} />
              <Button onClick={handleUploadAvatar} disabled={!avatarFile || uploading}>
                {uploading ? 'Subiendo...' : 'Subir foto'}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Label htmlFor="patient-name">Nombre del Paciente</Label>
            <Input
              id="patient-name"
              type="text"
              value={localPatientName}
              onChange={(e) => setLocalPatientName(e.target.value)}
              placeholder="Nombre del paciente"
            />
          </div>
          <div className="space-y-4">
            <Label htmlFor="therapist-name">Nombre del Terapeuta</Label>
            <Input
              id="therapist-name"
              type="text"
              value={localTherapistName}
              onChange={(e) => setLocalTherapistName(e.target.value)}
              placeholder="Nombre del terapeuta"
            />
          </div>
          <Button onClick={handleSaveProfile}>
            Guardar Perfil
          </Button>
        </CardContent>
      </Card>

      {/* Configuración de Juegos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">🎮 Configuración de Juegos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🍊 Juego de Exprimiendo Naranjas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orange-goal">Vasos de jugo objetivo (15 min)</Label>
                <Input
                  id="orange-goal"
                  type="number"
                  min="1"
                  max="20"
                  value={localOrangeGoal}
                  onChange={(e) => setLocalOrangeGoal(e.target.value)}
                  placeholder="Número de vasos"
                />
                <p className="text-xs text-muted-foreground">
                  Este valor se ajusta automáticamente según la duración seleccionada
                </p>
              </div>
              <div className="space-y-2">
                <Label>Ejemplos para diferentes tiempos:</Label>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <div>• 5 min: ~1 vaso</div>
                  <div>• 15 min: {orangeJuiceGoal} vasos</div>
                  <div>• 30 min: ~{Math.round(30 * orangeJuiceGoal / 15)} vasos</div>
                  <div>• 60 min: ~{Math.round(60 * orangeJuiceGoal / 15)} vasos</div>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Reglas del juego:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 4 naranjas exprimidas = 1 vaso de jugo</li>
                <li>• Se completa una naranja cuando A4 + A5 + A6 supera 230°</li>
                <li>• Solo cuenta cuando la mano parética está activa</li>
                <li>• Se debe bajar a menos de 80% para poder exprimir otra naranja</li>
              </ul>
            </div>
            <Button onClick={handleSaveGameConfig}>
              Guardar Configuración de Juegos
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🎯 NeuroLink</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="enemy-speed">Velocidad de Enemigos: {localEnemySpeed}/5</Label>
                <Slider
                  id="enemy-speed"
                  min={1}
                  max={5}
                  step={1}
                  value={[localEnemySpeed]}
                  onValueChange={(value) => setLocalEnemySpeed(value[0])}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  Controla qué tan rápido se mueven las frutas espaciales
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shot-speed">Velocidad de Disparo: {localShotSpeed}/5</Label>
                <Slider
                  id="shot-speed"
                  min={1}
                  max={5}
                  step={1}
                  value={[localShotSpeed]}
                  onValueChange={(value) => setLocalShotSpeed(value[0])}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  Controla qué tan rápido disparas proyectiles
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="base-enemy-count">Enemigos Base en Ronda 1: {localBaseEnemyCount}</Label>
                <Slider
                  id="base-enemy-count"
                  min={3}
                  max={12}
                  step={1}
                  value={[localBaseEnemyCount]}
                  onValueChange={(value) => setLocalBaseEnemyCount(value[0])}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  Número inicial de enemigos. Cada ronda multiplica por 1.5x
                </div>
              </div>
              
                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                <strong>Instrucciones:</strong> Tu mano se mueve automáticamente en 3 ángulos. Los disparos son automáticos. ¡Completa 3 oleadas principales y sigue con rondas extra infinitas!
              </div>
            </div>
            <Button onClick={handleSaveNeuroLinkConfig}>
              Guardar Configuración NeuroLink
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuration;
