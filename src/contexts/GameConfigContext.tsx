
import React, { createContext, useContext, useState, useEffect } from 'react';

export type GameHand = 'left' | 'right';

interface GameConfigContextType {
  orangeJuiceGoal: number;
  setOrangeJuiceGoal: (goal: number) => void;
  calculateOrangeGoalForTime: (minutes: number) => number;
  enemySpeed: number;
  shotSpeed: number;
  setEnemySpeed: (speed: number) => void;
  setShotSpeed: (speed: number) => void;
  baseEnemyCount: number;
  setBaseEnemyCount: (count: number) => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
  flappyPipeGap: number;
  setFlappyPipeGap: (gap: number) => void;
  flappyPipeInterval: number;
  setFlappyPipeInterval: (seconds: number) => void;
  restRepetitions: number;
  setRestRepetitions: (reps: number) => void;
  restLevels: number;
  setRestLevels: (levels: number) => void;
  restDuration: number;
  setRestDuration: (seconds: number) => void;
  // Hand selection & max angle per game
  gameHand: GameHand;
  setGameHand: (hand: GameHand) => void;
  orangeMaxAngle: number;
  setOrangeMaxAngle: (angle: number) => void;
  flappyMaxAngle: number;
  setFlappyMaxAngle: (angle: number) => void;
  neuroLinkMaxAngle: number;
  setNeuroLinkMaxAngle: (angle: number) => void;
}

const GameConfigContext = createContext<GameConfigContextType | undefined>(undefined);

