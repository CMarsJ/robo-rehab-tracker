import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/contexts/AppContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useGameConfig } from '@/contexts/GameConfigContext';
import ConfigAuth from '@/components/ConfigAuth';

const Configuration = () => {
  const t = useTranslation();
  const { isAuthenticated, authenticate, patientName, therapistName, setPatientName, setTherapistName } = useConfig();
  const { orangeJuiceGoal, setOrangeJuiceGoal } = useGameConfig();
  const [localOrangeGoal, setLocalOrangeGoal] = useState(orangeJuiceGoal.toString());
  const [localPatientName, setLocalPatientName] = useState(patientName);
  const [localTherapistName, setLocalTherapistName] = useState(therapistName);
  const [authError, setAuthError] = useState<string>('');

  useEffect(() => {
    setLocalOrangeGoal(orangeJuiceGoal.toString());
  }, [orangeJuiceGoal]);

  useEffect(() => {
    setLocalPatientName(patientName);
  }, [patientName]);

  useEffect(() => {
    setLocalTherapistName(therapistName);
  }, [therapistName]);

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

  const handleSaveGameConfig = () => {
    const goal = parseInt(localOrangeGoal);
    if (!isNaN(goal) && goal > 0) {
      setOrangeJuiceGoal(goal);
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
            <h3 className="text-lg font-semibold">🐸 Defensa de la Rana</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-600">Próximamente...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuration;
