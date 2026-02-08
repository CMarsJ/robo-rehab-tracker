
import React, { useState, useRef } from 'react';
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
import { HelpCircle, Settings, ToggleLeft, ToggleRight, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useSimulation } from '@/contexts/SimulationContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from '@/contexts/AppContext';

const DataSimulator = () => {
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { 
    leftHand, 
    rightHand, 
    updateSimulationData, 
    autoMode, 
    setAutoMode,
    mqttStatus,
    mqttMessage,
    isReceivingRealData,
    enableSimulator,
    setEnableSimulator
  } = useSimulation();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [leftHandActive, setLeftHandActive] = useState(leftHand.active);
  const [rightHandActive, setRightHandActive] = useState(rightHand.active);
  
  // Estados locales para los ángulos
  const [leftAngles, setLeftAngles] = useState({
    thumb1: [leftHand.angles.thumb1],
    thumb2: [leftHand.angles.thumb2],
    thumb3: [leftHand.angles.thumb3],
    finger1: [leftHand.angles.finger1],
    finger2: [leftHand.angles.finger2],
    finger3: [leftHand.angles.finger3]
  });

  const [rightAngles, setRightAngles] = useState({
    thumb1: [rightHand.angles.thumb1],
    thumb2: [rightHand.angles.thumb2],
    thumb3: [rightHand.angles.thumb3],
    finger1: [rightHand.angles.finger1],
    finger2: [rightHand.angles.finger2],
    finger3: [rightHand.angles.finger3]
  });

  const [leftEffort, setLeftEffort] = useState([leftHand.effort]);
  const [rightEffort, setRightEffort] = useState([rightHand.effort]);

  const simulateData = () => {
    // Mantener posición de scroll antes de enviar datos
    const currentScrollTop = scrollRef.current?.scrollTop || 0;
    
    const newLeftHand = {
      active: leftHandActive,
      angles: {
        thumb1: leftAngles.thumb1[0],
        thumb2: leftAngles.thumb2[0],
        thumb3: leftAngles.thumb3[0],
        finger1: leftAngles.finger1[0],
        finger2: leftAngles.finger2[0],
        finger3: leftAngles.finger3[0]
      },
      effort: leftEffort[0]
    };

    const newRightHand = {
      active: rightHandActive,
      angles: {
        thumb1: rightAngles.thumb1[0],
        thumb2: rightAngles.thumb2[0],
        thumb3: rightAngles.thumb3[0],
        finger1: rightAngles.finger1[0],
        finger2: rightAngles.finger2[0],
        finger3: rightAngles.finger3[0]
      },
      effort: rightEffort[0]
    };

    updateSimulationData(newLeftHand, newRightHand);
    
    console.log('Datos simulados enviados:', {
      leftHand: newLeftHand,
      rightHand: newRightHand
    });
    
    // Restaurar posición de scroll después de un breve delay
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = currentScrollTop;
      }
    }, 0);
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
          className="w-96 max-h-96" 
          align="end" 
          side="top"
        >
          <div ref={scrollRef} className="overflow-y-auto max-h-96">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t.dataSimulator}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Estado BLE */}
                <div className="space-y-2">
                  {isReceivingRealData && (
                    <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                      <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-xs text-green-700 dark:text-green-300">
                        ✅ {t.receivingRealData}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {mqttStatus === 'connected' && !isReceivingRealData && (
                    <Alert className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <AlertDescription className="text-xs text-yellow-700 dark:text-yellow-300">
                        ⚠️ {t.connectedNoData}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Habilitar simulador */}
                {!isReceivingRealData && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center space-x-3">
                      <div>
                        <Label className="text-sm font-medium text-orange-900 dark:text-orange-300">{t.enableSimulator}</Label>
                        <p className="text-xs text-orange-700 dark:text-orange-400">{t.useSimulatedData}</p>
                      </div>
                    </div>
                    <Switch
                      checked={enableSimulator}
                      onCheckedChange={setEnableSimulator}
                    />
                  </div>
                )}

                {/* Modo automático */}
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-border">
                  <div className="flex items-center space-x-3">
                    {autoMode ? (
                      <ToggleRight className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                    )}
                    <div>
                      <Label className="text-sm font-medium">{t.automaticMode}</Label>
                      <p className="text-xs text-muted-foreground">{t.randomDataEvery30s}</p>
                    </div>
                  </div>
                  <Switch
                    checked={autoMode}
                    onCheckedChange={setAutoMode}
                    disabled={!enableSimulator || isReceivingRealData}
                  />
                </div>

                {/* Estado de activación */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="left-hand"
                      checked={leftHandActive}
                      onCheckedChange={setLeftHandActive}
                      disabled={autoMode || !enableSimulator || isReceivingRealData}
                    />
                    <Label htmlFor="left-hand" className="text-xs">{t.leftHandActive}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="right-hand"
                      checked={rightHandActive}
                      onCheckedChange={setRightHandActive}
                      disabled={autoMode || !enableSimulator || isReceivingRealData}
                    />
                    <Label htmlFor="right-hand" className="text-xs">{t.rightHandActive}</Label>
                  </div>
                </div>

                {/* Ángulos mano izquierda */}
                <AngleSliders 
                  angles={leftAngles}
                  setAngles={setLeftAngles}
                  title={t.leftHandNonParetic}
                />

                {/* Ángulos mano derecha */}
                <AngleSliders 
                  angles={rightAngles}
                  setAngles={setRightAngles}
                  title={t.rightHandParetic}
                />

                {/* Esfuerzo muscular */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">{t.muscularEffort}</h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">{t.leftHand}: {leftEffort[0]}%</Label>
                      <Slider
                        value={leftEffort}
                        onValueChange={setLeftEffort}
                        max={100}
                        min={0}
                        step={5}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{t.rightHand}: {rightEffort[0]}%</Label>
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
                  disabled={autoMode || !enableSimulator || isReceivingRealData}
                >
                  {isReceivingRealData 
                    ? t.usingRealData
                    : autoMode 
                      ? t.automaticModeActive
                      : enableSimulator
                        ? t.sendSimulatedData
                        : t.simulatorDisabled
                  }
                </Button>
              </CardContent>
            </Card>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DataSimulator;