export const GameConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orangeJuiceGoal, setOrangeJuiceGoalState] = useState(1); // mínimo 1 vaso
  const [enemySpeed, setEnemySpeedState] = useState(3);
  const [shotSpeed, setShotSpeedState] = useState(3);
  const [baseEnemyCount, setBaseEnemyCountState] = useState(6);
  const [darkMode, setDarkModeState] = useState(false);
  const [flappyPipeGap, setFlappyPipeGapState] = useState(120);
  const [flappyPipeInterval, setFlappyPipeIntervalState] = useState(5);
  const [restRepetitions, setRestRepetitionsState] = useState(10);
  const [restLevels, setRestLevelsState] = useState(3);
  const [restDuration, setRestDurationState] = useState(30);
  const [gameHand, setGameHandState] = useState<GameHand>('right');
  const [orangeMaxAngle, setOrangeMaxAngleState] = useState(90);
  const [flappyMaxAngle, setFlappyMaxAngleState] = useState(90);
  const [neuroLinkMaxAngle, setNeuroLinkMaxAngleState] = useState(90);

  useEffect(() => {
    const saved = localStorage.getItem('orangeJuiceGoal');
    if (saved) {
      const goal = parseInt(saved);
      setOrangeJuiceGoalState(Math.max(1, goal)); // Asegurar mínimo 1
    }

    const savedEnemySpeed = localStorage.getItem('enemySpeed');
    if (savedEnemySpeed) {
      const speed = parseInt(savedEnemySpeed);
      setEnemySpeedState(Math.max(1, Math.min(5, speed)));
    }

    const savedShotSpeed = localStorage.getItem('shotSpeed');
    if (savedShotSpeed) {
      const speed = parseInt(savedShotSpeed);
      setShotSpeedState(Math.max(1, Math.min(5, speed)));
    }

    const savedBaseEnemyCount = localStorage.getItem('baseEnemyCount');
    if (savedBaseEnemyCount) {
      const count = parseInt(savedBaseEnemyCount);
      setBaseEnemyCountState(Math.max(3, Math.min(12, count)));
    }

    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkModeState(savedDarkMode === 'true');
    }

    const savedFlappyPipeGap = localStorage.getItem('flappyPipeGap');
    if (savedFlappyPipeGap) {
      const gap = parseInt(savedFlappyPipeGap);
      setFlappyPipeGapState(Math.max(80, Math.min(200, gap)));
    }

    const savedFlappyPipeInterval = localStorage.getItem('flappyPipeInterval');
    if (savedFlappyPipeInterval) {
      setFlappyPipeIntervalState(Math.max(2, Math.min(15, parseInt(savedFlappyPipeInterval) || 5)));
    }

    const savedRestReps = localStorage.getItem('restRepetitions');
    if (savedRestReps) setRestRepetitionsState(Math.max(1, parseInt(savedRestReps) || 10));

    const savedRestLevels = localStorage.getItem('restLevels');
    if (savedRestLevels) setRestLevelsState(Math.max(1, parseInt(savedRestLevels) || 3));

    const savedRestDuration = localStorage.getItem('restDuration');
    if (savedRestDuration) setRestDurationState(Math.max(5, parseInt(savedRestDuration) || 30));

    const savedGameHand = localStorage.getItem('gameHand');
    if (savedGameHand === 'left' || savedGameHand === 'right') setGameHandState(savedGameHand);

    const savedOrangeMax = localStorage.getItem('orangeMaxAngle');
    if (savedOrangeMax) setOrangeMaxAngleState(Math.max(30, Math.min(180, parseInt(savedOrangeMax) || 90)));

    const savedFlappyMax = localStorage.getItem('flappyMaxAngle');
    if (savedFlappyMax) setFlappyMaxAngleState(Math.max(30, Math.min(180, parseInt(savedFlappyMax) || 90)));

    const savedNeuroMax = localStorage.getItem('neuroLinkMaxAngle');
    if (savedNeuroMax) setNeuroLinkMaxAngleState(Math.max(30, Math.min(180, parseInt(savedNeuroMax) || 90)));
  }, []);

  const setOrangeJuiceGoal = (goal: number) => {
    const validGoal = Math.max(1, goal); // Asegurar mínimo 1
    setOrangeJuiceGoalState(validGoal);
    localStorage.setItem('orangeJuiceGoal', validGoal.toString());
  };

  const setEnemySpeed = (speed: number) => {
    const validSpeed = Math.max(1, Math.min(5, speed));
    setEnemySpeedState(validSpeed);
    localStorage.setItem('enemySpeed', validSpeed.toString());
  };

  const setShotSpeed = (speed: number) => {
    const validSpeed = Math.max(1, Math.min(5, speed));
    setShotSpeedState(validSpeed);
    localStorage.setItem('shotSpeed', validSpeed.toString());
  };

  const setBaseEnemyCount = (count: number) => {
    const validCount = Math.max(3, Math.min(12, count));
    setBaseEnemyCountState(validCount);
    localStorage.setItem('baseEnemyCount', validCount.toString());
  };

  const setDarkMode = (mode: boolean) => {
    setDarkModeState(mode);
    localStorage.setItem('darkMode', mode.toString());
  };

  const setFlappyPipeGap = (gap: number) => {
    const validGap = Math.max(80, Math.min(200, gap));
    setFlappyPipeGapState(validGap);
    localStorage.setItem('flappyPipeGap', validGap.toString());
  };

  const setFlappyPipeInterval = (seconds: number) => {
    const valid = Math.max(2, Math.min(15, seconds));
    setFlappyPipeIntervalState(valid);
    localStorage.setItem('flappyPipeInterval', valid.toString());
  };

  const calculateOrangeGoalForTime = (minutes: number) => {
    return Math.max(1, orangeJuiceGoal);
  };

  const setRestRepetitions = (reps: number) => {
    const valid = Math.max(1, reps);
    setRestRepetitionsState(valid);
    localStorage.setItem('restRepetitions', valid.toString());
  };

  const setRestLevels = (levels: number) => {
    const valid = Math.max(1, levels);
    setRestLevelsState(valid);
    localStorage.setItem('restLevels', valid.toString());
  };

  const setRestDuration = (seconds: number) => {
    const valid = Math.max(5, Math.min(300, seconds));
    setRestDurationState(valid);
    localStorage.setItem('restDuration', valid.toString());
  };

  const setGameHand = (hand: GameHand) => {
    setGameHandState(hand);
    localStorage.setItem('gameHand', hand);
  };

  const setOrangeMaxAngle = (angle: number) => {
    const valid = Math.max(30, Math.min(180, angle));
    setOrangeMaxAngleState(valid);
    localStorage.setItem('orangeMaxAngle', valid.toString());
  };

  const setFlappyMaxAngle = (angle: number) => {
    const valid = Math.max(30, Math.min(180, angle));
    setFlappyMaxAngleState(valid);
    localStorage.setItem('flappyMaxAngle', valid.toString());
  };

  const setNeuroLinkMaxAngle = (angle: number) => {
    const valid = Math.max(30, Math.min(180, angle));
    setNeuroLinkMaxAngleState(valid);
    localStorage.setItem('neuroLinkMaxAngle', valid.toString());
  };

  return (
    <GameConfigContext.Provider value={{
      orangeJuiceGoal,
      setOrangeJuiceGoal,
      calculateOrangeGoalForTime,
      enemySpeed,
      shotSpeed,
      setEnemySpeed,
      setShotSpeed,
      baseEnemyCount,
      setBaseEnemyCount,
      darkMode,
      setDarkMode,
      flappyPipeGap,
      setFlappyPipeGap,
      flappyPipeInterval,
      setFlappyPipeInterval,
      restRepetitions,
      setRestRepetitions,
      restLevels,
      setRestLevels,
      restDuration,
      setRestDuration,
      gameHand,
      setGameHand,
      orangeMaxAngle,
      setOrangeMaxAngle,
      flappyMaxAngle,
      setFlappyMaxAngle,
      neuroLinkMaxAngle,
      setNeuroLinkMaxAngle,
    }}>
      {children}
    </GameConfigContext.Provider>
  );
};

export const useGameConfig = () => {
  const context = useContext(GameConfigContext);
  if (!context) {
    throw new Error('useGameConfig must be used within a GameConfigProvider');
  }
  return context;
};
