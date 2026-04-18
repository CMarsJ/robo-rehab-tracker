import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/contexts/AppContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useGameConfig } from '@/contexts/GameConfigContext';
import ConfigAuth from '@/components/ConfigAuth';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

const Configuration = () => {
  const t = useTranslation();
  const { isAuthenticated, authenticate, patientName, therapistName, dailyGoal, setPatientName, setTherapistName, setDailyGoal } = useConfig();
  const { orangeJuiceGoal, setOrangeJuiceGoal, enemySpeed, shotSpeed, setEnemySpeed, setShotSpeed, baseEnemyCount, setBaseEnemyCount, restRepetitions, setRestRepetitions, restLevels, setRestLevels, restDuration, setRestDuration, gameHand, setGameHand, orangeMaxAngle, setOrangeMaxAngle, flappyMaxAngle, setFlappyMaxAngle, neuroLinkMaxAngle, setNeuroLinkMaxAngle, flappyPipeInterval, setFlappyPipeInterval } = useGameConfig();
  const [localOrangeGoal, setLocalOrangeGoal] = useState(orangeJuiceGoal.toString());
  const [localPatientName, setLocalPatientName] = useState(patientName);
  const [localTherapistName, setLocalTherapistName] = useState(therapistName);
  const [localDailyGoal, setLocalDailyGoal] = useState(dailyGoal);
  const [localEnemySpeed, setLocalEnemySpeed] = useState(enemySpeed);
  const [localShotSpeed, setLocalShotSpeed] = useState(shotSpeed);
  const [localBaseEnemyCount, setLocalBaseEnemyCount] = useState(baseEnemyCount);
  const [localRestRepetitions, setLocalRestRepetitions] = useState(restRepetitions);
  const [localRestLevels, setLocalRestLevels] = useState(restLevels);
  const [localRestDuration, setLocalRestDuration] = useState(restDuration);
  const [localOrangeMaxAngle, setLocalOrangeMaxAngle] = useState(orangeMaxAngle);
  const [localFlappyMaxAngle, setLocalFlappyMaxAngle] = useState(flappyMaxAngle);
  const [localNeuroLinkMaxAngle, setLocalNeuroLinkMaxAngle] = useState(neuroLinkMaxAngle);
  const [localFlappyPipeInterval, setLocalFlappyPipeInterval] = useState(flappyPipeInterval);
  const [authError, setAuthError] = useState<string>('');
  const { user } = useAuth();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

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
    setLocalRestRepetitions(restRepetitions);
  }, [restRepetitions]);

  useEffect(() => {
    setLocalRestLevels(restLevels);
  }, [restLevels]);

  useEffect(() => {
    setLocalRestDuration(restDuration);
  }, [restDuration]);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, display_name, therapist_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        const profile = data as any;
        if (profile.avatar_url) setAvatarPreview(profile.avatar_url);
        if (profile.display_name) setLocalPatientName(profile.display_name);
        if (profile.therapist_name) setLocalTherapistName(profile.therapist_name);
      }
    };
    loadProfileData();
  }, [user]);

  useEffect(() => {
    const loadGameSettings = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('game_settings')
        .select('enemy_speed, player_shot_speed, numero_base_enemigos, configuracion_inicio')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        const settings = data as any;
        if (settings.enemy_speed) setLocalEnemySpeed(settings.enemy_speed);
        if (settings.player_shot_speed) setLocalShotSpeed(settings.player_shot_speed);
        if (settings.numero_base_enemigos) setLocalBaseEnemyCount(settings.numero_base_enemigos);
        if (settings.configuracion_inicio?.orange_juice_goal) {
          setLocalOrangeGoal(settings.configuracion_inicio.orange_juice_goal.toString());
        }
        if (settings.configuracion_inicio?.rest_repetitions) {
          setLocalRestRepetitions(settings.configuracion_inicio.rest_repetitions);
        }
        if (settings.configuracion_inicio?.rest_levels) {
          setLocalRestLevels(settings.configuracion_inicio.rest_levels);
        }
        if (settings.configuracion_inicio?.rest_duration) {
          setLocalRestDuration(settings.configuracion_inicio.rest_duration);
        }
      }
    };
    loadGameSettings();
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

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: localPatientName,
          therapist_name: localTherapistName
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setPatientName(localPatientName);
      setTherapistName(localTherapistName);
      
      toast({
        title: '✅ Perfil guardado',
        description: 'Los datos del perfil se guardaron correctamente',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudo guardar el perfil',
        variant: 'destructive',
      });
    }
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
      const publicUrl = (publicUrlData as any).publicUrl;

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl } as any)
        .eq('user_id', user.id);
      setAvatarPreview(publicUrl);
      setAvatarFile(null);
      
      toast({
        title: '✅ Foto actualizada',
        description: 'Tu foto de perfil se actualizó correctamente',
      });
    } catch (e) {
      console.error('Error uploading avatar:', e);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveGameConfig = async () => {
    if (!user) return;
    
    const goal = parseInt(localOrangeGoal);
    if (isNaN(goal) || goal <= 0) {
      toast({
        title: '❌ Error',
        description: 'Por favor ingresa un valor válido para el objetivo',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Verificar si existe una configuración para el usuario
      const { data: existing } = await supabase
        .from('game_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Actualizar configuración existente
        const { error } = await supabase
          .from('game_settings')
          .update({
            configuracion_inicio: { orange_juice_goal: goal }
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Crear nueva configuración
        const { error } = await supabase
          .from('game_settings')
          .insert({
            user_id: user.id,
            configuracion_inicio: { orange_juice_goal: goal }
          });

        if (error) throw error;
      }

      setOrangeJuiceGoal(goal);
      
      toast({
        title: '✅ Configuración guardada',
        description: 'La configuración del juego se guardó correctamente',
      });
    } catch (error) {
      console.error('Error saving game config:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    }
  };

  const handleSaveNeuroLinkConfig = async () => {
    if (!user) return;

    try {
      // Verificar si existe una configuración para el usuario
      const { data: existing } = await supabase
        .from('game_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Actualizar configuración existente
        const { error } = await supabase
          .from('game_settings')
          .update({
            enemy_speed: localEnemySpeed,
            player_shot_speed: localShotSpeed,
            numero_base_enemigos: localBaseEnemyCount
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Crear nueva configuración
        const { error } = await supabase
          .from('game_settings')
          .insert({
            user_id: user.id,
            enemy_speed: localEnemySpeed,
            player_shot_speed: localShotSpeed,
            numero_base_enemigos: localBaseEnemyCount
          });

        if (error) throw error;
      }

      setEnemySpeed(localEnemySpeed);
      setShotSpeed(localShotSpeed);
      setBaseEnemyCount(localBaseEnemyCount);
      
      toast({
        title: '✅ Configuración guardada',
        description: 'La configuración de NeuroDefense se guardó correctamente',
      });
    } catch (error) {
      console.error('Error saving NeuroDefense config:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    }
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
          <Separator />
          <div className="space-y-4">
            <Label>🎯 Meta Diaria de Terapia (minutos)</Label>
            <Slider
              value={[localDailyGoal]}
              onValueChange={([v]) => setLocalDailyGoal(v)}
              min={5}
              max={60}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 min</span>
              <span className="font-semibold text-primary">{localDailyGoal} min</span>
              <span>60 min</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Este valor se muestra como meta diaria en la pantalla principal del paciente
            </p>
          </div>
          <Button onClick={() => { handleSaveProfile(); setDailyGoal(localDailyGoal); }}>
            Guardar Perfil
          </Button>
        </CardContent>
      </Card>

      {/* Selección de Mano para Juegos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">🤚 Selección de Mano</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mano a utilizar en los juegos (mcp_finger)</Label>
            <Select value={gameHand} onValueChange={(val) => setGameHand(val as 'left' | 'right')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="right">🦾 Mano Derecha</SelectItem>
                <SelectItem value="left">✋ Mano Izquierda</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Esta mano se usará como entrada en todos los modos de juego (Orange Squeeze, RehabBird, NeuroDefense)
            </p>
          </div>
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
            <div className="space-y-2">
              <Label>Ángulo máximo mcp_finger: {localOrangeMaxAngle}°</Label>
              <Slider
                min={30}
                max={180}
                step={5}
                value={[localOrangeMaxAngle]}
                onValueChange={(v) => setLocalOrangeMaxAngle(v[0])}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Ángulo máximo de flexión considerado para el 100% de fuerza (30°-180°)
              </p>
            </div>
            <Button onClick={() => {
              handleSaveGameConfig();
              setOrangeMaxAngle(localOrangeMaxAngle);
              localStorage.setItem('orangeMaxAngle', localOrangeMaxAngle.toString());
            }}>
              Guardar Configuración de Naranjas
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🎯 NeuroDefense</h3>
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
              
              <div className="space-y-2">
                <Label>Ángulo máximo mcp_finger: {localNeuroLinkMaxAngle}°</Label>
                <Slider
                  min={30}
                  max={180}
                  step={5}
                  value={[localNeuroLinkMaxAngle]}
                  onValueChange={(v) => setLocalNeuroLinkMaxAngle(v[0])}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  Ángulo máximo del dedo para el rango completo de movimiento del jugador (30°-180°)
                </div>
              </div>

              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <strong>Instrucciones:</strong> Tu mano se mueve automáticamente según el ángulo mcp_finger. Los disparos son automáticos. ¡Completa 3 oleadas principales y sigue con rondas extra infinitas!
              </div>
            </div>
            <Button onClick={() => {
              handleSaveNeuroLinkConfig();
              setNeuroLinkMaxAngle(localNeuroLinkMaxAngle);
              localStorage.setItem('neuroLinkMaxAngle', localNeuroLinkMaxAngle.toString());
            }}>
              Guardar Configuración NeuroDefense
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🐦 RehabBird</h3>
            <div className="space-y-2">
              <Label>Ángulo máximo mcp_finger: {localFlappyMaxAngle}°</Label>
              <Slider
                min={30}
                max={180}
                step={5}
                value={[localFlappyMaxAngle]}
                onValueChange={(v) => setLocalFlappyMaxAngle(v[0])}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                Ángulo máximo del dedo para el rango completo de altura del ave (30°-180°)
              </div>
            </div>
            <div className="space-y-2">
              <Label>Distancia entre obstáculos: {localFlappyPipeInterval}s</Label>
              <Slider
                min={2}
                max={15}
                step={1}
                value={[localFlappyPipeInterval]}
                onValueChange={(v) => setLocalFlappyPipeInterval(v[0])}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                Tiempo en segundos entre cada obstáculo (2s-15s)
              </div>
            </div>
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <strong>Instrucciones:</strong> Controla la altura del ave con el ángulo mcp_finger de tu mano. Evita los tubos para sumar puntos. Si chocas, pierdes un punto y el tubo se aleja para que puedas recuperarte.
            </div>
            <Button onClick={() => {
              setFlappyMaxAngle(localFlappyMaxAngle);
              setFlappyPipeInterval(localFlappyPipeInterval);
              localStorage.setItem('flappyMaxAngle', localFlappyMaxAngle.toString());
              localStorage.setItem('flappyPipeInterval', localFlappyPipeInterval.toString());
              toast({
                title: '✅ Configuración guardada',
                description: 'La configuración de RehabBird se guardó correctamente',
              });
            }}>
              Guardar Configuración RehabBird
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Configuración de Descanso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">⏸️ Configuración de Descanso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Repeticiones para descanso: {localRestRepetitions}</Label>
              <Slider
                min={1}
                max={50}
                step={1}
                value={[localRestRepetitions]}
                onValueChange={(v) => setLocalRestRepetitions(v[0])}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Número de ciclos abrir/cerrar antes de activar descanso automático
              </p>
            </div>

            <div className="space-y-2">
              <Label>Niveles (rondas de juego) para descanso: {localRestLevels}</Label>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[localRestLevels]}
                onValueChange={(v) => setLocalRestLevels(v[0])}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Número de rondas completadas en juegos antes de activar descanso
              </p>
            </div>

            <div className="space-y-2">
              <Label>Duración del descanso: {localRestDuration}s</Label>
              <Slider
                min={5}
                max={300}
                step={5}
                value={[localRestDuration]}
                onValueChange={(v) => setLocalRestDuration(v[0])}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Tiempo de descanso en segundos (5s - 300s)
              </p>
            </div>
          </div>

          <Button onClick={async () => {
            if (!user) return;
            try {
              const { data: existing } = await supabase
                .from('game_settings')
                .select('id, configuracion_inicio')
                .eq('user_id', user.id)
                .maybeSingle();

              const restConfig = {
                rest_repetitions: localRestRepetitions,
                rest_levels: localRestLevels,
                rest_duration: localRestDuration,
              };

              const currentConfig = (existing as any)?.configuracion_inicio || {};
              const updatedConfig = { ...currentConfig, ...restConfig };

              if (existing) {
                const { error } = await supabase
                  .from('game_settings')
                  .update({ configuracion_inicio: updatedConfig })
                  .eq('user_id', user.id);
                if (error) throw error;
              } else {
                const { error } = await supabase
                  .from('game_settings')
                  .insert({ user_id: user.id, configuracion_inicio: updatedConfig });
                if (error) throw error;
              }

              setRestRepetitions(localRestRepetitions);
              setRestLevels(localRestLevels);
              setRestDuration(localRestDuration);

              toast({
                title: '✅ Configuración de descanso guardada',
                description: 'Los parámetros de descanso se guardaron correctamente',
              });
            } catch (error) {
              console.error('Error saving rest config:', error);
              toast({
                title: '❌ Error',
                description: 'No se pudo guardar la configuración de descanso',
                variant: 'destructive',
              });
            }
          }}>
            Guardar Configuración de Descanso
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuration;
