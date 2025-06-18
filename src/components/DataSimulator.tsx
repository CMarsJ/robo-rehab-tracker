
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { HelpCircle, Settings } from 'lucide-react';

const DataSimulator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [leftHandActive, setLeftHandActive] = useState(false);
  const [rightHandActive, setRightHandActive] = useState(false);
  
  // Ángulos para mano izquierda (no parética)
  const [leftAngles, setLeftAngles] = useState({
    thumb1: [45],
    thumb2: [30],
    thumb3: [25],
    finger1: [60],
    finger2: [55],
    finger3: [50]
  });

  // Ángulos para mano derecha (parética)
  const [rightAngles, setRightAngles] = useState({
    thumb1: [35],
    thumb2: [25],
    thumb3: [20],
    finger1: [40],
    finger2: [35],
    finger3: [30]
  });

  const [leftEffort, setLeftEffort] = useState([75]);
  const [rightEffort, setRightEffort] = useState([45]);

  const simulateData = () => {
    // Aquí se simularía el envío de datos
    console.log('Datos simulados enviados:', {
      leftHand: {
        active: leftHandActive,
        angles: leftAngles,
        effort: leftEffort[0]
      },
      rightHand: {
        active: rightHandActive,
        angles: rightAngles,
        effort: rightEffort[0]
      }
    });
    
    // Cerrar el popover después de enviar
    setIsOpen(false);
  };

  const AngleSliders = ({ 
    angles, 
    setAngles, 
    title 
  }: { 
    angles: any; 
    setAngles: any; 
    title: string; 
  }) => (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">{title}</h4>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Pulgar A1: {angles.thumb1[0]}°</Label>
            <Slider
              value={angles.thumb1}
              onValueChange={(value) => setAngles({...angles, thumb1: value})}
              max={90}
              min={0}
              step={5}
            />
          </div>
          <div>
            <Label className="text-xs">Pulgar A2: {angles.thumb2[0]}°</Label>
            <Slider
              value={angles.thumb2}
              onValueChange={(value) => setAngles({...angles, thumb2: value})}
              max={90}
              min={0}
              step={5}
            />
          </div>
          <div>
            <Label className="text-xs">Pulgar A3: {angles.thumb3[0]}°</Label>
            <Slider
              value={angles.thumb3}
              onValueChange={(value) => setAngles({...angles, thumb3: value})}
              max={90}
              min={0}
              step={5}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Dedo A4: {angles.finger1[0]}°</Label>
            <Slider
              value={angles.finger1}
              onValueChange={(value) => setAngles({...angles, finger1: value})}
              max={90}
              min={0}
              step={5}
            />
          </div>
          <div>
            <Label className="text-xs">Dedo A5: {angles.finger2[0]}°</Label>
            <Slider
              value={angles.finger2}
              onValueChange={(value) => setAngles({...angles, finger2: value})}
              max={90}
              min={0}
              step={5}
            />
          </div>
          <div>
            <Label className="text-xs">Dedo A6: {angles.finger3[0]}°</Label>
            <Slider
              value={angles.finger3}
              onValueChange={(value) => setAngles({...angles, finger3: value})}
              max={90}
              min={0}
              step={5}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="rounded-full bg-primary hover:bg-primary/90 shadow-lg"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-96 max-h-96 overflow-y-auto" 
          align="end" 
          side="top"
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Simulador de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Estado de activación */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="left-hand"
                    checked={leftHandActive}
                    onCheckedChange={setLeftHandActive}
                  />
                  <Label htmlFor="left-hand" className="text-xs">Mano Izq. Activa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="right-hand"
                    checked={rightHandActive}
                    onCheckedChange={setRightHandActive}
                  />
                  <Label htmlFor="right-hand" className="text-xs">Mano Der. Activa</Label>
                </div>
              </div>

              {/* Ángulos mano izquierda */}
              <AngleSliders 
                angles={leftAngles}
                setAngles={setLeftAngles}
                title="Mano Izquierda (No Parética)"
              />

              {/* Ángulos mano derecha */}
              <AngleSliders 
                angles={rightAngles}
                setAngles={setRightAngles}
                title="Mano Derecha (Parética)"
              />

              {/* Esfuerzo muscular */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Esfuerzo Muscular</h4>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Mano Izquierda: {leftEffort[0]}%</Label>
                    <Slider
                      value={leftEffort}
                      onValueChange={setLeftEffort}
                      max={100}
                      min={0}
                      step={5}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Mano Derecha: {rightEffort[0]}%</Label>
                    <Slider
                      value={rightEffort}
                      onValueChange={setRightEffort}
                      max={100}
                      min={0}
                      step={5}
                    />
                  </div>
                </div>
              </div>

              {/* Botón de simulación */}
              <Button 
                onClick={simulateData}
                className="w-full"
              >
                Enviar Datos Simulados
              </Button>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DataSimulator;
