/**
 * MainMenuDashboard.tsx
 * Ultra-Modern 2026 Esports Racing Operations Dashboard for Apex GT.
 * Inspired by Gran Turismo 7 & Formula 1 luxury motorsport editorial design.
 * 
 * Features:
 * - Screen 2 (Root View): 2x3 Panoramic Cards with zero scroll (Career, Garage, Free, School, Multiplayer, Grand Prix)
 * - Screen 3 (Paddock & Preparation Command Center):
 *   - Custom user-uploaded background image (/images/screen3_bg.png) with dark vignette
 *   - Zero-scroll layout (h-screen max-h-screen overflow-hidden flex flex-col justify-between)
 *   - 6 Custom Image Selector Buttons styled like GT7 cards (Circuits, Tires, Laps, AI Difficulty, Livery/Team, Assists/Setup)
 *   - High-fidelity superimposed modal overlays for selecting each configuration element seamlessly
 *   - Master Launch CTA button with audio feedback
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trophy,
  Timer,
  Users,
  Flag,
  Play,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Zap,
  Compass,
  HelpCircle,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Sliders,
  CheckCircle2,
  Palette,
  Shield,
  Maximize2,
  Minimize2,
  Eye,
  Activity,
  Flame,
  Wind,
  Thermometer,
  Gauge,
  CircleDot,
  Radio,
  Layers,
  ChevronDown,
  GraduationCap,
  Globe,
  Car,
  Coins,
  X,
  Settings,
  Disc,
  Clock,
  Swords,
  User,
} from 'lucide-react';
import { CameraDistanceMode, CameraViewMode } from '../game/RacingGameEngine';
import { MultiplayerRoomState } from '../game/multiplayer/MultiplayerClient';
import { RaceDifficulty, RaceLapOption, CustomLiverySettings, CareerSeasonState, saveLivery } from '../game/career/CareerTypes';
import { TireCompoundType } from '../game/physics/TireCompound';
import { playUiClick, playUiHover, playModeSelectChime } from '../utils/uiAudio';
import { CircuitId } from '../game/circuits/ICircuit';
import { AVAILABLE_CIRCUITS } from '../game/circuits/CircuitRegistry';

export interface MainMenuDashboardProps {
  onStartSolo: (
    cameraDistance: CameraDistanceMode,
    cameraMode: CameraViewMode,
    laps: RaceLapOption,
    difficulty: RaceDifficulty,
    startingCompound: TireCompoundType,
    circuitId?: CircuitId
  ) => void;
  onStartCareerMode?: (
    cameraDistance: CameraDistanceMode,
    cameraMode: CameraViewMode,
    laps: RaceLapOption,
    difficulty: RaceDifficulty,
    startingCompound: TireCompoundType,
    circuitId?: CircuitId
  ) => void;
  onOpenLiveryStudio?: () => void;
  customLivery?: CustomLiverySettings;
  careerSeason?: CareerSeasonState;
  onResetCareerSeason?: () => void;
  onStartFreePractice?: (
    cameraDistance: CameraDistanceMode,
    cameraMode: CameraViewMode,
    startingCompound: TireCompoundType,
    circuitId?: CircuitId
  ) => void;
  selectedCircuit?: CircuitId;
  onSelectCircuit?: (circuitId: CircuitId) => void;
  onCreateRoom: (options: {
    playerName: string;
    laps: number;
    car1Name: string;
    car2Name: string;
    crewName: string;
    cameraDistance: CameraDistanceMode;
    cameraMode: CameraViewMode;
  }) => Promise<void>;
  onJoinRoom: (code: string, playerName: string, cameraDistance: CameraDistanceMode, cameraMode: CameraViewMode) => Promise<void>;
  onStartMultiplayerRace: () => void;
  onSetReady: (isReady: boolean) => void;
  onLeaveRoom: () => void;
  onBackToTitle: () => void;
  roomState: MultiplayerRoomState | null;
  playerId: 'p1' | 'p2' | null;
  isConnecting: boolean;
  errorMessage: string | null;
  onStartFreeCamera?: (circuitId?: CircuitId) => void;
  // Deprecated stubs
  onOpenModelUpload?: (target: 'car1' | 'car2' | 'crew') => void;
  car1Name?: string;
  car2Name?: string;
  crewName?: string;
}

export type MenuDedicatedScreen = 'root' | 'career' | 'free' | 'multiplayer' | 'grand_prix';
export type Screen3Overlay = 'none' | 'tires' | 'circuit' | 'laps' | 'difficulty' | 'setup' | 'livery' | 'multiplayer_modal';

export const MainMenuDashboard: React.FC<MainMenuDashboardProps> = ({
  onStartSolo,
  onStartCareerMode,
  onOpenLiveryStudio,
  customLivery,
  careerSeason,
  onStartFreePractice,
  selectedCircuit: initialCircuit,
  onSelectCircuit,
  onCreateRoom,
  onJoinRoom,
  onStartMultiplayerRace,
  onSetReady,
  onLeaveRoom,
  onBackToTitle,
  roomState,
  playerId,
  isConnecting,
  errorMessage,
  onStartFreeCamera,
}) => {
  // Navigation State: 'root' (Screen 2 Mode Selection) or dedicated mode screen (Screen 3)
  const [activeScreen, setActiveScreen] = useState<MenuDedicatedScreen>('root');

  // Screen transition states for buttery-smooth cross-screen fading
  const [screenOpacity, setScreenOpacity] = useState<number>(0);
  const [isScreenTransitioning, setIsScreenTransitioning] = useState<boolean>(true);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Smooth entrance when MainMenuDashboard mounts (e.g. from TitleScreen)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setScreenOpacity(1);
      const timer = setTimeout(() => {
        setIsScreenTransitioning(false);
      }, 420);
      return () => clearTimeout(timer);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  // Sequential transition function: fade-out current screen -> switch screen -> fade-in next screen
  const transitionToScreen = useCallback((targetScreen: MenuDedicatedScreen) => {
    if (isScreenTransitioning || targetScreen === activeScreen) return;

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    setIsScreenTransitioning(true);
    // Step 1: Smoothly fade out current screen (background and buttons together)
    setScreenOpacity(0);

    // Step 2: When completely faded out (after 360ms), switch screen while invisible
    transitionTimerRef.current = setTimeout(() => {
      setActiveScreen(targetScreen);
      setActiveOverlay('none');

      // Step 3: Next frame, fade in next screen (background and buttons together)
      requestAnimationFrame(() => {
        setScreenOpacity(1);
        transitionTimerRef.current = setTimeout(() => {
          setIsScreenTransitioning(false);
        }, 420);
      });
    }, 360);
  }, [activeScreen, isScreenTransitioning]);

  // Selected Circuit
  const [selectedCircuit, setSelectedCircuit] = useState<CircuitId>(initialCircuit || 'square_apex');

  // Racing Parameters
  const [laps, setLaps] = useState<RaceLapOption>(9);
  const [difficulty, setDifficulty] = useState<RaceDifficulty>('medium');
  const [startingCompound, setStartingCompound] = useState<TireCompoundType>('soft');

  // Camera Settings
  const [cameraDistance, setCameraDistance] = useState<CameraDistanceMode>('medium');
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('chase');

  // Driving Assists
  const [tractionControl, setTractionControl] = useState<boolean>(true);
  const [absEnabled, setAbsEnabled] = useState<boolean>(true);
  const [racingLine, setRacingLine] = useState<boolean>(true);

  // Multiplayer Form State
  const [mpTab, setMpTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState<string>(customLivery?.driverName || 'PILOTO APEX');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [mpLaps, setMpLaps] = useState<number>(3);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Controls Guide Modal
  const [showControlsModal, setShowControlsModal] = useState<boolean>(false);

  // GT7 Style Active Card Index on Screen 2
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0);

  // Screen 3: Superimposed Modal Overlays
  const [activeOverlay, setActiveOverlay] = useState<Screen3Overlay>('none');
  const [teamName, setTeamName] = useState<string>(customLivery?.teamName || 'Oracle Red Bull Racing');
  const [carNumber, setCarNumber] = useState<string>(customLivery?.driverNumber || '1');
  const [driverDisplayName, setDriverDisplayName] = useState<string>(customLivery?.driverName || 'M. Verstappen');
  const [driverCode, setDriverCode] = useState<string>(customLivery?.driverCode || 'VER');
  const [primaryColor, setPrimaryColor] = useState<string>(customLivery?.primaryColor || '#040814');
  const [secondaryColor, setSecondaryColor] = useState<string>(customLivery?.secondaryColor || '#cc0022');
  const [accentColor, setAccentColor] = useState<string>(customLivery?.accentColor || '#fec008');

  // Live Digital Clock & Date
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => {
    const d = new Date();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      setCurrentDateStr(`${d.getDate()} ${months[d.getMonth()]}`);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return typeof document !== 'undefined' ? !!document.fullscreenElement : false;
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (e.key === 'Escape' && activeOverlay !== 'none') {
        setActiveOverlay('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeOverlay]);

  const toggleFullscreen = () => {
    playUiClick(750);
    try {
      if (!document.fullscreenElement) {
        const root = document.documentElement;
        if (root.requestFullscreen) {
          root.requestFullscreen().catch(() => {});
        } else if ((root as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
          (root as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as unknown as { webkitExitFullscreen?: () => void }).webkitExitFullscreen) {
          (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
        }
      }
    } catch {}
  };

  const handleSelectCircuitLocal = (id: CircuitId) => {
    playUiClick(650);
    setSelectedCircuit(id);
    onSelectCircuit?.(id);
  };

  const handleNavigateToScreen = (screen: MenuDedicatedScreen) => {
    playModeSelectChime();
    transitionToScreen(screen);
  };

  const handleBackToGrid = () => {
    playUiClick(700);
    transitionToScreen('root');
  };

  // Launch handlers for each dedicated screen (with smooth fade-out into race / loading)
  const handleLaunchCareer = () => {
    if (isScreenTransitioning) return;
    playUiClick(950);
    setIsScreenTransitioning(true);
    setScreenOpacity(0);
    setTimeout(() => {
      if (onStartCareerMode) {
        onStartCareerMode(cameraDistance, cameraMode, laps, difficulty, startingCompound, selectedCircuit);
      } else {
        onStartSolo(cameraDistance, cameraMode, laps, difficulty, startingCompound, selectedCircuit);
      }
    }, 360);
  };

  const handleLaunchFreePractice = () => {
    if (isScreenTransitioning) return;
    playUiClick(950);
    setIsScreenTransitioning(true);
    setScreenOpacity(0);
    setTimeout(() => {
      if (onStartFreePractice) {
        onStartFreePractice(cameraDistance, cameraMode, startingCompound, selectedCircuit);
      } else {
        onStartSolo(cameraDistance, cameraMode, 9, 'easy', startingCompound, selectedCircuit);
      }
    }, 360);
  };

  const handleLaunchGrandPrix = () => {
    if (isScreenTransitioning) return;
    playUiClick(950);
    setIsScreenTransitioning(true);
    setScreenOpacity(0);
    setTimeout(() => {
      onStartSolo(cameraDistance, cameraMode, laps, difficulty, startingCompound, selectedCircuit);
    }, 360);
  };

  const handleLaunchFreeCamera = () => {
    playUiClick(750);
    if (onStartFreeCamera) {
      onStartFreeCamera(selectedCircuit);
    } else if (onStartFreePractice) {
      onStartFreePractice(cameraDistance, cameraMode, startingCompound, selectedCircuit);
    }
  };

  const handleCreateRoomAction = async () => {
    playUiClick(850);
    await onCreateRoom({
      playerName: playerName.trim() || 'Piloto Anfitrión',
      laps: mpLaps,
      car1Name: 'F1 Turbo GP (Host)',
      car2Name: 'F1 Turbo GP (Rival)',
      crewName: 'Pit Crew Scuderia',
      cameraDistance,
      cameraMode,
    });
  };

  const handleJoinRoomAction = async () => {
    if (!joinCodeInput.trim()) return;
    playUiClick(850);
    await onJoinRoom(
      joinCodeInput.trim().toUpperCase(),
      playerName.trim() || 'Piloto Invitado',
      cameraDistance,
      cameraMode
    );
  };

  const handleToggleReady = () => {
    playUiClick(800);
    const next = !isReady;
    setIsReady(next);
    onSetReady(next);
  };

  const copyRoomCode = () => {
    if (!roomState?.code) return;
    navigator.clipboard.writeText(roomState.code);
    setIsCopied(true);
    playUiClick(900);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currentCircuit = AVAILABLE_CIRCUITS.find((c) => c.id === selectedCircuit) || AVAILABLE_CIRCUITS[0];

  // Career stats calculation
  const playerStanding = careerSeason?.standings?.find((s) => s.isPlayer);
  const playerPoints = playerStanding?.points ?? 0;

  // Estimated race duration calculation
  const calculateEstimatedTime = (totalLaps: number) => {
    const lapTime = currentCircuit.expectedLapTimeSec || 35;
    const totalSecs = lapTime * totalLaps;
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.round(totalSecs % 60);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const formatLapTimeMMSS = (totalLaps: number) => {
    const lapTime = currentCircuit.expectedLapTimeSec || 35;
    const totalSecs = lapTime * totalLaps;
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.round(totalSecs % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Gran Turismo 7 Cards Configuration for Screen 2 (Root View: 4 Core Modes)
  const gt7Cards = [
    {
      id: 'career',
      title: 'MODO CARRERA',
      desc: 'Compite, gana y avanza en tu carrera como piloto profesional.',
      bg: '/images/cards/card_career.jpg',
      icon: Trophy,
      action: () => handleNavigateToScreen('career'),
    },
    {
      id: 'free',
      title: 'CONDUCCIÓN LIBRE',
      desc: 'Explora libremente los circuitos y disfruta de la conducción.',
      bg: '/images/cards/card_free.jpg',
      icon: Timer,
      action: () => handleNavigateToScreen('free'),
    },
    {
      id: 'multiplayer',
      title: 'MULTIJUGADOR',
      desc: 'Compite en línea con jugadores de todo el mundo en 1v1.',
      bg: '/images/cards/card_multiplayer.jpg',
      icon: Globe,
      action: () => handleNavigateToScreen('multiplayer'),
    },
    {
      id: 'grand_prix',
      title: 'GRAN PREMIO',
      desc: 'Parrilla oficial FIA de 5 monoplazas con semáforo y paradas en boxes.',
      bg: '/images/cards/card_grandprix.jpg',
      icon: Flag,
      action: () => handleNavigateToScreen('grand_prix'),
    },
  ];

  // Screen 3 Selectors Configuration (Cards with custom background images)
  const screen3Selectors = [
    {
      id: 'circuit',
      category: 'CIRCUITO FIA',
      title: currentCircuit.name,
      subtitle: `${(currentCircuit.totalLength / 1000).toFixed(2)} KM · ${currentCircuit.cornersCount} Curvas`,
      tag: currentCircuit.flagEmoji || '🏁',
      bg: '/images/cards/btn_circuit.jpg',
      action: () => {
        playUiClick(750);
        setActiveOverlay('circuit');
      },
    },
    {
      id: 'tires',
      category: 'NEUMÁTICOS',
      title:
        startingCompound === 'soft'
          ? 'BLANDO C4 (ROJO)'
          : startingCompound === 'medium'
          ? 'MEDIO C3 (AMARILLO)'
          : 'DURO C2 (BLANCO)',
      subtitle:
        startingCompound === 'soft'
          ? 'Agarre 100% · 8-10 Vueltas'
          : startingCompound === 'medium'
          ? 'Agarre 92% · 18-22 Vueltas'
          : 'Agarre 84% · 35+ Vueltas',
      tag:
        startingCompound === 'soft' ? '🔴 PIRELLI' : startingCompound === 'medium' ? '🟡 PIRELLI' : '⚪ PIRELLI',
      bg: '/images/cards/btn_tire.jpg',
      action: () => {
        playUiClick(750);
        setActiveOverlay('tires');
      },
    },
    {
      id: 'laps',
      category: 'DURACIÓN & VUELTAS',
      title: `${laps} VUELTAS`,
      subtitle: `${calculateEstimatedTime(laps)} · ${
        laps === 9 ? 'Sprint Relámpago' : laps === 20 ? 'Gran Premio Estándar' : 'Resistencia Completa'
      }`,
      tag: '🏁 DISTANCIA',
      bg: '/images/cards/btn_laps.jpg',
      action: () => {
        playUiClick(750);
        setActiveOverlay('laps');
      },
    },
    {
      id: 'difficulty',
      category: activeScreen === 'multiplayer' ? 'SALA MULTIJUGADOR' : 'DIFICULTAD RIVALES',
      title:
        activeScreen === 'multiplayer'
          ? roomState
            ? `SALA: ${roomState.code}`
            : 'DUELO 1V1 EN LÍNEA'
          : difficulty === 'easy'
          ? 'NOVATO'
          : difficulty === 'medium'
          ? 'INTERMEDIO'
          : 'LEYENDA FIA',
      subtitle:
        activeScreen === 'multiplayer'
          ? roomState
            ? `Jugadores: ${roomState.players.p1 ? 1 : 0} + ${roomState.players.p2 ? 1 : 0}/2`
            : 'Crear sala privada o unirse con código'
          : difficulty === 'easy'
          ? 'Ritmo accesible y permisivo'
          : difficulty === 'medium'
          ? 'Competitivo y equilibrado'
          : 'Máxima agresividad de parrilla',
      tag: activeScreen === 'multiplayer' ? '🌐 WEBSOCKET' : '⚡ IA DINÁMICA',
      bg: '/images/cards/card_grandprix.jpg',
      action: () => {
        playUiClick(750);
        if (activeScreen === 'multiplayer') {
          setActiveOverlay('multiplayer_modal');
        } else {
          setActiveOverlay('difficulty');
        }
      },
    },
    {
      id: 'livery',
      category: 'ESCUDERÍA & PILOTO',
      title: teamName,
      subtitle: `#${carNumber} · ${driverDisplayName} (${driverCode})`,
      tag: '🏎️ MONOPLAZA',
      bg: '/images/cards/btn_livery.jpg',
      action: () => {
        playUiClick(750);
        setActiveOverlay('livery');
      },
    },
    {
      id: 'setup',
      category: 'REGLAJES & ASISTENCIAS',
      title: `TC: ${tractionControl ? 'ON' : 'OFF'} · ABS: ${absEnabled ? 'ON' : 'OFF'}`,
      subtitle: `Trazada: ${racingLine ? 'ON' : 'OFF'} · Cámara: ${
        cameraMode === 'chase' ? 'Exterior' : cameraMode === 'bumper' ? 'Morro/Asfalto' : cameraMode === 'hood' ? 'Capó' : 'Órbita'
      }`,
      tag: '🛠️ TELEMETRÍA',
      bg: '/images/cards/btn_helmet.jpg',
      action: () => {
        playUiClick(750);
        setActiveOverlay('setup');
      },
    },
  ];

  // Arrow key navigation for 2x2 cards in root menu
  useEffect(() => {
    if (activeScreen !== 'root' || showControlsModal || activeOverlay !== 'none') return;
    const handleMenuNav = (e: KeyboardEvent) => {
      const total = gt7Cards.length;
      if (total === 0) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        playUiHover();
        setSelectedCardIndex((prev) => (prev + 1) % total);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        playUiHover();
        setSelectedCardIndex((prev) => (prev - 1 + total) % total);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        playUiHover();
        setSelectedCardIndex((prev) => (prev + 2) % total);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        playUiHover();
        setSelectedCardIndex((prev) => (prev - 2 + total) % total);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const c = gt7Cards[selectedCardIndex];
        if (c) c.action();
      }
    };
    window.addEventListener('keydown', handleMenuNav);
    return () => window.removeEventListener('keydown', handleMenuNav);
  }, [activeScreen, selectedCardIndex, showControlsModal, activeOverlay, gt7Cards]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between h-screen max-h-screen overflow-hidden select-none text-white font-sans bg-neutral-950">
      {/* ========================================================================= */}
      {/* DEDICATED SCREEN TRANSITION LAYER (Background and Buttons Fade Together) */}
      {/* ========================================================================= */}
      <div
        className={`relative w-full h-full flex flex-col justify-between overflow-hidden ${
          isScreenTransitioning ? 'pointer-events-none' : ''
        }`}
        style={{
          opacity: screenOpacity,
          transition: 'opacity 360ms cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'opacity',
        }}
      >
        {/* ========================================================================= */}
        {/* BACKGROUND IMAGE: Root GT7 vs Screen 3 User Uploaded Background Image    */}
        {/* ========================================================================= */}
        <img
        src={activeScreen === 'root' ? '/images/dashboard_bg.webp' : '/images/screen3_bg.png'}
        alt="Racing Background"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-95 select-none z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/35 to-neutral-950/75 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-neutral-950/20 to-neutral-950/60 pointer-events-none z-0" />

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 1. TOP HEADER / FULLSCREEN ACTION                                         */}
      {/* ========================================================================= */}
      {activeScreen === 'root' ? (
        /* Screen 2: No top bar or letters, only fullscreen button with nearly transparent background */
        <div className="absolute top-2.5 sm:top-3.5 right-2.5 sm:right-3.5 z-30">
          <button
            onClick={toggleFullscreen}
            onMouseEnter={playUiHover}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="p-1.5 sm:p-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer backdrop-blur-sm shadow-sm"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        /* Screen 3 Top Header matching the luxury motorsport styling */
        <header className="relative z-20 w-full border-b border-white/10 bg-neutral-950/85 backdrop-blur-xl px-2.5 sm:px-6 py-1 sm:py-1.5 flex items-center justify-between flex-shrink-0 shadow-lg">
          {/* Left: Mode Title & F1 Badge without '2026' and without 'CONFIGURACIÓN' */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="px-1.5 sm:px-2 py-0.5 rounded bg-red-600 text-white font-black italic tracking-tighter text-xs sm:text-sm font-mono shadow-md border border-red-400/40">
                F1
              </div>
            </div>

            <div className="leading-tight truncate">
              <h2 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-sans flex items-center gap-1.5 truncate">
                <span className="truncate">
                  {activeScreen === 'career' && 'MODO CARRERA'}
                  {activeScreen === 'free' && 'ENTRENAMIENTO & TIME ATTACK'}
                  {activeScreen === 'multiplayer' && 'PADDOCK MULTIJUGADOR 1V1'}
                  {activeScreen === 'grand_prix' && 'GRAN PREMIO OFICIAL FIA'}
                </span>
              </h2>
            </div>
          </div>

          {/* Right: Back Button & Fullscreen Button (Interchanged so Fullscreen is at the far right) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Back Button to return to Screen 2 */}
            <button
              onClick={handleBackToGrid}
              onMouseEnter={playUiHover}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 text-red-100 hover:text-white transition-all text-xs font-bold cursor-pointer shadow-md"
              title="Volver a selección de modalidades"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>MODOS</span>
            </button>

            {/* Fullscreen Button - At the far right where MODOS used to be */}
            <button
              onClick={toggleFullscreen}
              onMouseEnter={playUiHover}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              className="p-1 sm:p-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-neutral-300 hover:text-white transition-all cursor-pointer backdrop-blur-md"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </header>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT VIEWPORT: ZERO-SCROLL FOR BOTH SCREENS                    */}
      {/* ========================================================================= */}
      {activeScreen === 'root' ? (
        /* SCREEN 2: 2x2 Mode Selection Grid (40% Button Opacity & Maximized Space) */
        <main className="relative z-10 flex-1 flex flex-col justify-between px-3 sm:px-6 md:px-8 py-3.5 sm:py-5 max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
          {/* Top Title Banner */}
          <div className="flex-shrink-0 mb-1.5 sm:mb-2.5 text-left">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-wide text-white drop-shadow font-sans">
              UN MUNDO DE AUTOMOVILISMO
            </h1>
            <p className="text-[11px] sm:text-xs text-neutral-300 font-normal">
              Elige tu forma de disfrutar Apex GT.
            </p>
          </div>

          {/* 4 Cards Grid in 2x2 with 57% opacity & 40% narrower buttons for a clean open center */}
          <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-y-3 sm:gap-y-4 md:gap-y-5 w-full items-stretch my-auto">
            {gt7Cards.map((card, idx) => {
              const Icon = card.icon;
              const isSelected = selectedCardIndex === idx;
              const isLeftColumn = idx % 2 === 0;
              return (
                <button
                  key={card.id}
                  onClick={() => {
                    setSelectedCardIndex(idx);
                    playUiClick(800);
                    card.action();
                  }}
                  onMouseEnter={() => {
                    setSelectedCardIndex(idx);
                    playUiHover();
                  }}
                  className={`group relative rounded-xl sm:rounded-2xl overflow-hidden text-left cursor-pointer transition-all duration-300 flex flex-col justify-end p-2.5 sm:p-3.5 md:p-4 select-none bg-neutral-950/[0.57] backdrop-blur-sm ${
                    isLeftColumn ? 'justify-self-start w-[64%] sm:w-[60%]' : 'justify-self-end w-[64%] sm:w-[60%]'
                  } ${
                    isSelected
                      ? 'border-2 border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.65),inset_0_0_12px_rgba(34,211,238,0.2)] ring-1 ring-cyan-300 scale-[1.01]'
                      : 'border border-white/20 hover:border-cyan-400/80 hover:shadow-[0_0_16px_rgba(34,211,238,0.35)]'
                  }`}
                >
                  {/* Background Image with 57% opacity */}
                  <img
                    src={card.bg}
                    alt={card.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-[0.57] transition-transform duration-500 ease-out group-hover:scale-108"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-black/15 group-hover:bg-transparent transition-colors pointer-events-none" />

                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none" />
                  )}

                  <div className="relative z-10 flex flex-col justify-end">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                      <div className="p-1 sm:p-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 text-cyan-300 group-hover:text-cyan-200 shrink-0">
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white drop-shadow font-sans truncate">
                        {card.title}
                      </span>
                    </div>
                    <p className="text-[8.5px] sm:text-[10px] md:text-[11px] text-neutral-300 line-clamp-1 sm:line-clamp-2 mt-0.5 font-normal leading-tight">
                      {card.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </main>
      ) : (
        /* SCREEN 3: Custom Background + 6 Selector Buttons (60% Opacity) + Zero-Scroll Responsive Layout */
        <main className="relative z-10 flex-1 flex flex-col px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
          
          {/* ========================================================================= */}
          {/* LAYOUT A: LANDSCAPE VIEWPORT (Horizontal Phone/Desktop: Left Minimalist Panel + 3x2 Grid) */}
          {/* ========================================================================= */}
          <div className="hidden landscape:flex flex-row gap-2 sm:gap-3 flex-1 min-h-0 items-stretch">
            {/* Left Technical Specification Panel (Exact replica of user design) */}
            <aside className="w-56 sm:w-64 md:w-72 flex-shrink-0 flex flex-col justify-between rounded-2xl bg-[#0b0c10]/95 backdrop-blur-xl border border-white/10 p-2.5 sm:p-3 shadow-[0_0_30px_rgba(0,0,0,0.85)] min-h-0 relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-16 before:h-16 before:border-t-2 before:border-l-2 before:border-red-600 before:rounded-tl-2xl before:pointer-events-none">
              
              {/* Header: Glowing Red Dot + FICHA TÉCNICA + FIA Badge */}
              <div className="flex-shrink-0 border-b border-white/10 pb-1.5 mb-0.5 sm:mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(239,68,68,1)]" />
                  <span className="text-xs sm:text-[13px] font-bold tracking-wider text-white font-sans uppercase">
                    FICHA TÉCNICA
                  </span>
                </div>
                <div className="flex items-center justify-center px-2 py-0.5 rounded-full border border-white/60 bg-white/5 backdrop-blur-sm">
                  <span className="text-[9px] font-black tracking-wider text-white font-serif leading-none">
                    FIA
                  </span>
                </div>
              </div>

              {/* 6 Clean Technical Rows separated by subtle lines */}
              <div className="flex-1 min-h-0 flex flex-col justify-between py-0.5">
                {/* 1. Circuito */}
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('circuit'); }}
                  className="flex items-center gap-2.5 sm:gap-3 py-1 px-1 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer border-b border-white/[0.08]"
                >
                  <svg className="w-4 h-4 text-white/90 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 22V3" strokeLinecap="round" />
                    <path d="M4 4h14l-2 5 2 5H4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 4v10M12 4v10M16 4v10" opacity="0.6" />
                  </svg>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8.5px] font-semibold uppercase tracking-wider text-neutral-400 font-sans leading-none">
                      CIRCUITO
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-white font-sans truncate leading-tight mt-0.5">
                      {currentCircuit.name}
                    </span>
                    <span className="text-[8.5px] text-neutral-400 font-sans truncate leading-none mt-0.5">
                      {(currentCircuit.totalLength / 1000).toFixed(1)} km · {currentCircuit.cornersCount} Curvas
                    </span>
                  </div>
                </div>

                {/* 2. Neumático */}
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('tires'); }}
                  className="flex items-center gap-2.5 sm:gap-3 py-1 px-1 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer border-b border-white/[0.08]"
                >
                  <svg className="w-4 h-4 text-white/90 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4.5" />
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                    <path d="M12 3v4.5M12 16.5V21M3 12h4.5M16.5 12H21" strokeLinecap="round" />
                  </svg>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8.5px] font-semibold uppercase tracking-wider text-neutral-400 font-sans leading-none">
                      NEUMÁTICO
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          startingCompound === 'soft'
                            ? 'bg-red-600 shadow-[0_0_6px_rgba(239,68,68,1)]'
                            : startingCompound === 'medium'
                            ? 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,1)]'
                            : 'bg-white shadow-[0_0_6px_rgba(255,255,255,1)]'
                        }`}
                      />
                      <span className="text-[11px] sm:text-xs font-bold text-white uppercase font-sans truncate leading-tight">
                        {startingCompound === 'soft' ? 'BLANDO C4 (ROJO)' : startingCompound === 'medium' ? 'MEDIO C3 (AMARILLO)' : 'DURO C2 (BLANCO)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Distancia */}
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('laps'); }}
                  className="flex items-center gap-2.5 sm:gap-3 py-1 px-1 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer border-b border-white/[0.08]"
                >
                  <svg className="w-4 h-4 text-white/90 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="13" r="8" />
                    <path d="M12 9v4l2.5 2.5" />
                    <path d="M12 2v3M10 2h4" />
                  </svg>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8.5px] font-semibold uppercase tracking-wider text-neutral-400 font-sans leading-none">
                      DISTANCIA
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-white font-sans uppercase truncate leading-tight mt-0.5">
                      {laps} VUELTAS
                    </span>
                  </div>
                </div>

                {/* 4. Dificultad IA */}
                <div
                  onClick={() => { playUiClick(700); if (activeScreen === 'multiplayer') setActiveOverlay('multiplayer_modal'); else setActiveOverlay('difficulty'); }}
                  className="flex items-center gap-2.5 sm:gap-3 py-1 px-1 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer border-b border-white/[0.08]"
                >
                  <Zap className="w-4 h-4 text-white/90 fill-white/80 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8.5px] font-semibold uppercase tracking-wider text-neutral-400 font-sans leading-none">
                      {activeScreen === 'multiplayer' ? 'SALA MULTIJUGADOR' : 'DIFICULTAD IA'}
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-white font-sans uppercase truncate leading-tight mt-0.5">
                      {activeScreen === 'multiplayer' ? (roomState ? `SALA ${roomState.code}` : '1V1 ONLINE') : difficulty === 'easy' ? 'NOVATO' : difficulty === 'medium' ? 'INTERMEDIO' : 'LEYENDA FIA'}
                    </span>
                  </div>
                </div>

                {/* 5. Piloto & Escudería */}
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('livery'); }}
                  className="flex items-center gap-2.5 sm:gap-3 py-1 px-1 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer border-b border-white/[0.08]"
                >
                  <svg className="w-4 h-4 text-white/90 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4C7.03 4 3 8.03 3 13c0 3.2 1.68 6.01 4.2 7.6.28.18.63.15.88-.07l2.8-2.53H14c4.42 0 8-3.58 8-8 0-4.97-4.03-9-10-9zm2 10H8.5c-.83 0-1.5-.67-1.5-1.5S7.67 11 8.5 11H14c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
                  </svg>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8.5px] font-semibold uppercase tracking-wider text-neutral-400 font-sans leading-none">
                      PILOTO & ESCUDERÍA
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-white font-sans truncate leading-tight mt-0.5">
                      #{carNumber} · {driverDisplayName}
                    </span>
                  </div>
                </div>

                {/* 6. Asistencias */}
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('setup'); }}
                  className="flex items-center gap-2.5 sm:gap-3 py-1 px-1 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 text-white/90 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.5 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
                  </svg>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8.5px] font-semibold uppercase tracking-wider text-neutral-400 font-sans leading-none">
                      ASISTENCIAS
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-300 font-sans truncate leading-tight mt-0.5">
                      TC: {tractionControl ? 'ON' : 'OFF'} · ABS: {absEnabled ? 'ON' : 'OFF'} · Línea: {racingLine ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Start Button at Bottom of Sidebar: Slanted Ferrari-Red Parallelogram */}
              <div className="flex-shrink-0 pt-1.5 sm:pt-2 pb-0.5 relative">
                <button
                  onClick={() => {
                    playUiClick(850);
                    if (activeScreen === 'career') handleLaunchCareer();
                    else if (activeScreen === 'free') handleLaunchFreePractice();
                    else if (activeScreen === 'multiplayer') {
                      if (roomState) handleLaunchCareer();
                      else setActiveOverlay('multiplayer_modal');
                    } else if (activeScreen === 'grand_prix') handleLaunchGrandPrix();
                  }}
                  onMouseEnter={playUiHover}
                  className="relative w-full py-1.5 sm:py-2 px-3 [clip-path:polygon(12px_0,100%_0,calc(100%-12px)_100%,0_100%)] bg-gradient-to-r from-[#b3001b] via-[#ea1d2c] to-[#b3001b] hover:from-[#ea1d2c] hover:via-[#ff2a3a] hover:to-[#ea1d2c] text-white font-black text-xs sm:text-sm tracking-widest uppercase transition-all duration-200 shadow-[0_0_15px_rgba(234,29,44,0.5)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                >
                  <Play className="w-3.5 h-3.5 fill-white text-white shrink-0 ml-0.5" />
                  <span className="font-sans font-black tracking-[0.2em] drop-shadow-md">INICIAR</span>
                </button>
              </div>
            </aside>

            {/* Right: 6 Selector Buttons (3 cols x 2 rows, 60% opacity) */}
            <div className="flex-1 min-h-0 grid grid-cols-3 grid-rows-2 gap-1.5 items-stretch h-full">
              {screen3Selectors.map((btn) => (
                <button
                  key={btn.id}
                  onClick={btn.action}
                  onMouseEnter={playUiHover}
                  className="group relative rounded-xl overflow-hidden text-left cursor-pointer transition-all duration-300 flex flex-col justify-between p-1.5 sm:p-2 select-none border border-white/20 hover:border-red-500/80 hover:shadow-[0_0_14px_rgba(239,68,68,0.4)] hover:scale-[1.01]"
                >
                  {/* Background Image: exactly 60% opacity */}
                  <img
                    src={btn.bg}
                    alt={btn.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 pointer-events-none" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors pointer-events-none" />

                  {/* ONLY BIG LETTERS / TITLE */}
                  <div className="relative z-10 flex items-center justify-between gap-1 w-full">
                    <span className="text-[10px] sm:text-[11px] md:text-xs font-black uppercase tracking-wide text-white drop-shadow truncate font-sans">
                      {btn.title}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-400 transition-colors shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LAYOUT B: PORTRAIT VIEWPORT (Vertical Phone: Minimalist Top Bar + 2x3 Grid) */}
          {/* ========================================================================= */}
          <div className="flex landscape:hidden flex-col gap-1.5 flex-1 min-h-0">
            {/* Top Minimalist Summary Bar (arriba) */}
            <div className="flex-shrink-0 rounded-xl bg-neutral-950/80 backdrop-blur-md border border-white/15 p-1.5 shadow-lg">
              {/* Row 1: Title + Action Button */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-white font-mono">
                    RESUMEN TÉCNICO FIA
                  </span>
                </div>
                <div className="w-32">
                  {activeScreen === 'career' && (
                    <button
                      onClick={handleLaunchCareer}
                      onMouseEnter={playUiHover}
                      className="w-full py-1 px-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-black text-[9px] tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>INICIAR</span>
                    </button>
                  )}
                  {activeScreen === 'free' && (
                    <button
                      onClick={handleLaunchFreePractice}
                      onMouseEnter={playUiHover}
                      className="w-full py-1 px-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-neutral-950 font-black text-[9px] tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>A PISTA</span>
                    </button>
                  )}
                  {activeScreen === 'multiplayer' && (
                    <button
                      onClick={() => { playUiClick(850); setActiveOverlay('multiplayer_modal'); }}
                      onMouseEnter={playUiHover}
                      className="w-full py-1 px-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-neutral-950 font-black text-[9px] tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      <span>{roomState ? 'GESTIONAR' : 'UNIRSE'}</span>
                    </button>
                  )}
                  {activeScreen === 'grand_prix' && (
                    <button
                      onClick={handleLaunchGrandPrix}
                      onMouseEnter={playUiHover}
                      className="w-full py-1 px-2 rounded-lg bg-gradient-to-r from-red-600 via-rose-500 to-red-600 hover:from-red-500 hover:to-rose-400 text-white font-black text-[9px] tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>INICIAR GP</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: 6 Quick Horizontal Summary Chips */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[8px] font-mono">
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('circuit'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer"
                >
                  <span className="text-neutral-400">🏁 </span>
                  <span className="text-white font-bold truncate">{currentCircuit.name}</span>
                </div>
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('tires'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer flex items-center justify-center gap-1"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      startingCompound === 'soft' ? 'bg-red-500' : startingCompound === 'medium' ? 'bg-yellow-400' : 'bg-white'
                    }`}
                  />
                  <span className="text-white font-bold truncate">{startingCompound.toUpperCase()}</span>
                </div>
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('laps'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer"
                >
                  <span className="text-neutral-400">⏱️ </span>
                  <span className="text-amber-300 font-bold">{laps}V</span>
                </div>
                <div
                  onClick={() => { playUiClick(700); if (activeScreen === 'multiplayer') setActiveOverlay('multiplayer_modal'); else setActiveOverlay('difficulty'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer"
                >
                  <span className="text-neutral-400">⚡ </span>
                  <span className="text-white font-bold truncate">{difficulty.toUpperCase()}</span>
                </div>
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('livery'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer"
                >
                  <span className="text-neutral-400">🏎️ </span>
                  <span className="text-white font-bold truncate">#{carNumber} {driverCode}</span>
                </div>
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('setup'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer"
                >
                  <span className="text-neutral-400">🛠️ </span>
                  <span className="text-emerald-400 font-bold">TC:{tractionControl ? 'ON' : 'OFF'}</span>
                </div>
              </div>
            </div>

            {/* 6 Selector Buttons Grid (2 cols x 3 rows, 60% opacity) */}
            <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-3 gap-1.5 items-stretch">
              {screen3Selectors.map((btn) => (
                <button
                  key={btn.id}
                  onClick={btn.action}
                  onMouseEnter={playUiHover}
                  className="group relative rounded-xl overflow-hidden text-left cursor-pointer transition-all duration-300 flex flex-col justify-between p-2 select-none border border-white/20 hover:border-red-500/80 hover:shadow-[0_0_14px_rgba(239,68,68,0.4)] hover:scale-[1.01]"
                >
                  {/* Background Image: exactly 60% opacity */}
                  <img
                    src={btn.bg}
                    alt={btn.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 pointer-events-none" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors pointer-events-none" />

                  {/* ONLY BIG LETTERS / TITLE */}
                  <div className="relative z-10 flex items-center justify-between gap-1 w-full">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide text-white drop-shadow truncate font-sans">
                      {btn.title}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-400 transition-colors shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>
      )}
      </div>

      {/* ========================================================================= */}
      {/* 4. SUPERIMPOSED OVERLAYS (PANTALLAS SUPERPUESTAS)                         */}
      {/* ========================================================================= */}

      {/* OVERLAY 1: TIRES SELECTION STRATEGY ROOM (IDENTICAL TO REFERENCE) */}
      {activeOverlay === 'tires' && (
        <div className="fixed inset-0 z-50 overflow-y-auto sm:overflow-hidden flex flex-col justify-between p-2 sm:p-4 md:p-5 lg:p-7 animate-in fade-in duration-300 select-none bg-black">
          {/* F1 Garage High-Fidelity Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <img
              src="/images/tires/f1_garage_tires_bg.jpg"
              alt="F1 Garage"
              className="w-full h-full object-cover object-center filter brightness-90 contrast-110"
            />
            {/* Atmospheric gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/85" />
            <div className="absolute inset-0 bg-radial from-transparent via-black/35 to-black/90" />
          </div>

          {/* TOP HEADER */}
          <div className="relative z-10 flex items-start justify-between w-full max-w-7xl mx-auto flex-shrink-0 pt-1">
            <div className="flex items-start gap-2 sm:gap-2.5">
              <span className="text-red-600 font-black italic tracking-tighter text-xl sm:text-2xl md:text-3xl leading-none select-none">
                ///
              </span>
              <div>
                <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black italic uppercase tracking-wider text-white font-sans leading-tight">
                  ESTRATEGIA DE NEUMÁTICOS
                </h2>
                <p className="text-[10px] sm:text-xs md:text-sm text-neutral-300 font-normal tracking-wide mt-0.5">
                  Selecciona el compuesto según agarre, temperatura y duración.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              onMouseEnter={playUiHover}
              className="text-neutral-400 hover:text-white hover:scale-110 p-1 sm:p-1.5 transition-all cursor-pointer rounded-lg bg-black/40 hover:bg-white/10 border border-white/10"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* MIDDLE: 3 TIRE CARDS (SIDE BY SIDE) */}
          <div className="relative z-10 w-full max-w-7xl mx-auto my-auto py-1 sm:py-2 md:py-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-5 items-stretch">
              {[
                {
                  id: 'soft' as TireCompoundType,
                  name: 'BLANDO',
                  code: 'C4',
                  codeColor: 'text-red-500',
                  accentColor: 'text-red-500',
                  barBg: 'bg-red-500',
                  topAccent: 'border-t-red-500',
                  selectedBorder: 'border-2 border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.6),inset_0_0_25px_rgba(239,68,68,0.18)] bg-black/85',
                  unselectedBorder: 'border border-neutral-700/80 hover:border-red-500/70 bg-black/75 hover:bg-black/85',
                  image: '/images/tires/tire_soft.png',
                  desc: 'Máximo agarre instantáneo y tracción en curva.',
                  gripPct: '100%',
                  degradLabel: 'ALTA DEGRADACIÓN TÉRMICA',
                  degradFilled: 5,
                  laps: '8–10',
                  tempOptima: '90° – 110°C',
                  tempFilled: 4,
                  wearFilled: 5,
                },
                {
                  id: 'medium' as TireCompoundType,
                  name: 'MEDIO',
                  code: 'C3',
                  codeColor: 'text-yellow-400',
                  accentColor: 'text-yellow-400',
                  barBg: 'bg-yellow-400',
                  topAccent: 'border-t-yellow-400',
                  selectedBorder: 'border-2 border-yellow-400 shadow-[0_0_35px_rgba(250,204,21,0.6),inset_0_0_25px_rgba(250,204,21,0.18)] bg-black/85',
                  unselectedBorder: 'border border-neutral-700/80 hover:border-yellow-400/70 bg-black/75 hover:bg-black/85',
                  image: '/images/tires/tire_medium.png',
                  desc: 'Equilibrio ideal para tandas medias y estrategias estándar.',
                  gripPct: '92%',
                  degradLabel: 'DEGRADACIÓN MEDIA',
                  degradFilled: 3,
                  laps: '18–25',
                  tempOptima: '80° – 100°C',
                  tempFilled: 3,
                  wearFilled: 3,
                },
                {
                  id: 'hard' as TireCompoundType,
                  name: 'DURO',
                  code: 'C2',
                  codeColor: 'text-neutral-300',
                  accentColor: 'text-neutral-300',
                  barBg: 'bg-neutral-200',
                  topAccent: 'border-t-neutral-300',
                  selectedBorder: 'border-2 border-white shadow-[0_0_35px_rgba(255,255,255,0.5),inset_0_0_25px_rgba(255,255,255,0.15)] bg-black/85',
                  unselectedBorder: 'border border-neutral-700/80 hover:border-white/70 bg-black/75 hover:bg-black/85',
                  image: '/images/tires/tire_hard.png',
                  desc: 'Baja degradación para stints largos o una sola parada.',
                  gripPct: '84%',
                  degradLabel: 'MÍNIMA DEGRADACIÓN',
                  degradFilled: 1,
                  laps: '35+',
                  tempOptima: '70° – 90°C',
                  tempFilled: 2,
                  wearFilled: 1,
                },
              ].map((tire) => {
                const isSelected = startingCompound === tire.id;
                return (
                  <div
                    key={tire.id}
                    onClick={() => {
                      playUiClick(750);
                      setStartingCompound(tire.id);
                    }}
                    onMouseEnter={playUiHover}
                    className={`relative rounded-2xl p-3.5 sm:p-4 lg:p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer backdrop-blur-md group ${
                      isSelected ? tire.selectedBorder : tire.unselectedBorder
                    }`}
                  >
                    {/* Top glow accent stripe when not selected */}
                    {!isSelected && (
                      <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    )}

                    {/* Checkmark icon for selected card */}
                    {isSelected && (
                      <div className="absolute top-3.5 right-3.5 z-20">
                        <Check className="w-5 h-5 text-white stroke-[3.5] drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                      </div>
                    )}

                    {/* UPPER HALF: Tire Image (Left) + Compound Info (Right) */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Left Tire Graphic */}
                      <div className="w-[38%] sm:w-[42%] flex items-center justify-center relative flex-shrink-0">
                        <img
                          src={tire.image}
                          alt={tire.name}
                          className="w-full h-auto max-h-28 sm:max-h-36 md:max-h-44 object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Right Specs Column */}
                      <div className="flex-1 min-w-0 pr-1">
                        {/* Title: Compound + Code */}
                        <div className="flex items-baseline gap-1.5 leading-none">
                          <span className="text-lg sm:text-xl lg:text-2xl font-black italic tracking-wide text-white font-sans">
                            {tire.name}
                          </span>
                          <span className={`text-lg sm:text-xl lg:text-2xl font-black italic ${tire.codeColor}`}>
                            {tire.code}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-[10px] sm:text-[11px] text-neutral-300 font-normal leading-snug mt-1 line-clamp-2">
                          {tire.desc}
                        </p>

                        {/* Agarre Stat */}
                        <div className="flex items-baseline gap-1 mt-2 sm:mt-2.5">
                          <span className={`font-black text-xs sm:text-sm ${tire.accentColor}`}>/</span>
                          <span className="text-xs sm:text-sm lg:text-base font-black text-white">{tire.gripPct}</span>
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            AGARRE
                          </span>
                        </div>

                        {/* Degradación Stat */}
                        <div className="mt-1.5 sm:mt-2">
                          <div className="flex items-center gap-1.5">
                            <Thermometer className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${tire.accentColor} shrink-0`} />
                            <span className="text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider text-neutral-300 truncate">
                              {tire.degradLabel}
                            </span>
                          </div>
                          {/* 6-segment degradation bar */}
                          <div className="flex items-center gap-0.5 sm:gap-1 w-full mt-1">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-1 sm:h-1.5 flex-1 rounded-xs -skew-x-12 transition-all ${
                                  i < tire.degradFilled ? tire.barBg : 'bg-neutral-800'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Vueltas Stat */}
                        <div className="flex items-center gap-1.5 mt-2 sm:mt-2.5">
                          <Clock className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${tire.accentColor} shrink-0`} />
                          <span className={`text-xs sm:text-sm font-black tracking-wider ${tire.accentColor}`}>
                            {tire.laps}
                          </span>
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                            VUELTAS
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* LOWER HALF: Telemetry Strip (Temp Óptima & Desgaste) */}
                    <div className="grid grid-cols-2 gap-2 pt-2.5 sm:pt-3 mt-2 sm:mt-2.5 border-t border-white/10">
                      {/* Left: Temp Óptima */}
                      <div className="flex items-start gap-1.5">
                        <Thermometer className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${tire.accentColor} shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[8px] sm:text-[9px] font-semibold text-neutral-400 uppercase tracking-wider">
                            TEMP. ÓPTIMA
                          </div>
                          <div className="text-[11px] sm:text-xs font-black text-white font-mono mt-0.5">
                            {tire.tempOptima}
                          </div>
                          <div className="flex items-center gap-0.5 sm:gap-1 w-full mt-1">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded-xs -skew-x-12 ${
                                  i < tire.tempFilled ? tire.barBg : 'bg-neutral-800'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Desgaste */}
                      <div className="flex items-start gap-1.5">
                        <svg
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${tire.accentColor} shrink-0 mt-0.5`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" strokeDasharray="4 2" />
                          <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.5" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="text-[8px] sm:text-[9px] font-semibold text-neutral-400 uppercase tracking-wider">
                            DESGASTE
                          </div>
                          <div className="flex items-center gap-0.5 sm:gap-1 w-full mt-3 sm:mt-3.5">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded-xs -skew-x-12 ${
                                  i < tire.wearFilled ? tire.barBg : 'bg-neutral-800'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTTOM ACTION BAR */}
          <div className="relative z-10 flex items-center justify-between w-full max-w-7xl mx-auto flex-shrink-0 pb-1">
            {/* Left racing hashes */}
            <div className="hidden sm:flex items-center gap-1.5 opacity-80 select-none">
              <div className="w-5 h-1 bg-red-600 -skew-x-12" />
              <div className="w-2.5 h-1 bg-red-600 -skew-x-12" />
              <div className="w-1.5 h-1 bg-red-600 -skew-x-12" />
            </div>

            {/* Confirm Button */}
            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              onMouseEnter={playUiHover}
              className="relative group mx-auto px-8 sm:px-14 md:px-16 py-2.5 sm:py-3.5 bg-black/90 hover:bg-neutral-900 border-2 border-red-500 rounded-xl sm:rounded-2xl shadow-[0_0_25px_rgba(239,68,68,0.65)] hover:shadow-[0_0_40px_rgba(239,68,68,0.95)] transition-all cursor-pointer flex items-center justify-center gap-3 overflow-hidden active:scale-98"
            >
              <span className="text-xs sm:text-sm md:text-base font-black italic uppercase tracking-[0.18em] text-white font-mono group-hover:tracking-[0.24em] transition-all">
                CONFIRMAR NEUMÁTICOS
              </span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 group-hover:translate-x-1.5 transition-transform" />
            </button>

            {/* Right racing hashes */}
            <div className="hidden sm:flex items-center gap-1.5 opacity-80 select-none justify-end">
              <div className="w-1.5 h-1 bg-red-600 -skew-x-12" />
              <div className="w-2.5 h-1 bg-red-600 -skew-x-12" />
              <div className="w-5 h-1 bg-red-600 -skew-x-12" />
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 2: CIRCUIT SELECTION MODAL (IDENTICAL TO REFERENCE) */}
      {activeOverlay === 'circuit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-300 select-none bg-black">
          {/* High-Fidelity Circuit Selection Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <img
              src="/images/circuits/f1_circuit_selector_bg.jpg"
              alt="F1 Circuit Background"
              className="w-full h-full object-cover object-center filter brightness-90 contrast-110"
            />
            {/* Atmospheric gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/85" />
            <div className="absolute inset-0 bg-radial from-transparent via-black/35 to-black/90" />
          </div>

          {/* Futuristic Floating HUD Panel */}
          <div className="relative z-10 w-full max-w-3xl lg:max-w-4xl rounded-2xl md:rounded-3xl bg-neutral-950/85 backdrop-blur-xl border border-white/15 p-4 sm:p-6 md:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col justify-between my-auto">
            {/* Panel Header */}
            <div className="flex items-start justify-between w-full border-b border-white/10 pb-3 sm:pb-4 flex-shrink-0">
              <div className="flex items-start">
                <div className="w-1.5 sm:w-2 h-6 sm:h-7 bg-red-600 -skew-x-12 mr-2.5 sm:mr-3 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-base sm:text-xl md:text-2xl font-black italic uppercase tracking-wider text-white font-sans leading-tight">
                    SELECCIÓN DE CIRCUITO FIA
                  </h2>
                  <p className="text-[10px] sm:text-xs md:text-sm text-neutral-300 font-normal tracking-wide mt-0.5">
                    Elige el trazado de competición
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                onMouseEnter={playUiHover}
                className="text-neutral-400 hover:text-white hover:scale-110 p-1 sm:p-1.5 transition-all cursor-pointer rounded-lg bg-black/40 hover:bg-white/10 border border-white/10"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* 3 Circuit Cards (Side by Side) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5 my-4 sm:my-5 items-stretch">
              {[
                {
                  id: 'square_apex' as CircuitId,
                  name: 'CIRCUIT 1',
                  specs: '0.97 KM  •  4 Cur...',
                  speedLabel: 'V. Máx.: 345 km/h',
                  speedColor: 'text-red-500',
                  image: '/images/circuits/circuit_1.png',
                  flag: (
                    <svg className="w-6 h-4 sm:w-7 sm:h-4.5 rounded-xs shadow-sm overflow-hidden" viewBox="0 0 28 20" fill="none">
                      <rect width="28" height="10" fill="#EF4444" />
                      <rect y="10" width="28" height="10" fill="#FFFFFF" />
                      <rect width="28" height="20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
                    </svg>
                  ),
                },
                {
                  id: 'speedway_gp' as CircuitId,
                  name: 'CIRCUIT 2',
                  specs: '2.17 KM  •  8 Cur...',
                  speedLabel: 'V. Máx.: 358 km/h',
                  speedColor: 'text-amber-400',
                  image: '/images/circuits/circuit_2.png',
                  flag: (
                    <svg className="w-6 h-4 sm:w-7 sm:h-4.5 rounded-xs shadow-sm overflow-hidden" viewBox="0 0 28 20" fill="none">
                      <rect width="9.33" height="20" fill="#009246" />
                      <rect x="9.33" width="9.33" height="20" fill="#FFFFFF" />
                      <rect x="18.66" width="9.34" height="20" fill="#CE2B37" />
                      <rect width="28" height="20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
                    </svg>
                  ),
                },
                {
                  id: 'singapore_marina' as CircuitId,
                  name: 'MARINA BAY',
                  specs: '4.93 KM  •  19 Cu...',
                  speedLabel: 'V. Máx.: 355 km/h',
                  speedColor: 'text-amber-400',
                  image: '/images/circuits/circuit_3.png',
                  flag: (
                    <svg className="w-6 h-4 sm:w-7 sm:h-4.5 rounded-xs shadow-sm overflow-hidden" viewBox="0 0 28 20" fill="none">
                      <rect width="28" height="10" fill="#ED2939" />
                      <rect y="10" width="28" height="10" fill="#FFFFFF" />
                      <path d="M5.5 3a3.5 3.5 0 0 0 0 6 3 3 0 0 1 0-6z" fill="#FFFFFF" />
                      <circle cx="8" cy="4" r="0.6" fill="#FFFFFF" />
                      <circle cx="9" cy="5" r="0.6" fill="#FFFFFF" />
                      <circle cx="9" cy="7" r="0.6" fill="#FFFFFF" />
                      <circle cx="8" cy="8" r="0.6" fill="#FFFFFF" />
                      <circle cx="7" cy="6" r="0.6" fill="#FFFFFF" />
                      <rect width="28" height="20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
                    </svg>
                  ),
                },
              ].map((c) => {
                const isSelected = selectedCircuit === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCircuitLocal(c.id)}
                    onMouseEnter={playUiHover}
                    className={`relative rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer backdrop-blur-md group ${
                      isSelected
                        ? 'border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.55),inset_0_0_15px_rgba(239,68,68,0.18)] bg-black/90'
                        : 'border border-neutral-700/80 hover:border-neutral-500/80 bg-black/65 hover:bg-black/80'
                    }`}
                  >
                    {/* Circuit Track Preview Image */}
                    <div className="relative w-full aspect-[16/10] rounded-lg sm:rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
                      <img
                        src={c.image}
                        alt={c.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Red Checkmark Badge when Selected */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-red-500 bg-red-600/30 flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.8)] backdrop-blur-xs">
                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 stroke-[3.5]" />
                        </div>
                      )}
                    </div>

                    {/* Circuit Details */}
                    <div className="mt-2.5 sm:mt-3 flex-1 flex flex-col justify-between">
                      {/* Flag and Name */}
                      <div>
                        <div className="flex items-center gap-2">
                          {c.flag}
                        </div>
                        <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-sans mt-1.5 leading-tight">
                          {c.name}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-neutral-400 font-mono mt-0.5">
                          {c.specs}
                        </p>
                      </div>

                      {/* Speed Stat */}
                      <div className="flex items-center gap-1.5 mt-2.5 sm:mt-3 pt-2 border-t border-white/10">
                        <Gauge className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${c.speedColor} shrink-0`} />
                        <span className={`text-[10px] sm:text-xs font-bold font-mono tracking-wide ${c.speedColor}`}>
                          {c.speedLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Action: Centered Futuristic Confirm Button */}
            <div className="flex items-center justify-center w-full pt-1 sm:pt-2 flex-shrink-0">
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                onMouseEnter={playUiHover}
                className="relative group px-8 sm:px-14 md:px-16 py-2.5 sm:py-3.5 bg-black/90 hover:bg-neutral-900 border-2 border-red-500 rounded-xl sm:rounded-2xl shadow-[0_0_25px_rgba(239,68,68,0.65)] hover:shadow-[0_0_40px_rgba(239,68,68,0.95)] transition-all cursor-pointer flex items-center justify-center gap-3 overflow-hidden active:scale-98"
              >
                <span className="text-xs sm:text-sm md:text-base font-black italic uppercase tracking-[0.18em] text-white font-mono group-hover:tracking-[0.24em] transition-all">
                  CONFIRMAR CIRCUITO
                </span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 3: LAPS & DISTANCE SELECTION (IDENTICAL TO REFERENCE) */}
      {activeOverlay === 'laps' && (
        <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-between p-3 sm:p-5 md:p-6 lg:p-8 select-none bg-black animate-in fade-in duration-300">
          {/* High-Fidelity F1 Pit Lane Atmosphere Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <img
              src="/images/f1_laps_bg.jpg"
              alt="F1 Pit Lane Atmosphere"
              className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
            />
            {/* Atmospheric subtle vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50 pointer-events-none" />
          </div>

          {/* Top Bar: Slanted Emblem + Title on Left, Season/Session Meta on Right */}
          <div className="relative z-10 flex items-start justify-between w-full flex-shrink-0">
            {/* Left Header with Golden F1 Emblem & Title */}
            <div className="flex items-center">
              <div className="relative flex-shrink-0">
                <img
                  src="/images/laps_f1_mark.png"
                  alt="F1 Mark"
                  className="h-9 sm:h-12 md:h-14 w-auto object-contain filter drop-shadow-[0_0_15px_rgba(245,158,11,0.7)]"
                />
              </div>

              {/* Vertical Amber Divider */}
              <div className="w-[2px] h-8 sm:h-10 md:h-12 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] mx-3 sm:mx-4.5 shrink-0" />

              <div>
                <div className="text-[10px] sm:text-xs md:text-sm font-black italic uppercase tracking-[0.16em] text-neutral-300 font-sans leading-none">
                  DURACIÓN DEL
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black italic uppercase tracking-[0.08em] text-amber-400 font-sans leading-none mt-1 drop-shadow-[0_0_16px_rgba(245,158,11,0.6)]">
                  GRAN PREMIO
                </h1>
                <p className="text-[9px] sm:text-[11px] md:text-xs text-neutral-400 font-normal tracking-wide mt-1">
                  Selecciona el número de vueltas de la carrera
                </p>
              </div>
            </div>

            {/* Right Meta Header: Temporada 2026 / Gran Premio / Configuración */}
            <div className="hidden sm:flex items-center gap-3 md:gap-4 flex-shrink-0">
              <div className="text-right font-mono">
                <div className="text-[8px] sm:text-[9px] font-bold text-neutral-400 uppercase tracking-widest leading-tight">
                  TEMPORADA 2026
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-neutral-300 uppercase tracking-wider leading-tight">
                  GRAN PREMIO
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-amber-400 uppercase tracking-wider leading-tight">
                  CARRERA / <span className="text-neutral-400">CONFIGURACIÓN</span>
                </div>
              </div>
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-4 sm:h-5 bg-amber-400 -skew-x-12 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                <div className="w-1.5 h-4 sm:h-5 bg-amber-400 -skew-x-12 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              </div>
            </div>
          </div>

          {/* Middle Body: 3 Stacked Chamfered Cards on the Left Side */}
          <div className="relative z-10 w-full max-w-xl md:max-w-2xl lg:max-w-[720px] flex flex-col justify-center gap-2.5 sm:gap-3.5 md:gap-4 my-auto py-2">
            {[
              {
                val: 9 as RaceLapOption,
                numStr: '09',
                title: 'SPRINT RÁPIDO',
                desc: 'Carrera corta de alta intensidad',
                barsFilled: 3,
                timeStr: '2:31',
              },
              {
                val: 20 as RaceLapOption,
                numStr: '20',
                title: 'GRAN PREMIO',
                desc: 'Estrategia completa y gestión de neumáticos',
                barsFilled: 5,
                timeStr: '5:36',
              },
              {
                val: 50 as RaceLapOption,
                numStr: '50',
                title: 'RESISTENCIA',
                desc: 'Carrera larga, desgaste y estrategia avanzada',
                barsFilled: 8,
                timeStr: '14:00',
              },
            ].map((item) => {
              const isSelected = laps === item.val;
              return (
                <div
                  key={item.val}
                  onClick={() => {
                    playUiClick(700);
                    setLaps(item.val);
                  }}
                  onMouseEnter={playUiHover}
                  className={`relative group transition-all duration-200 cursor-pointer flex items-center justify-between px-4 sm:px-6 md:px-7 py-3 sm:py-3.5 md:py-4 backdrop-blur-md active:scale-99 ${
                    isSelected
                      ? 'border-2 border-amber-400 bg-neutral-950/85 shadow-[0_0_30px_rgba(245,158,11,0.5),inset_0_0_20px_rgba(245,158,11,0.14)]'
                      : 'border border-slate-700/60 hover:border-slate-500/80 bg-neutral-950/65 hover:bg-neutral-900/75 shadow-[0_10px_30px_rgba(0,0,0,0.6)]'
                  }`}
                  style={{
                    clipPath:
                      'polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)',
                  }}
                >
                  {/* Left Block: Large Number + VUELTAS */}
                  <div className="flex flex-col items-center justify-center min-w-[70px] sm:min-w-[90px] md:min-w-[100px] shrink-0">
                    <span
                      className={`text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tighter leading-none font-sans ${
                        isSelected
                          ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                          : 'text-white'
                      }`}
                    >
                      {item.numStr}
                    </span>
                    <span
                      className={`text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-[0.2em] font-mono mt-1 ${
                        isSelected ? 'text-amber-400' : 'text-neutral-300'
                      }`}
                    >
                      VUELTAS
                    </span>
                  </div>

                  {/* Vertical Divider */}
                  <div className="w-[1px] h-10 sm:h-12 bg-white/10 mx-3 sm:mx-5 shrink-0" />

                  {/* Center Content: Title, Desc, Estimated Time */}
                  <div className="flex-1 min-w-0 pr-2">
                    <h3
                      className={`text-xs sm:text-sm md:text-base font-black uppercase tracking-wider font-sans leading-tight ${
                        isSelected ? 'text-amber-400' : 'text-white'
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-neutral-300 font-normal tracking-wide mt-0.5 truncate leading-tight">
                      {item.desc}
                    </p>

                    {/* Estimated Time Row with Clock */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-2 pt-1 border-t border-white/5">
                      <Clock
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                          isSelected ? 'text-amber-400' : 'text-neutral-400'
                        }`}
                      />
                      <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-wider font-mono text-neutral-400">
                        TIEMPO ESTIMADO
                      </span>
                      <span
                        className={`text-[10px] sm:text-xs md:text-sm font-bold font-mono tracking-wide ${
                          isSelected ? 'text-amber-400 font-black' : 'text-white'
                        }`}
                      >
                        {item.timeStr}
                      </span>
                    </div>
                  </div>

                  {/* Right Block: Slanted Progress Bars + Radio / Check Circle */}
                  <div className="flex items-center gap-3 sm:gap-5 shrink-0 pl-1">
                    {/* 8 Segmented Slanted Bars */}
                    <div className="hidden xs:flex items-center gap-1 select-none">
                      {Array.from({ length: 8 }).map((_, barIdx) => {
                        const isBarFilled = barIdx < item.barsFilled;
                        return (
                          <div
                            key={barIdx}
                            className={`w-1.5 sm:w-2 md:w-2.5 h-2.5 sm:h-3 md:h-3.5 -skew-x-12 transition-all duration-300 ${
                              isBarFilled
                                ? isSelected
                                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                                  : 'bg-slate-300'
                                : 'bg-neutral-800/90'
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Radio Checkmark Circle Badge */}
                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full border-2 border-amber-400 bg-amber-400/20 flex items-center justify-center shadow-[0_0_12px_rgba(251,191,36,0.8)] text-amber-400 backdrop-blur-xs">
                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3.5]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full border-2 border-slate-500/80 bg-transparent" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Bar: '< ATRÁS' Button on Left, Futuristic Beveled 'CONFIRMAR DURACIÓN →' on Right */}
          <div className="relative z-10 flex items-center justify-between w-full pt-1 flex-shrink-0">
            {/* Back Button on Left */}
            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              onMouseEnter={playUiHover}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-widest text-neutral-400 hover:text-amber-400 transition-colors font-mono cursor-pointer active:scale-95 py-2 px-1"
            >
              <ChevronLeft className="w-4 h-4 text-amber-400" />
              <span>ATRÁS</span>
            </button>

            {/* Futuristic Confirm Duration Button on Right */}
            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              onMouseEnter={playUiHover}
              className="group relative flex items-center gap-2.5 sm:gap-4 px-6 sm:px-10 md:px-12 py-2 sm:py-2.5 md:py-3 bg-black/90 hover:bg-neutral-900 border-2 border-amber-400 rounded-md shadow-[0_0_20px_rgba(245,158,11,0.55)] hover:shadow-[0_0_35px_rgba(245,158,11,0.85)] transition-all cursor-pointer active:scale-98 overflow-hidden"
              style={{
                clipPath:
                  'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
              }}
            >
              {/* Slanted warning stripes on the left */}
              <div className="flex items-center gap-1 pr-2.5 sm:pr-3.5 border-r border-amber-400/40">
                <div className="w-2 sm:w-2.5 h-3 sm:h-3.5 bg-amber-400 -skew-x-12" />
                <div className="w-2 sm:w-2.5 h-3 sm:h-3.5 bg-amber-400/80 -skew-x-12" />
                <div className="w-2 sm:w-2.5 h-3 sm:h-3.5 bg-amber-400/50 -skew-x-12" />
                <div className="w-2 sm:w-2.5 h-3 sm:h-3.5 bg-amber-400/25 -skew-x-12" />
              </div>

              <span className="text-xs sm:text-sm md:text-base font-black italic uppercase tracking-[0.16em] text-white font-mono group-hover:tracking-[0.2em] transition-all">
                CONFIRMAR DURACIÓN
              </span>

              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 4: AI DIFFICULTY MODAL */}
      {activeOverlay === 'difficulty' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl sm:rounded-3xl bg-neutral-900 border border-white/20 p-3 sm:p-5 shadow-2xl relative max-h-[96vh] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-2.5 border-b border-white/10 pb-1.5 sm:pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-mono leading-none">
                    NIVEL DE COMPETITIVIDAD (IA)
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-neutral-400 mt-0.5">Ajusta la agresividad y ritmo de los pilotos rivales</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1 sm:p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="space-y-1.5 sm:space-y-2 font-mono flex-1 min-h-0 flex flex-col justify-between py-0.5">
              {[
                { id: 'easy' as RaceDifficulty, name: 'NOVATO', desc: 'Ritmo accesible y permisivo. Frenadas anticipadas y trazadas suaves.' },
                { id: 'medium' as RaceDifficulty, name: 'INTERMEDIO', desc: 'Competitivo equilibrado. Ritmo consistente y adelantamientos calculados.' },
                { id: 'hard' as RaceDifficulty, name: 'LEYENDA FIA', desc: 'Máxima agresividad. Frenadas al límite, defensa férrea y ritmo récord.' },
              ].map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => {
                    playUiClick(700);
                    setDifficulty(diff.id);
                  }}
                  onMouseEnter={playUiHover}
                  className={`w-full py-1.5 px-2.5 sm:py-2.5 sm:px-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    difficulty === diff.id
                      ? 'bg-red-600/25 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-neutral-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-black leading-tight">{diff.name}</div>
                    <div className="text-[9.5px] sm:text-[11px] text-neutral-300 mt-0.5 leading-tight truncate">{diff.desc}</div>
                  </div>
                  {difficulty === diff.id && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0 ml-2" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              className="w-full mt-2 sm:mt-2.5 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer font-mono flex-shrink-0"
            >
              CONFIRMAR DIFICULTAD
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 5: LIVERY & DRIVER IDENTITY MODAL */}
      {activeOverlay === 'livery' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl sm:rounded-3xl bg-neutral-900 border border-white/20 p-3 sm:p-5 shadow-2xl relative max-h-[96vh] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-2.5 border-b border-white/10 pb-1.5 sm:pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-mono leading-none">
                    IDENTIDAD DE ESCUDERÍA Y PILOTO
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-neutral-400 mt-0.5">Personaliza nombre, dorsal y colores del monoplaza</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1 sm:p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="space-y-2 flex-1 min-h-0 flex flex-col justify-between py-0.5">
              {/* Row 1: Pilot Name + Dorsal + Team Name side-by-side */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <label className="text-[9px] font-mono text-neutral-400 block mb-0.5 uppercase">Piloto</label>
                  <input
                    type="text"
                    value={driverDisplayName}
                    onChange={(e) => setDriverDisplayName(e.target.value)}
                    maxLength={20}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-xs font-bold font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-mono text-neutral-400 block mb-0.5 uppercase">Dorsal</label>
                  <input
                    type="text"
                    value={carNumber}
                    onChange={(e) => setCarNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                    maxLength={2}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-xs font-bold font-mono text-center focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-5">
                  <label className="text-[9px] font-mono text-neutral-400 block mb-0.5 uppercase">Escudería</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    maxLength={25}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-xs font-bold font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: 6 Quick Preset Colors in a single row */}
              <div>
                <label className="text-[9px] font-mono text-neutral-400 block mb-1 uppercase">Paletas de Colores Oficiales</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[
                    { name: 'Red Bull', p: '#040814', s: '#cc0022', a: '#fec008' },
                    { name: 'Ferrari', p: '#dc2626', s: '#facc15', a: '#ffffff' },
                    { name: 'Mercedes', p: '#94a3b8', s: '#06b6d4', a: '#10b981' },
                    { name: 'McLaren', p: '#f97316', s: '#0284c7', a: '#ffffff' },
                    { name: 'Aston', p: '#064e3b', s: '#10b981', a: '#fbbf24' },
                    { name: 'Stealth', p: '#18181b', s: '#d97706', a: '#fbbf24' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        playUiClick(700);
                        setPrimaryColor(preset.p);
                        setSecondaryColor(preset.s);
                        setAccentColor(preset.a);
                        setTeamName(preset.name);
                      }}
                      className="p-1 sm:p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/30 text-center transition-all cursor-pointer"
                    >
                      <div className="flex justify-center gap-1 mb-0.5">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: preset.p }} />
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: preset.s }} />
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: preset.a }} />
                      </div>
                      <span className="text-[8.5px] font-bold text-neutral-300 block truncate leading-none">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {onOpenLiveryStudio && (
                <button
                  onClick={() => {
                    playUiClick(750);
                    setActiveOverlay('none');
                    onOpenLiveryStudio();
                  }}
                  className="w-full py-1.5 sm:py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>ABRIR ESTUDIO COMPLETO DE LIBREAS Y PATROCINADORES</span>
                </button>
              )}
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              className="w-full mt-2 sm:mt-2.5 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer font-mono flex-shrink-0"
            >
              GUARDAR Y CONFIRMAR
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 6: ASSISTS & SETUP MODAL */}
      {activeOverlay === 'setup' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl sm:rounded-3xl bg-neutral-900 border border-white/20 p-3 sm:p-5 shadow-2xl relative max-h-[96vh] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-2.5 border-b border-white/10 pb-1.5 sm:pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-mono leading-none">
                    AYUDAS DE CONDUCCIÓN Y CÁMARA
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-neutral-400 mt-0.5">Calibra las asistencias electrónicas de tu monoplaza</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1 sm:p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="space-y-2 flex-1 min-h-0 flex flex-col justify-between py-0.5 font-mono text-xs">
              {/* Assists in 3 columns */}
              <div className="grid grid-cols-3 gap-2">
                {/* TC */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-white text-[11px] sm:text-xs">Control Tracción</div>
                    <div className="text-[8.5px] text-neutral-400 leading-tight mt-0.5">Evita trompos al acelerar</div>
                  </div>
                  <button
                    onClick={() => {
                      playUiClick(700);
                      setTractionControl(!tractionControl);
                    }}
                    className={`mt-2 py-1 px-2 rounded-lg font-bold text-[10px] cursor-pointer transition-colors w-full text-center ${
                      tractionControl ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {tractionControl ? 'TC: ON' : 'TC: OFF'}
                  </button>
                </div>

                {/* ABS */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-white text-[11px] sm:text-xs">Frenos ABS</div>
                    <div className="text-[8.5px] text-neutral-400 leading-tight mt-0.5">Impide bloqueo de ruedas</div>
                  </div>
                  <button
                    onClick={() => {
                      playUiClick(700);
                      setAbsEnabled(!absEnabled);
                    }}
                    className={`mt-2 py-1 px-2 rounded-lg font-bold text-[10px] cursor-pointer transition-colors w-full text-center ${
                      absEnabled ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {absEnabled ? 'ABS: ON' : 'ABS: OFF'}
                  </button>
                </div>

                {/* Racing Line */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-white text-[11px] sm:text-xs">Trazada Óptima</div>
                    <div className="text-[8.5px] text-neutral-400 leading-tight mt-0.5">Línea visual en pista</div>
                  </div>
                  <button
                    onClick={() => {
                      playUiClick(700);
                      setRacingLine(!racingLine);
                    }}
                    className={`mt-2 py-1 px-2 rounded-lg font-bold text-[10px] cursor-pointer transition-colors w-full text-center ${
                      racingLine ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {racingLine ? 'LÍNEA: ON' : 'LÍNEA: OFF'}
                  </button>
                </div>
              </div>

              {/* Camera Mode */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="font-bold text-white text-[11px] mb-1.5">Perspectiva de Cámara Principal</div>
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                  {[
                    { id: 'chase' as CameraViewMode, name: 'TERCERA' },
                    { id: 'bumper' as CameraViewMode, name: 'MORRO' },
                    { id: 'hood' as CameraViewMode, name: 'CAPÓ' },
                    { id: 'orbit' as CameraViewMode, name: 'ÓRBITA' },
                  ].map((cm) => (
                    <button
                      key={cm.id}
                      onClick={() => {
                        playUiClick(700);
                        setCameraMode(cm.id);
                      }}
                      className={`py-1.5 rounded-lg border transition-all cursor-pointer font-bold ${
                        cameraMode === cm.id
                          ? 'bg-cyan-500/25 border-cyan-400 text-white'
                          : 'bg-white/5 border-white/10 text-neutral-400'
                      }`}
                    >
                      {cm.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              className="w-full mt-2 sm:mt-2.5 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer font-mono flex-shrink-0"
            >
              CONFIRMAR REGLAJES
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 7: MULTIPLAYER LOBBY MODAL */}
      {activeOverlay === 'multiplayer_modal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl sm:rounded-3xl bg-neutral-900 border border-white/20 p-3 sm:p-5 shadow-2xl relative max-h-[96vh] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-2.5 border-b border-white/10 pb-1.5 sm:pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-mono leading-none">
                    LOBBY MULTIJUGADOR 1V1
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-neutral-400 mt-0.5">Servidor en tiempo real con WebSocket dedicado</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1 sm:p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2 mb-2 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-[10px] flex items-center gap-1.5 flex-shrink-0">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                <span className="truncate">{errorMessage}</span>
              </div>
            )}

            {!roomState ? (
              <div className="space-y-2 flex-1 min-h-0 flex flex-col justify-between py-0.5">
                <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10 font-mono text-[11px]">
                  <button
                    onClick={() => setMpTab('create')}
                    className={`flex-1 py-1.5 rounded-md font-bold transition-all ${
                      mpTab === 'create' ? 'bg-emerald-500 text-black' : 'text-neutral-400'
                    }`}
                  >
                    CREAR SALA
                  </button>
                  <button
                    onClick={() => setMpTab('join')}
                    className={`flex-1 py-1.5 rounded-md font-bold transition-all ${
                      mpTab === 'join' ? 'bg-emerald-500 text-black' : 'text-neutral-400'
                    }`}
                  >
                    UNIRSE CON CÓDIGO
                  </button>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-neutral-400 block mb-0.5 uppercase">Tu Alias de Piloto</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={16}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-xs font-bold font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {mpTab === 'create' ? (
                  <div>
                    <label className="text-[9px] font-mono text-neutral-400 block mb-0.5 uppercase">Vueltas del Duelo</label>
                    <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                      {[3, 5, 10].map((v) => (
                        <button
                          key={v}
                          onClick={() => setMpLaps(v)}
                          className={`py-1.5 rounded-lg border font-bold transition-all ${
                            mpLaps === v
                              ? 'bg-emerald-500/30 border-emerald-400 text-white'
                              : 'bg-white/5 border-white/10 text-neutral-400'
                          }`}
                        >
                          {v} VUELTAS
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[9px] font-mono text-neutral-400 block mb-0.5 uppercase">Código de Sala (4 Letras)</label>
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                      placeholder="Ej. ABCD"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-xs font-black font-mono tracking-widest text-center focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {mpTab === 'create' ? (
                  <button
                    onClick={handleCreateRoomAction}
                    disabled={isConnecting}
                    className="w-full mt-1.5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 font-mono shadow-md flex-shrink-0"
                  >
                    {isConnecting ? 'CONECTANDO...' : 'CREAR SALA Y ESPERAR RIVAL'}
                  </button>
                ) : (
                  <button
                    onClick={handleJoinRoomAction}
                    disabled={isConnecting || !joinCodeInput.trim()}
                    className="w-full mt-1.5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 font-mono shadow-md flex-shrink-0"
                  >
                    {isConnecting ? 'CONECTANDO...' : 'UNIRSE A LA SALA'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2 flex-1 min-h-0 flex flex-col justify-between py-0.5 font-mono text-xs">
                {/* Active Room Code Card */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-black/60 border border-emerald-500/40 text-center flex-shrink-0">
                  <span className="text-[9px] text-neutral-400 uppercase tracking-widest block leading-none">Código de Invitación</span>
                  <div className="text-xl font-black text-emerald-400 tracking-widest mt-0.5">{roomState.code}</div>
                  <button
                    onClick={copyRoomCode}
                    className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 text-[9px] font-bold cursor-pointer transition-colors"
                  >
                    <Copy className="w-2.5 h-2.5" />
                    <span>{isCopied ? '¡COPIADO!' : 'COPIAR CÓDIGO'}</span>
                  </button>
                </div>

                {/* Slot P1 & P2 */}
                <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-[8.5px] text-neutral-400 block">PILOTO 1 (HOST)</span>
                    <span className="font-bold text-white text-[11px] truncate block leading-tight">{roomState.players.p1?.name || 'Esperando...'}</span>
                    <span className={`text-[9px] font-bold ${roomState.players.p1?.isReady ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {roomState.players.p1?.isReady ? '✓ LISTO' : 'NO PREPARADO'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-[8.5px] text-neutral-400 block">PILOTO 2 (RIVAL)</span>
                    <span className="font-bold text-white text-[11px] truncate block leading-tight">{roomState.players.p2?.name || 'Esperando rival...'}</span>
                    <span className={`text-[9px] font-bold ${roomState.players.p2?.isReady ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {roomState.players.p2?.isReady ? '✓ LISTO' : 'NO PREPARADO'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={handleToggleReady}
                    className={`flex-1 py-2 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
                      isReady ? 'bg-emerald-500 text-black' : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                  >
                    {isReady ? '✓ LISTO' : 'MARCAR LISTO'}
                  </button>
                  <button
                    onClick={onLeaveRoom}
                    className="px-3 py-2 rounded-xl bg-red-600/30 border border-red-500/40 text-red-300 hover:bg-red-600/50 font-bold text-xs cursor-pointer transition-colors"
                  >
                    SALIR
                  </button>
                </div>

                {playerId === 'p1' && (
                  <button
                    onClick={() => {
                      playUiClick(950);
                      onStartMultiplayerRace();
                    }}
                    disabled={!roomState.players.p1?.isReady || !roomState.players.p2?.isReady}
                    className="w-full py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 disabled:opacity-40 text-black font-black uppercase tracking-wider text-xs cursor-pointer shadow-md flex-shrink-0"
                  >
                    INICIAR DUELO (AMBOS LISTOS)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* OVERLAY 8: CONTROLS GUIDE MODAL */}
      {showControlsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl sm:rounded-3xl bg-neutral-900 border border-white/20 p-3 sm:p-5 shadow-2xl relative max-h-[96vh] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-2.5 border-b border-white/10 pb-1.5 sm:pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-mono leading-none">
                  GUÍA DE CONTROLES
                </h3>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setShowControlsModal(false);
                }}
                className="p-1 sm:p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs flex-1 min-h-0 py-0.5">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between">
                <span className="font-bold text-white text-[11px]">Acelerar / Freno</span>
                <span className="font-mono text-amber-400 bg-white/10 px-1.5 py-0.5 rounded text-[9.5px] mt-1 truncate">W / S · ↑ / ↓</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between">
                <span className="font-bold text-white text-[11px]">Girar Dirección</span>
                <span className="font-mono text-amber-400 bg-white/10 px-1.5 py-0.5 rounded text-[9.5px] mt-1 truncate">A / D · ← / →</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between">
                <span className="font-bold text-white text-[11px]">Freno de Mano</span>
                <span className="font-mono text-amber-400 bg-white/10 px-1.5 py-0.5 rounded text-[9.5px] mt-1 truncate">Espacio (Space)</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between">
                <span className="font-bold text-white text-[11px]">Cambiar Cámara</span>
                <span className="font-mono text-cyan-400 bg-white/10 px-1.5 py-0.5 rounded text-[9.5px] mt-1 truncate">Tecla C</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between">
                <span className="font-bold text-white text-[11px]">Pausa / Menú</span>
                <span className="font-mono text-red-400 bg-white/10 px-1.5 py-0.5 rounded text-[9.5px] mt-1 truncate">Escape (ESC)</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between">
                <span className="font-bold text-white text-[11px]">Pantalla Completa</span>
                <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded text-[9.5px] mt-1 truncate">Tecla F</span>
              </div>
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setShowControlsModal(false);
              }}
              className="w-full mt-2 sm:mt-2.5 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer font-mono flex-shrink-0"
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
