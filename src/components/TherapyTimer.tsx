import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { useApp, useTranslation } from '@/contexts/AppContext';
import { useSimulation } from '@/contexts/SimulationContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { SessionService } from '@/services/sessionService';
import { EffortDataPoint } from '@/types/database';
import TherapyOverlay from '@/components/TherapyOverlay';
import { bleService } from '@/services/bleService';
import lateralImg from '@/assets/lateraltemporizadorr.png';

const roundTo4Decimals = (value: number): number => {
  return Math.round(value * 10000) / 10000;
};

interface TherapyTimerProps {
  onSessionComplete?: () => void;
}

const TherapyTimer: React.FC<TherapyTimerProps> = ({ onSessionComplete }) => {
  const [duration, setDuration] = useState([15]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [sampleCounter, setSampleCounter] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [sessionEffortData, setSessionEffortData] = useState<EffortDataPoint[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const { addNotification } = useApp();
  const { setIsTherapyActive, leftHand, rightHand, addEffortData, clearEffortHistory, clearBleDataLog, isEmergency } = useSimulation();
  const { patientName, dailyGoal } = useConfig();
  const { user } = useAuth();
  const t = useTranslation();

  const svgRef = useRef<SVGSVGElement>(null);

  // Circular slider constants
  const CENTER = 100;
  const RADIUS = 80;
  const STROKE_WIDTH = 12;
  const MIN_MINUTES = 5;
  const MAX_MINUTES = 60;
  const STEP = 5;

  const minutesToAngle = (mins: number): number => {
    return ((mins - MIN_MINUTES) / (MAX_MINUTES - MIN_MINUTES)) * 360;
  };

  const angleToMinutes = (angle: number): number => {
    const raw = (angle / 360) * (MAX_MINUTES - MIN_MINUTES) + MIN_MINUTES;
    return Math.round(raw / STEP) * STEP;
  };

  const polarToCartesian = (angleDeg: number): { x: number; y: number } => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: CENTER + RADIUS * Math.cos(angleRad),
      y: CENTER + RADIUS * Math.sin(angleRad),
    };
  };

  const describeArc = (startAngle: number, endAngle: number): string => {
    const start = polarToCartesian(endAngle);
    const end = polarToCartesian(startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const getAngleFromEvent = useCallback((e: MouseEvent | TouchEvent) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;
    let angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    return angle;
  }, []);

  const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || isActive) return;
    e.preventDefault();
    const angle = getAngleFromEvent(e);
    if (angle === null) return;
    const mins = Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, angleToMinutes(angle)));
    setDuration([mins]);
  }, [isDragging, isActive, getAngleFromEvent]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isActive) return;
    const angle = getAngleFromEvent(e.nativeEvent);
    if (angle === null) return;
    const mins = Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, angleToMinutes(angle)));
    setDuration([mins]);
  };

  // === All original logic below, untouched ===

  const prevEmergencyRef = React.useRef(false);
  useEffect(() => {
    if (isEmergency && !prevEmergencyRef.current && isActive && !isPaused) {
      handlePause();
      bleService.stopTherapy();
      addNotification({ title: '🚨 Emergencia', message: 'Terapia pausada por emergencia BLE', type: 'warning' });
    } else if (!isEmergency && prevEmergencyRef.current && isActive && isPaused) {
      handlePause();
      bleService.startTherapy();
      addNotification({ title: '✅ Emergencia resuelta', message: 'Terapia reanudada', type: 'success' });
    }
    prevEmergencyRef.current = isEmergency;
  }, [isEmergency, isActive, isPaused]);

  const playVictorySound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playNote = (frequency: number, startTime: number, dur: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, startTime + dur);
      oscillator.start(startTime);
      oscillator.stop(startTime + dur);
    };
    const now = audioContext.currentTime;
    playNote(261.63, now, 0.3);
    playNote(329.63, now + 0.3, 0.3);
    playNote(392.00, now + 0.6, 0.3);
    playNote(523.25, now + 0.9, 0.5);
  };

  const leftHandRef = React.useRef(leftHand);
  const rightHandRef = React.useRef(rightHand);
  useEffect(() => { leftHandRef.current = leftHand; rightHandRef.current = rightHand; }, [leftHand, rightHand]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && !isPaused && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsedTime = now - startTime - totalPausedTime;
        const elapsedSeconds = Math.floor(elapsedTime / 1000);
        const newTimeLeft = Math.max(0, duration[0] * 60 - elapsedSeconds);
        setTimeLeft(newTimeLeft);
        if (newTimeLeft <= 0) {
          setIsActive(false);
          setIsPaused(false);
          setTimeout(() => setShowOverlay(false), 500);
          setSampleCounter(0);
          setStartTime(null);
          setPauseStartTime(null);
          setTotalPausedTime(0);
          bleService.stopTherapy();
          playVictorySound();
          setTimeout(() => {
            setIsTherapyActive(false);
            if (currentSessionId && user) finishSession();
            addNotification({ title: `¡Felicidades ${patientName}!`, message: t.sessionCompleted, type: 'success' });
            if ((window as any).refreshAchievements) (window as any).refreshAchievements();
            if (onSessionComplete) onSessionComplete();
          }, 0);
        }
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, isPaused, startTime, totalPausedTime, duration, currentSessionId, user]);

  useEffect(() => {
    let sampleInterval: ReturnType<typeof setInterval> | null = null;
    if (isActive && !isPaused) {
      sampleInterval = setInterval(() => {
        setSampleCounter(prev => {
          const newCounter = prev + 1;
          const left = leftHandRef.current;
          const right = rightHandRef.current;
          if (newCounter >= 60 && (left.active || right.active)) {
            const effortPoint: EffortDataPoint = { timestamp: Date.now(), value: roundTo4Decimals(right.effort), hand: 'right' };
            setSessionEffortData(prevData => [...prevData, effortPoint]);
            addEffortData(roundTo4Decimals(right.effort), roundTo4Decimals(left.effort));
            return 0;
          }
          return newCounter;
        });
      }, 100);
    }
    return () => { if (sampleInterval) clearInterval(sampleInterval); };
  }, [isActive, isPaused, addEffortData]);

  const startSession = async () => {
    if (!user) return null;
    try {
      const existingId = localStorage.getItem('currentSessionId');
      if (existingId) return existingId;
      const sessionId = await SessionService.createSession({ therapy_type: 'terapia_guiada', duration: duration[0], state: 'active' });
      const id = sessionId?.id || null;
      if (id) localStorage.setItem('currentSessionId', id);
      return id;
    } catch (error) { console.error('Error creating session:', error); return null; }
  };

  const finishSession = async () => {
    if (!currentSessionId && typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentSessionId');
      if (stored) setCurrentSessionId(stored);
    }
    if (!currentSessionId || !user) return;
    try {
      await SessionService.updateSessionState(currentSessionId, 'completed');
      localStorage.removeItem('currentSessionId');
      setSessionEffortData([]);
    } catch (error) { console.error('Error finishing session:', error); }
  };

  const handleStart = async () => { setShowOverlay(true); };

  const startTimerNow = async () => {
    if (!isActive && user) {
      clearBleDataLog();
      const sessionId = await startSession();
      setCurrentSessionId(sessionId);
      bleService.startTherapy();
      const initialTimeLeft = duration[0] * 60;
      setTimeLeft(initialTimeLeft);
      setStartTime(Date.now());
      setPauseStartTime(null);
      setTotalPausedTime(0);
      setIsActive(true);
      setIsPaused(false);
      setIsTherapyActive(true);
      clearEffortHistory();
      setSampleCounter(0);
      setSessionEffortData([]);
    }
  };

  const handlePause = () => {
    if (isPaused) {
      if (pauseStartTime) {
        setTotalPausedTime(prev => prev + (Date.now() - pauseStartTime));
        setPauseStartTime(null);
      }
    } else {
      setPauseStartTime(Date.now());
    }
    setIsPaused(!isPaused);
  };

  const handleCancel = async () => {
    bleService.stopTherapy();
    if (currentSessionId && user) {
      try { await SessionService.updateSessionState(currentSessionId, 'cancelled'); } catch (error) { console.error('Error cancelling session:', error); }
    }
    try { localStorage.removeItem('currentSessionId'); } catch {}
    setIsActive(false); setIsPaused(false); setTimeLeft(0); setIsTherapyActive(false);
    setShowOverlay(false); setCurrentSessionId(null); setStartTime(null);
    setPauseStartTime(null); setTotalPausedTime(0); clearEffortHistory();
    clearBleDataLog(); setSampleCounter(0); setSessionEffortData([]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = timeLeft > 0 ? ((duration[0] * 60 - timeLeft) / (duration[0] * 60)) * 100 : 0;
  const currentAngle = isActive ? (progress / 100) * 360 : minutesToAngle(duration[0]);
  const handlePos = polarToCartesian(Math.max(currentAngle, 0.1));

  return (
    <>
      <Card className="w-full border-2 border-accent/20 shadow-lg rounded-2xl overflow-hidden pb-2">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-accent/5 via-accent/3 to-primary/5 dark:from-accent/10 dark:via-accent/5 dark:to-primary/10 p-4 sm:p-6 lg:p-8 ">
            {/* Title */}
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent"></span>
              {t.therapyHub}
            </h2>

            {/* 2-column layout: flex row, vertically centered */}
            <div className="flex flex-col md:flex-row items-stretch ">
              {/* Left: Image — 40% width, same height as timer */}
              <div className="md:w-[55%] shrink-0 flex items-center justify-end overflow-hidden">
                <img
                  src={lateralImg}
                  alt="Rehabilitation device"
                  className="w-full h-full object-contain scale-[1.3]"
                />
              </div>

              {/* Right: Circular slider + CTA — 60% width */}
              <div className="flex flex-col items-center gap-3 sm:gap-4 md:w-[45%]">
                {/* Circular Slider — fixed 180px diameter */}
                <div className="relative w-[180px] h-[180px]">
                  <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    viewBox="0 0 200 200"
                    className={`${!isActive ? 'cursor-pointer' : ''}`}
                    onClick={handleSvgClick}
                  >
                    {/* Track */}
                    <circle
                      cx={CENTER}
                      cy={CENTER}
                      r={RADIUS}
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth={STROKE_WIDTH}
                    />
                    {/* Progress arc */}
                    {currentAngle > 0 && (
                      <path
                        d={describeArc(0, currentAngle)}
                        fill="none"
                        stroke="hsl(var(--accent))"
                        strokeWidth={STROKE_WIDTH}
                        strokeLinecap="round"
                      />
                    )}
                    {/* Handle / knob */}
                    {!isActive && (
                      <circle
                        cx={handlePos.x}
                        cy={handlePos.y}
                        r={14}
                        fill="white"
                        stroke="hsl(var(--accent))"
                        strokeWidth={3}
                        className="cursor-grab active:cursor-grabbing"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                        onMouseDown={(e) => { e.stopPropagation(); setIsDragging(true); }}
                        onTouchStart={(e) => { e.stopPropagation(); setIsDragging(true); }}
                      />
                    )}
                    {/* Tick marks */}
                    {Array.from({ length: 12 }, (_, i) => {
                      const angle = (i / 12) * 360;
                      const inner = polarToCartesian(angle);
                      const outerR = RADIUS + 8;
                      const angleRad = ((angle - 90) * Math.PI) / 180;
                      const outerX = CENTER + outerR * Math.cos(angleRad);
                      const outerY = CENTER + outerR * Math.sin(angleRad);
                      return (
                        <line
                          key={i}
                          x1={inner.x}
                          y1={inner.y}
                          x2={outerX}
                          y2={outerY}
                          stroke="hsl(var(--muted-foreground) / 0.3)"
                          strokeWidth={1.5}
                        />
                      );
                    })}
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                      {isActive ? formatTime(timeLeft) : `${duration[0]}:00`}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                      {isActive ? (isPaused ? t.paused : t.minutes) : t.suggestedDuration}
                    </span>
                  </div>
                </div>

                {/* Quick goal badge */}
                <button
                  onClick={() => !isActive && setDuration([dailyGoal])}
                  disabled={isActive}
                  className="px-4 py-1.5 rounded-full text-sm font-medium bg-accent/15 text-accent hover:bg-accent/25 border border-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {dailyGoal} {t.minutes} {t.recommended}
                </button>

                {/* CTA Button */}
                <Button
                  onClick={handleStart}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 sm:px-10 py-4 sm:py-6 text-base sm:text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 min-h-[48px] sm:min-h-[56px] w-full max-w-[260px] sm:max-w-[280px]"
                  disabled={isActive}
                  size="lg"
                >
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                  {t.startSessionBtn}
                </Button>

                {/* Hint */}
                <p className="text-center text-xs text-muted-foreground max-w-[260px]">
                  {t.therapyHubHint}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showOverlay && (
        <TherapyOverlay
          timeLeft={timeLeft}
          isPaused={isPaused}
          onPause={handlePause}
          onCancel={handleCancel}
          formatTime={formatTime}
          duration={duration[0]}
          onStartTimer={startTimerNow}
          isActive={isActive}
        />
      )}
    </>
  );
};

export default TherapyTimer;
