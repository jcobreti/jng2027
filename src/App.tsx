import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, Info, Loader2 } from 'lucide-react';
import { POKEMON_DATA, type PokemonLine } from './constants';

interface CardState {
  id: string;
  pokemon: PokemonLine;
  stage: 0 | 1 | 2 | 3; // 0: hidden, 1: etapa1, 2: etapa2, 3: etapa3
  borderColor: string;
}

const COLORS = [
  '#2980EF', // Blue
  '#3FA129', // Green
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#795548', // Brown
  '#FF9800', // Orange (Last column)
];

export default function App() {
  const [cards, setCards] = useState<CardState[]>([]);
  const [evolutionCount, setEvolutionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const initGame = () => {
    const shuffled = [...POKEMON_DATA].sort(() => Math.random() - 0.5);
    // We only need 24 for a 6x4 grid
    const selected = shuffled.slice(0, 24);
    
    const initialCards: CardState[] = selected.map((pokemon, index) => ({
      id: `card-${index}`,
      pokemon,
      stage: 0,
      borderColor: COLORS[index % 6],
    }));
    
    setCards(initialCards);
    setEvolutionCount(0);
  };

  useEffect(() => {
    // Esperamos a que los scripts de imágenes se carguen
    const checkImages = () => {
      const win = window as any;
      if (win.POKEMON_IMAGES && Object.keys(win.POKEMON_IMAGES).length > 0) {
        initGame();
        setIsLoading(false);
      } else {
        setTimeout(checkImages, 100);
      }
    };
    
    checkImages();
  }, []);

  const handleCardClick = (index: number) => {
    const card = cards[index];
    if (card.stage === 3) return; // Already at max evolution

    const newCards = [...cards];
    const nextStage = (card.stage + 1) as 1 | 2 | 3;
    newCards[index] = { ...card, stage: nextStage };
    
    setCards(newCards);
    setEvolutionCount(prev => prev + 1);
  };

  const getPokemonImage = (card: CardState) => {
    if (card.stage === 0) return null;
    const id = card.stage === 1 ? card.pokemon.id1 : card.stage === 2 ? card.pokemon.id2 : card.pokemon.id3;
    
    // Usamos imágenes de alta resolución (Official Artwork) cargadas desde scripts globales.
    // Al estar divididas en partes, evitamos errores de memoria y build.
    const images = (window as any).POKEMON_IMAGES || {};
    return images[id.toString()] || null;
  };

  const getPokemonName = (card: CardState) => {
    if (card.stage === 0) return '';
    return card.stage === 1 ? card.pokemon.etapa1 : card.stage === 2 ? card.pokemon.etapa2 : card.pokemon.etapa3;
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#121212] flex flex-col items-center justify-center text-white font-sans">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-6"
        >
          <Loader2 size={48} className="text-[#ffd700]" />
        </motion.div>
        <h2 className="text-xl font-medium tracking-tight mb-2">Preparando Pokédex...</h2>
        <p className="text-gray-500 text-sm">Cargando datos de evolución offline</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#121212] text-white overflow-hidden font-sans">
      <div className="flex-1 flex flex-col p-4 bg-[#1a1a1a]">
        {/* Grid Container */}
        <div className="flex-1 grid grid-cols-6 grid-rows-4 gap-2 md:gap-3 h-full overflow-hidden">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCardClick(index)}
              className={`relative flex items-center justify-center cursor-pointer rounded-lg border-2 md:border-3 transition-colors duration-300 overflow-hidden h-full w-full
                ${card.stage === 0 ? 'bg-[#2a2a2a]' : 'bg-white'}
                ${card.stage === 3 ? 'animate-pulse shadow-[0_0_10px_rgba(255,215,0,0.6)] bg-[#fffde7]' : ''}
              `}
              style={{ borderColor: card.stage === 3 ? '#ffd700' : card.borderColor }}
            >
              <AnimatePresence mode="wait">
                {card.stage === 0 ? (
                  <motion.div
                    key="hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-2xl md:text-3xl font-bold text-[#444]"
                  >
                    ?
                  </motion.div>
                ) : (
                  <motion.div
                    key={`stage-${card.stage}`}
                    initial={{ opacity: 0, rotateY: 90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: -90 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center w-full h-full p-0.5 relative"
                  >
                    <div className="flex-1 w-full flex items-center justify-center min-h-0">
                      <img
                        src={getPokemonImage(card) || ''}
                        alt={getPokemonName(card)}
                        className="w-full h-full object-contain pointer-events-none scale-110"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className={`absolute bottom-0 left-0 right-0 py-0.5 md:py-1 bg-white/95 text-[8px] md:text-[10px] font-black text-center uppercase pointer-events-none border-t border-gray-100
                      ${card.stage === 1 ? 'text-green-600' : ''}
                      ${card.stage === 2 ? 'text-orange-500' : ''}
                      ${card.stage === 3 ? 'text-red-600' : 'text-black'}
                    `}>
                      {getPokemonName(card)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-52 bg-black border-l-2 border-[#ffd700] flex flex-col items-center justify-between py-8 px-4 text-center shrink-0">
        <div className="space-y-6 w-full">
          <div className="bg-[#222] p-4 rounded-xl w-full border border-white/5">
            <span className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Evoluciones</span>
            <span className="text-4xl font-black text-white block">{evolutionCount}</span>
            <span className="text-xs text-gray-500 block mt-1">/ 48</span>
          </div>
        </div>

        <div className="w-full space-y-4">
          <button
            onClick={initGame}
            className="group relative w-full bg-[#ff4500] hover:bg-[#ff5722] text-white font-bold py-3 rounded-lg transition-all active:translate-y-1 shadow-[0_4px_0_#900] active:shadow-none flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
            REINICIAR
          </button>
          
          <div className="flex items-center justify-center gap-2 text-[#aaa]">
            <Info size={14} />
            <small className="text-[10px] uppercase font-medium">Haz clic para evolucionar</small>
          </div>
        </div>
      </aside>
    </div>
  );
}

