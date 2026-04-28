import React, { useState, useEffect, useRef } from 'react';

// --- CUSTOM HOOK FOR PERSISTENCE ---
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn("Error reading localStorage", error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn("Error setting localStorage", error);
    }
  };
  return [storedValue, setValue];
}

// --- WEB AUDIO API SYNTHESIZER (NO EXTERNAL FILES NEEDED) ---
let audioCtx = null;
const initAudio = () => { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if(audioCtx.state === 'suspended') audioCtx.resume(); };

const playTone = (freq, type, duration, vol=0.1, slideFreq=0, isSoundEnabled=true) => {
  if (!isSoundEnabled) return;
  initAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  if (slideFreq) osc.frequency.exponentialRampToValueAtTime(slideFreq, audioCtx.currentTime + duration);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

const sfx = {
  click: (en) => playTone(450, 'sine', 0.05, 0.02, 300, en), 
  shoot: (en) => playTone(800, 'square', 0.3, 0.1, 200, en),
  draw: (en) => playTone(400, 'triangle', 0.15, 0.05, 600, en),
  error: (en) => playTone(150, 'sawtooth', 0.3, 0.1, 100, en),
  launch: (en) => playTone(50, 'sawtooth', 3.0, 0.3, 300, en),
  victory: (en) => { playTone(440, 'sine', 0.2, 0.1, 0, en); setTimeout(()=>playTone(554, 'sine', 0.2, 0.1, 0, en), 200); setTimeout(()=>playTone(659, 'sine', 0.4, 0.1, 0, en), 400); }
};

const SparkleStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes pulse-sparkle { 0%, 100% { opacity: 0.5; transform: scale(0.8); filter: brightness(1); } 50% { opacity: 1; transform: scale(1.3); filter: brightness(1.5); } }
    @keyframes slide-up { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
    @keyframes bg-pan { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    @keyframes slow-drift { 0% { background-position: 0px 0px; } 100% { background-position: 1000px 1000px; } }
    
    .card-base { position: relative; overflow: hidden; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
    .card-base::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(125deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0) 50%); background-size: 200% 200%; animation: shimmer 4s infinite linear; pointer-events: none; z-index: 10; }
    .card-base:hover:not(.disabled-card) { transform: translateY(-12px) scale(1.08); box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.3); z-index: 40; filter: brightness(1.1); border-color: rgba(255,255,255,0.8); }
    
    .astral-sparkle-bg { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: conic-gradient(from 0deg, #0f0c29, #ff00ff, #00ffff, #ff00ff, #fff, #00ffff, #0f0c29); animation: spin 3s linear infinite; z-index: 0; }
    .astral-card-content { position: relative; background: rgba(10, 10, 15, 0.9); z-index: 1; height: calc(100% - 6px); width: calc(100% - 6px); margin: 3px; border-radius: 0.5rem; }
    .sparkle-particle { position: absolute; border-radius: 50%; animation: pulse-sparkle 1.5s infinite alternate; z-index: 15; pointer-events: none; }
    .sp-magenta { box-shadow: 0 0 10px 4px rgba(255, 0, 255, 0.9); background-color: #ffb3ff; }
    .sp-blue { box-shadow: 0 0 10px 4px rgba(0, 255, 255, 0.9); background-color: #b3ffff; }
    .sp-gold { box-shadow: 0 0 10px 4px rgba(250, 204, 21, 0.9); background-color: #fef08a; }

    .bg-harvester { background: linear-gradient(135deg, #064e3b, #022c22); position: relative; overflow: hidden; }
    .bg-harvester::before { content: '🌿'; position: absolute; font-size: 6rem; opacity: 0.15; top: -10px; left: -10px; animation: spin 15s linear infinite; pointer-events: none; }
    
    .bg-engineer { background: #0f172a; position: relative; overflow: hidden; }
    .bg-engineer::before { content: ''; position: absolute; inset: 0; background-image: linear-gradient(rgba(34,211,238,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.2) 1px, transparent 1px); background-size: 20px 20px; animation: slide-up 5s linear infinite; pointer-events: none; }
    
    .bg-warprider { background: linear-gradient(45deg, #4a044e, #9d174d, #e11d48); background-size: 200% 200%; animation: shimmer 2s ease infinite; }
    
    .bg-khaos { background: repeating-linear-gradient(45deg, #000 0%, #222 10%, #4d7c0f 10%, #86198f 20%); background-size: 200% 200%; animation: slide-up 3s linear infinite; }

    .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.4); border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #4a4e69, #9d4edd); border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #9d4edd, #c084fc); }

    .nebula-wolf-back { background: radial-gradient(circle at center, #3b0764 0%, #000000 100%); border: 2px solid #a855f7; box-shadow: 0 0 20px #a855f7; color: #d8b4fe; }
    .vegan-vanguard-back { background: linear-gradient(45deg, #f0fdf4 25%, #dcfce7 25%, #dcfce7 50%, #f0fdf4 50%, #f0fdf4 75%, #dcfce7 75%, #dcfce7 100%); background-size: 20px 20px; border: 2px solid #4ade80; box-shadow: 0 0 20px #4ade80; color: #166534; }
    .cyber-swine-back { background: repeating-linear-gradient(0deg, #0f172a, #0f172a 2px, #000000 2px, #000000 4px); border: 2px solid #22d3ee; box-shadow: 0 0 20px #f43f5e; color: #f43f5e; }
    .pvp-enemy-back { background: linear-gradient(135deg, #991b1b, #450a0a); border: 2px solid #f87171; box-shadow: 0 0 20px #ef4444; color: #fca5a5; }
    
    .player-default-back { background: linear-gradient(to bottom right, #1e40af, #312e81); border: 2px solid #818cf8; box-shadow: 0 0 15px #6366f1; }
    .player-gold-back { background: radial-gradient(ellipse at center, #fef08a 0%, #b45309 100%); border: 2px solid #fef08a; box-shadow: 0 0 25px #d97706; }
    .player-plasma-back { background: linear-gradient(45deg, #d946ef, #be185d, #a855f7); background-size: 400% 400%; animation: shimmer 2s ease infinite; border: 2px solid #fbcfe8; box-shadow: 0 0 20px #d946ef; }
    .matrix-back { background: #000; background-image: linear-gradient(0deg, rgba(34,197,94,0.3) 25%, transparent 25%, transparent 50%, rgba(34,197,94,0.3) 50%, rgba(34,197,94,0.3) 75%, transparent 75%, transparent); background-size: 4px 4px; border: 2px solid #4ade80; color: #4ade80; box-shadow: 0 0 15px #22c55e; }
    .neon-synth-back { background: linear-gradient(180deg, #3b0764 0%, #000 100%); border: 2px solid #ec4899; box-shadow: 0 0 20px #ec4899, inset 0 0 15px #3b82f6; }
    .hologram-back { background: linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.6) 100%); background-color: #94a3b8; border: 2px solid #fff; animation: shimmer 1.5s infinite; box-shadow: 0 0 15px rgba(255,255,255,0.5); }
    
    .scanlines { background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.4)); background-size: 100% 4px; pointer-events: none; }

    .flashy-btn { background-size: 200% 200%; animation: bg-pan 3s linear infinite; }
    .flashy-btn:hover { filter: brightness(1.25); transform: scale(1.02); }
    .bg-drift { animation: slow-drift 60s linear infinite; }

    /* Launch Sequence Animations */
    @keyframes ship-rumble { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-6px, 6px); } 50% { transform: translate(6px, -6px); } 75% { transform: translate(-6px, -6px); } }
    @keyframes blast-off { 0% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 30px rgba(255,255,255,0.5)); } 20% { transform: translateY(40px) scale(0.9); filter: drop-shadow(0 0 50px rgba(255,100,0,0.8)); } 100% { transform: translateY(-2500px) scale(1.5); filter: drop-shadow(0 0 100px rgba(0,255,255,1)); } }
    @keyframes star-warp { 0% { background-position: 0 0; } 100% { background-position: 0 3000px; } }
    .animate-star-warp { animation: star-warp 0.2s linear infinite; }
    .animate-ship-launch { animation: ship-rumble 0.05s infinite, blast-off 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; animation-delay: 0s, 3s; }
    .animate-seq-1 { animation: slide-up 0.4s forwards; animation-delay: 0.5s; opacity: 0; }
    .animate-seq-2 { animation: slide-up 0.4s forwards; animation-delay: 1.5s; opacity: 0; }
    .animate-seq-3 { animation: slide-up 0.4s forwards; animation-delay: 2.5s; opacity: 0; }

    body { background-color: #0f111a; }
  `}} />
);

// --- CARD DATABASES ---
const CARD_LIBRARY = {
  'Truffle-Dome': { type: 'habitat', faction: 'green', name: 'Truffle-Dome', cost: 0, aetherGen: { green: 1 }, def: 3, desc: 'Provides 1 Green Aether per turn.', art: '🍄', rarity: 'common' },
  'Tractor-Mech': { type: 'unit', faction: 'green', name: 'Tractor-Mech', cost: { green: 2 }, atk: 3, def: 3, desc: 'Heavy armored agricultural unit.', art: '🚜', rarity: 'common' },
  'Spore-Bomb': { type: 'spell', faction: 'green', name: 'Spore-Bomb', cost: { green: 3 }, desc: 'Deal 4 damage to enemy hull.', art: '💥', rarity: 'rare' },
  'Elder Hooves': { type: 'unit', faction: 'green', name: 'Elder Hooves', cost: { green: 5 }, atk: 6, def: 6, desc: 'Massive woodland beast.', art: '🦣', rarity: 'epic' },
  'Zero-G Field': { type: 'habitat', faction: 'blue', name: 'Zero-G Field', cost: 0, aetherGen: { blue: 1 }, def: 3, desc: 'Provides 1 Blue Aether per turn.', art: '💧', rarity: 'common' },
  'Void Scholar': { type: 'unit', faction: 'blue', name: 'Void Scholar', cost: { blue: 2 }, atk: 1, def: 4, desc: 'Studies the deep void.', art: '🔬', rarity: 'rare' },
  'Deflector': { type: 'spell', faction: 'blue', name: 'Deflector', cost: { blue: 1 }, desc: 'Restore 5 Hull.', art: '🛡️', rarity: 'common' },
  'Plasma Bath': { type: 'habitat', faction: 'magenta', name: 'Plasma Bath', cost: 0, aetherGen: { magenta: 1 }, def: 3, desc: 'Provides 1 Magenta Aether per turn.', art: '♨️', rarity: 'common' },
  'Warp Piglet': { type: 'unit', faction: 'magenta', name: 'Warp Piglet', cost: { magenta: 1 }, atk: 2, def: 1, desc: 'Haste. Can attack immediately.', art: '🚀', rarity: 'common' },
  'Plasma Strike': { type: 'spell', faction: 'magenta', name: 'Plasma Strike', cost: { magenta: 2 }, desc: 'Deal 3 damage to enemy hull.', art: '⚡', rarity: 'rare' },
  'Crystal Sty': { type: 'habitat', faction: 'black', name: 'Crystal Sty', cost: 0, aetherGen: { black: 1 }, def: 3, desc: 'Provides 1 Black Aether per turn.', art: '🔮', isAstral: true, rarity: 'rare' },
  'Astral Seer': { type: 'unit', faction: 'black', name: 'Astral Seer', cost: { black: 2 }, atk: 4, def: 2, desc: 'Powerful but fragile void walker.', art: '👁️', isAstral: true, rarity: 'epic' },
  'Void Sacrifice': { type: 'spell', faction: 'black', name: 'Void Sacrifice', cost: { black: 1 }, desc: 'Draw 2 cards, lose 2 Hull.', art: '🩸', isAstral: true, rarity: 'common' },
  'Khaos Nexus': { type: 'habitat', faction: 'dual', name: 'Khaos Nexus', cost: 0, aetherGen: { green: 1, magenta: 1 }, def: 4, desc: 'Provides Green AND Magenta Aether.', art: '🌀', rarity: 'epic' },
  'Mutant Swine': { type: 'unit', faction: 'dual', name: 'Mutant Swine', cost: { green: 1, magenta: 1 }, atk: 3, def: 3, desc: 'Unpredictable bio-weapon.', art: '🧬', rarity: 'legendary' }
};

const ENEMY_DECK_POOL = [
  { type: 'unit', name: 'Void Drone', atk: 1, def: 1, cost: 1, art: '🛸' },
  { type: 'unit', name: 'Scrap Fighter', atk: 2, def: 2, cost: 2, art: '🛩️' },
  { type: 'unit', name: 'Heavy Cruiser', atk: 4, def: 4, cost: 4, art: '🚀' },
  { type: 'spell', name: 'Laser Volley', cost: 2, desc: 'Damage', art: '🔫' }
];

const multiplyTemplate = (arr) => [...arr, ...arr];
const INITIAL_DECKS = {
  harvester: multiplyTemplate(['Truffle-Dome','Truffle-Dome','Truffle-Dome','Truffle-Dome','Tractor-Mech','Tractor-Mech','Tractor-Mech','Spore-Bomb','Spore-Bomb','Elder Hooves']),
  engineer: multiplyTemplate(['Zero-G Field','Zero-G Field','Zero-G Field','Zero-G Field','Void Scholar','Void Scholar','Deflector','Deflector','Void Scholar','Zero-G Field']),
  warprider: multiplyTemplate(['Plasma Bath','Plasma Bath','Plasma Bath','Plasma Bath','Warp Piglet','Warp Piglet','Warp Piglet','Warp Piglet','Plasma Strike','Plasma Strike']),
  astralseer: multiplyTemplate(['Crystal Sty','Crystal Sty','Crystal Sty','Crystal Sty','Astral Seer','Astral Seer','Astral Seer','Void Sacrifice','Void Sacrifice','Void Sacrifice']),
  khaos: multiplyTemplate(['Truffle-Dome','Plasma Bath','Khaos Nexus','Khaos Nexus','Mutant Swine','Mutant Swine','Warp Piglet','Tractor-Mech','Spore-Bomb','Plasma Strike'])
};

const INITIAL_COLLECTION = {};
Object.keys(CARD_LIBRARY).forEach(key => {
  const rarity = CARD_LIBRARY[key].rarity;
  INITIAL_COLLECTION[key] = rarity === 'common' ? 10 : rarity === 'rare' ? 5 : rarity === 'epic' ? 2 : 1;
});

export default function App() {
  const [view, setView] = useState('lobby'); 
  const [combatLog, setCombatLog] = useState(["System online."]);
  const logEndRef = useRef(null);

  // Persistent State
  const [radhBalance, setRadhBalance] = useLocalStorage('ohf_radhBalance', 100);
  const [purchasedPacks, setPurchasedPacks] = useLocalStorage('ohf_purchasedPacks', ['basic', 'elite', 'mythic']);
  const [collection, setCollection] = useLocalStorage('ohf_collection', INITIAL_COLLECTION);
  const [customDecks, setCustomDecks] = useLocalStorage('ohf_customDecks', INITIAL_DECKS);
  const [campaignStage, setCampaignStage] = useLocalStorage('ohf_campaignStage', 0);
  const [hubUsername, setHubUsername] = useLocalStorage('ohf_hubUsername', 'OHF_Player_1');
  const [playerCardback, setPlayerCardback] = useLocalStorage('ohf_playerCardback', 'player-default-back');
  const [soundEnabled, setSoundEnabled] = useLocalStorage('ohf_soundEnabled', true);
  
  // Ephemeral State
  const [openedCards, setOpenedCards] = useState([]);
  const [isOpening, setIsOpening] = useState(false);
  const [editingDeck, setEditingDeck] = useState([]); 
  const [selectedDeckKey, setSelectedDeckKey] = useState('harvester');
  const [selectedCommander, setSelectedCommander] = useState(0);
  const [isPvP, setIsPvP] = useState(false);

  // Game Engine State
  const [turnPhase, setTurnPhase] = useState('Player Turn');
  const [playerHull, setPlayerHull] = useState(30);
  const [maxPlayerHull, setMaxPlayerHull] = useState(30);
  const [enemyHull, setEnemyHull] = useState(30);
  const [deck, setDeck] = useState([]);
  const [hand, setHand] = useState([]);
  const [board, setBoard] = useState([]);
  const [enemyHand, setEnemyHand] = useState(3);
  const [enemyBoard, setEnemyBoard] = useState([]);
  const [enemyAetherPool, setEnemyAetherPool] = useState(0);
  const [aetherPool, setAetherPool] = useState({ green: 0, blue: 0, magenta: 0, black: 0 });

  useEffect(() => {
    const unlockAudio = () => { 
      initAudio(); 
      window.removeEventListener('click', unlockAudio); 
      window.removeEventListener('touchstart', unlockAudio); 
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  useEffect(() => {
    let bgmInterval;
    if (soundEnabled && (view === 'battle' || view === 'transmission' || view === 'launch')) {
      const notes = [110.00, 146.83, 164.81, 220.00]; 
      let step = 0;
      bgmInterval = setInterval(() => {
         playTone(notes[step], 'triangle', 0.4, 0.015, 0, soundEnabled);
         step = (step + 1) % notes.length;
      }, 750); 
    }
    return () => clearInterval(bgmInterval);
  }, [soundEnabled, view]);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [combatLog]);

  useEffect(() => {
    if (view === 'launch') {
      sfx.launch(soundEnabled);
      const timer = setTimeout(() => setView('transmission'), 4500);
      return () => clearTimeout(timer);
    }
  }, [view, soundEnabled]);

  const deckInfo = {
    harvester: { name: '🌿 The Harvesters', color: 'green', desc: 'Ramp and Heavy Units', style: 'bg-green-900/40 border-green-400', lore: 'You pilot the massive agricultural seed-banks. Slow, heavily armored, and methodical.', commanders: [{ name: "Chief Botanist Oinkers", title: "The Patient", buff: "Max Hull +10", icon: "🌱", apply: () => { setMaxPlayerHull(40); setPlayerHull(40); } }, { name: "Cyborg-Trotter", title: "The Builder", buff: "Start with 1 Truffle-Dome in play.", icon: "🦾", apply: () => { setBoard([{ ...CARD_LIBRARY['Truffle-Dome'], id: 'cmd_1' }]); } }, { name: "Elder-Snout", title: "The Cultivator", buff: "Draw an extra card on turn 1.", icon: "🎋", apply: () => { setHand(prev => [...prev, { ...CARD_LIBRARY['Spore-Bomb'], id: 'cmd_2' }]); } }] },
    engineer: { name: '💧 The Engineers', color: 'blue', desc: 'Draws, Shields, and Tactics', style: 'bg-blue-900/40 border-blue-400', lore: 'Brilliant tacticians of the Zero-G Oat fields. You rely on deflector shields, probability matrices, and outsmarting the brute force of the void.', commanders: [{ name: "Chief Tactician Squeals", title: "The Brain", buff: "Start with 1 Zero-G Field in play.", icon: "🧠", apply: () => { setBoard([{ ...CARD_LIBRARY['Zero-G Field'], id: 'cmd_1' }]); } }, { name: "Shield-Commander Hoof", title: "The Wall", buff: "Max Hull +15", icon: "🛡️", apply: () => { setMaxPlayerHull(45); setPlayerHull(45); } }, { name: "Probability-Pig Sigma", title: "The Analyst", buff: "Start with Deflector in hand.", icon: "📊", apply: () => { setHand(prev => [...prev, { ...CARD_LIBRARY['Deflector'], id: 'cmd_2' }]); } }] },
    warprider: { name: '♨️ The Warp-Riders', color: 'magenta', desc: 'Fast, Aggressive Strikes', style: 'bg-fuchsia-900/40 border-fuchsia-400', lore: 'Adrenaline junkies fueling their drives with unstable Plasma. You hit hard, fast, and fade into the metaverse before enemies can lock on.', commanders: [{ name: "Captain 'Burner' Ham", title: "The Reckless", buff: "Start with a Warp Piglet in hand.", icon: "🔥", apply: () => { setHand(prev => [...prev, { ...CARD_LIBRARY['Warp Piglet'], id: 'cmd_1' }]); } }, { name: "Void-Drifter Hamlet", title: "The Engine", buff: "Start with 1 Plasma Bath in play.", icon: "🏎️", apply: () => { setBoard([{ ...CARD_LIBRARY['Plasma Bath'], id: 'cmd_1' }]); } }] },
    astralseer: { name: '🔮 The Astral-Seers', color: 'black', desc: 'Sacrifice and Void Magic', style: 'bg-gray-800 border-purple-500', lore: 'Mystics attuned to the deep void. You understand that survival requires sacrifice, drawing upon terrifying, ancient Metaverse magic.', commanders: [{ name: "Oracle Pig", title: "The Visionary", buff: "Start with 1 Crystal Sty in play.", icon: "👁️", apply: () => { setBoard([{ ...CARD_LIBRARY['Crystal Sty'], id: 'cmd_1' }]); } }, { name: "The Sacrificer", title: "The Cultist", buff: "Start with Void Sacrifice in hand.", icon: "🩸", apply: () => { setHand(prev => [...prev, { ...CARD_LIBRARY['Void Sacrifice'], id: 'cmd_1' }]); } }] },
    khaos: { name: '🃏 The Khaos Deck', color: 'dual', desc: 'Unpredictable Hybrid Tech', style: 'bg-gradient-to-r from-green-900/40 to-fuchsia-900/40 border-yellow-400', lore: 'A volatile, unpredictable mashup of stolen tech and dual-core synergies. The galaxy has no idea what you will do next, and neither do you.', commanders: [{ name: "Mutant Overlord", title: "The Amalgamation", buff: "Start with 1 Khaos Nexus in play.", icon: "🧬", apply: () => { setBoard([{ ...CARD_LIBRARY['Khaos Nexus'], id: 'cmd_1' }]); } }, { name: "The Gambler", title: "The Wildcard", buff: "Max Hull +5", icon: "🎲", apply: () => { setMaxPlayerHull(35); setPlayerHull(35); } }, { name: `${hubUsername}`, title: "The Hub Legendary", buff: "Custom PvP Fleet Commander", icon: "👤", apply: () => { setMaxPlayerHull(40); setPlayerHull(40); setBoard([{ ...CARD_LIBRARY['Khaos Nexus'], id: 'cmd_user' }]); } }] }
  };

  const antagonists = [
    { name: "Asteroid Field", style: "bg-gray-800", icon: "☄️", desc: "Navigational hazard.", hp: 15, radhReward: 50,
      launch: ["AETHER ENGINES ........ ONLINE", "DEFLECTORS ............ MAX", "DESTINATION ........... ASTEROID BELT"],
      dialogue: { sender: "Ship AI Nav-Computer", text: "Captain, we are approaching a dense asteroid field. Recommend deploying Habitat Cores and defensive units to clear a path. We must test the Aether engines before engaging live targets." }
    },
    { name: "Vanguard Outpost", style: "vegan-vanguard-back", icon: "🥬", desc: "Sterile border patrol.", hp: 30, radhReward: 100,
      launch: ["WEAPONS ............... HOT", "STEALTH ............... DEACTIVATED", "DESTINATION ........... VANGUARD BORDER"],
      dialogue: { sender: "Vanguard Patrol Alpha", text: "Attention Unipiggy vessel. You are entering restricted organic space. Power down your engines and surrender your non-vegan cargo immediately, or be composted." }
    },
    { name: "Vanguard Cruiser", style: "vegan-vanguard-back", icon: "🥦", desc: "Heavy agricultural enforcer.", hp: 45, radhReward: 150,
      launch: ["HULL INTEGRITY ........ 100%", "TARGET ................ CRUISER-CLASS", "DESTINATION ........... ENEMY SPACE"],
      dialogue: { sender: "Commander Celery", text: "Your resistance at the outpost was futile. The Great Harvest cannot be stopped by your primitive engines. We will grind your hull into fertilizer!" }
    },
    { name: "Scavenger Swarm", style: "cyber-swine-back", icon: "🦾", desc: "Ruthless augmented pirates.", hp: 60, radhReward: 200,
      launch: ["SCANNING .............. HOSTILES DETECTED", "SHIELDS ............... MODULATING", "DESTINATION ........... JUNK SECTOR"],
      dialogue: { sender: "Scrap-Boss Grunt", text: "Bzzzt... Nice ship you got there. Lots of shiny Aether cores. Hand 'em over and we might let your crew live... as batteries." }
    },
    { name: "Swine Dreadnought", style: "cyber-swine-back", icon: "⚙️", desc: "Heavily armed cyber-fleet.", hp: 80, radhReward: 250,
      launch: ["POWER ................. DIVERTED TO CANNONS", "THREAT LEVEL .......... SEVERE", "DESTINATION ........... DREADNOUGHT"],
      dialogue: { sender: "Prime Assimilator", text: "You destroyed our scavenging fleet. Logic dictates we must assimilate your vessel to recoup the resource losses. Prepare for boarding." }
    },
    { name: "Nebula Scout Pack", style: "nebula-wolf-back", icon: "🐺", desc: "Apex predators of the deep void.", hp: 100, radhReward: 300,
      launch: ["TRACKING .............. UNKNOWN SIGNATURES", "AETHER ................ OVERCHARGED", "DESTINATION ........... DEEP VOID"],
      dialogue: { sender: "Unknown Transmission", text: "*Static* ...we smell you... *Static* ...fat little piggies out in the dark void... *Terrifying Howling noises*" }
    },
    { name: "The Alpha-Ship", style: "nebula-wolf-back", icon: "🌌", desc: "The final blockade.", hp: 150, radhReward: 500,
      launch: ["ALL SYSTEMS ........... PUSHED TO LIMIT", "METAVERSE COORDINATES . LOCKED", "DESTINATION ........... THE ALPHA"],
      dialogue: { sender: "The Alpha", text: "You have run far, little prey. Your Aether engines burn bright, but the hunt ends here. The Metaverse belongs to the pack!" }
    }
  ];

  const pvpEnemy = {
      name: "Rival Commander", style: "pvp-enemy-back", icon: "🦹", desc: "Hostile Hub User.", hp: 40, radhReward: 200,
      launch: ["MATCHMAKING ........... SEARCHING...", "OPPONENT FOUND ........ INCOMING JUMP", "DESTINATION ........... NEUTRAL ARENA"],
      dialogue: { sender: "PVP SYSTEM LINK", text: "Opponent located. Wagers locked. 200 $RADH added to the prize pool. Prepare for tactical engagement." }
  };

  const addLog = (msg) => setCombatLog(prev => [...prev, msg].slice(-10));

  const generateDeck = () => {
    let newDeck = [...customDecks[selectedDeckKey]]
      .map(cardName => ({ ...CARD_LIBRARY[cardName], id: Math.random().toString(36).substr(2, 9) }));
    newDeck.sort(() => Math.random() - 0.5);
    return newDeck;
  };

  const initBattleState = (isPvPMode) => {
    if (customDecks[selectedDeckKey].length < 20) {
        alert("Deck must have at least 20 cards! Enter the Engineering Bay to fix your deck.");
        return;
    }
    
    setIsPvP(isPvPMode);
    const target = isPvPMode ? pvpEnemy : antagonists[campaignStage];
    
    setEnemyHull(target.hp);
    setBoard([]); setEnemyBoard([]); setEnemyHand(3); setEnemyAetherPool(0);
    setAetherPool({ green: 0, blue: 0, magenta: 0, black: 0 });
    setMaxPlayerHull(30); setPlayerHull(30);
    setCombatLog(["Warp jump complete. Intercepting transmission..."]);
    
    const activeCommander = deckInfo[selectedDeckKey]?.commanders[selectedCommander];
    if (activeCommander?.apply) activeCommander.apply();

    const startingDeck = generateDeck();
    setHand(startingDeck.slice(0, 4));
    setDeck(startingDeck.slice(4));
    
    setView('launch');
  };

  const startCampaign = () => initBattleState(false);
  
  const startPvP = () => {
    if (radhBalance < 100) { alert("Insufficient $RADH to enter PvP Matchmaking."); return; }
    setRadhBalance(prev => prev - 100);
    initBattleState(true);
  };

  const engageBattle = () => {
     setView('battle');
     sfx.click(soundEnabled);
     startPlayerTurn(deck, board);
  };

  const openEditor = () => {
      sfx.click(soundEnabled);
      setEditingDeck([...customDecks[selectedDeckKey]]);
      setView('editor');
  };

  const saveDeck = () => {
      if (editingDeck.length < 20) { alert("A valid deck must contain at least 20 cards."); return; }
      sfx.click(soundEnabled);
      setCustomDecks(prev => ({ ...prev, [selectedDeckKey]: editingDeck }));
      setView('lobby');
  };

  const addCardToDeck = (cardName) => {
      const owned = collection[cardName] || 0;
      const inDeckCount = editingDeck.filter(c => c === cardName).length;
      if (editingDeck.length >= 34) { sfx.error(soundEnabled); alert("Deck is full (Max 34 Cards)."); return; }
      if (inDeckCount >= owned) { sfx.error(soundEnabled); alert(`You do not own any more copies of ${cardName}. Sync your Hub Inventory!`); return; }
      sfx.click(soundEnabled);
      setEditingDeck([...editingDeck, cardName]);
  };

  const removeCardFromDeck = (indexToRemove) => {
      sfx.click(soundEnabled);
      setEditingDeck(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const startPlayerTurn = (currentDeck = deck, currentBoard = board) => {
    setTurnPhase('Player Turn');
    let newAether = { green: 0, blue: 0, magenta: 0, black: 0 };
    currentBoard.forEach(card => {
      if (card.aetherGen) Object.keys(card.aetherGen).forEach(color => newAether[color] += card.aetherGen[color]);
    });
    setAetherPool(newAether);
    setBoard(prev => prev.map(c => ({...c, hasAttacked: false})));

    if (currentDeck.length > 0) {
      setHand(prev => [...prev, currentDeck[0]]);
      setDeck(currentDeck.slice(1));
      addLog("Drew a card. Aether pool refreshed.");
      sfx.draw(soundEnabled);
    } else {
      addLog("WARNING: Deck empty! Hull failing!");
      sfx.error(soundEnabled);
      setPlayerHull(prev => prev - 1);
    }
  };

  const canAfford = (cost) => {
    if (!cost || cost === 0) return true;
    for (const color in cost) { if (aetherPool[color] < cost[color]) return false; }
    return true;
  };

  const playCard = (card) => {
    if (turnPhase !== 'Player Turn') return;
    if (!canAfford(card.cost)) { addLog(`Not enough Aether for ${card.name}!`); sfx.error(soundEnabled); return; }

    sfx.click(soundEnabled);
    const newAether = { ...aetherPool };
    if (card.cost && card.cost !== 0) Object.keys(card.cost).forEach(color => newAether[color] -= card.cost[color]);
    setAetherPool(newAether);
    setHand(hand.filter(c => c.id !== card.id));

    if (card.type === 'habitat' || card.type === 'unit') {
      setBoard([...board, { ...card, hasAttacked: card.desc.includes('Haste') ? false : true }]);
      addLog(`Deployed ${card.name}.`);
    } else if (card.type === 'spell') {
      sfx.shoot(soundEnabled);
      if (card.name === 'Spore-Bomb' || card.name === 'Plasma Strike') {
        const dmg = card.name === 'Spore-Bomb' ? 4 : 3;
        setEnemyHull(prev => Math.max(0, prev - dmg));
        addLog(`Cast ${card.name}! Dealt ${dmg} damage to enemy hull.`);
        checkWinCondition(enemyHull - dmg);
      } else if (card.name === 'Void Sacrifice') {
        setPlayerHull(prev => prev - 2);
        const drawn = deck.slice(0, 2);
        setHand(prev => [...prev, ...drawn]);
        setDeck(deck.slice(2));
        addLog(`Sacrificed hull for Metaverse knowledge (+2 cards).`);
      }
    }
  };

  const attackEnemy = (cardIdx) => {
    if (turnPhase !== 'Player Turn') return;
    const card = board[cardIdx];
    if (card.hasAttacked || !card.atk) return;

    sfx.shoot(soundEnabled);
    let dmg = card.atk;
    let currentEnemyBoard = [...enemyBoard];

    while (dmg > 0 && currentEnemyBoard.length > 0) {
       let target = currentEnemyBoard[0];
       if (dmg >= target.def) {
          dmg -= target.def;
          addLog(`Your ${card.name} destroyed enemy ${target.name}!`);
          currentEnemyBoard.shift(); 
       } else {
          target.def -= dmg;
          dmg = 0;
          addLog(`Your ${card.name} hit enemy ${target.name}.`);
       }
    }
    setEnemyBoard(currentEnemyBoard);

    if (dmg > 0) {
       const newEnemyHull = enemyHull - dmg;
       setEnemyHull(newEnemyHull);
       addLog(`Your ${card.name} blasts enemy hull for ${dmg}!`);
       checkWinCondition(newEnemyHull);
    }

    const newBoard = [...board];
    newBoard[cardIdx].hasAttacked = true;
    setBoard(newBoard);
  };

  const checkWinCondition = (hull) => {
    if (hull <= 0) {
      setTurnPhase('Victory');
      sfx.victory(soundEnabled);
      const target = isPvP ? pvpEnemy : antagonists[campaignStage];
      const reward = target.radhReward;
      setRadhBalance(prev => prev + reward);
      setTimeout(() => {
        alert(`VICTORY! Secured ${reward} $RADH. Saving progress...`);
        if (!isPvP) {
            if (campaignStage < antagonists.length - 1) {
                setCampaignStage(s => s + 1);
            } else {
                alert("CONGRATULATIONS! You have reached the Metaverse!");
                setCampaignStage(0); 
            }
        }
        setView('lobby');
      }, 1500);
    }
  };

  const endTurn = () => {
    if (turnPhase !== 'Player Turn') return;
    sfx.click(soundEnabled);
    setTurnPhase('Enemy Turn');
    addLog("--- Enemy Turn Initiated ---");

    setTimeout(() => {
      let currentPlayerHull = playerHull;
      const aiAether = enemyAetherPool + 2; 
      setEnemyAetherPool(aiAether);
      setEnemyHand(prev => prev + 1);
      
      let currentEnemyBoard = [...enemyBoard];
      if (aiAether >= 2 && enemyHand > 0 && currentEnemyBoard.length < 4) {
         const randomUnit = ENEMY_DECK_POOL[Math.floor(Math.random() * ENEMY_DECK_POOL.length)];
         if (randomUnit.type === 'unit') {
           currentEnemyBoard.push({...randomUnit, id: Math.random().toString(36).substr(2, 9)});
           setEnemyHand(prev => prev - 1);
           setEnemyAetherPool(prev => prev - randomUnit.cost);
           addLog(`Enemy deployed: ${randomUnit.name}`);
         } else {
           sfx.shoot(soundEnabled);
           currentPlayerHull -= 2;
           addLog(`Enemy cast Laser Volley! You took 2 damage.`);
           setPlayerHull(currentPlayerHull);
         }
      }
      setEnemyBoard(currentEnemyBoard);

      let incomingDamage = 0;
      currentEnemyBoard.forEach(unit => incomingDamage += unit.atk);
      
      setTimeout(() => {
        let nextBoardState = [...board]; 

        if (incomingDamage > 0) {
            sfx.shoot(soundEnabled);
            while (incomingDamage > 0 && nextBoardState.length > 0) {
               let target = nextBoardState[0];
               if (incomingDamage >= target.def) {
                   incomingDamage -= target.def;
                   addLog(`Enemy destroyed your ${target.name}!`);
                   nextBoardState.shift();
               } else {
                   target.def -= incomingDamage;
                   incomingDamage = 0;
                   addLog(`Enemy damaged your ${target.name}.`);
               }
            }
            setBoard(nextBoardState);

            if (incomingDamage > 0) {
                currentPlayerHull -= incomingDamage;
                addLog(`Enemy fleet hits hull for ${incomingDamage} damage!`);
                setPlayerHull(currentPlayerHull);
                sfx.error(soundEnabled);
                if (currentPlayerHull <= 0) {
                   addLog("CRITICAL HULL FAILURE. You lost.");
                   setTurnPhase('Defeat');
                   setTimeout(() => setView('lobby'), 2000);
                   return;
                }
            }
        } else {
            addLog("Enemy is charging weapons...");
        }

        setTimeout(() => startPlayerTurn(deck, nextBoardState), 1500);
      }, 1000);

    }, 1000);
  };

  const getFactionColors = (faction) => {
    switch(faction) {
      case 'green': return 'bg-harvester border-green-300 text-green-50 shadow-[0_0_15px_rgba(74,222,128,0.3)]';
      case 'blue': return 'bg-engineer border-cyan-300 text-cyan-50 shadow-[0_0_15px_rgba(6,182,212,0.3)]';
      case 'magenta': return 'bg-warprider border-fuchsia-300 text-fuchsia-50 shadow-[0_0_15px_rgba(217,70,239,0.3)]';
      case 'black': return 'bg-gray-900 border-purple-400 text-purple-50 shadow-[0_0_15px_rgba(168,85,247,0.3)]'; 
      case 'dual': return 'bg-khaos border-yellow-300 text-yellow-50 shadow-[0_0_15px_rgba(253,224,71,0.3)]';
      default: return 'bg-gray-700 border-gray-400';
    }
  };

  const generateSparkles = () => {
    const sparkles = [];
    for(let i=0; i<12; i++) {
      const top = Math.random() * 95 + '%'; const left = Math.random() * 95 + '%'; const delay = Math.random() * 2 + 's';
      const typeRand = Math.random();
      const type = typeRand > 0.66 ? 'sp-magenta' : typeRand > 0.33 ? 'sp-blue' : 'sp-gold';
      const size = Math.random() * 4 + 2; 
      sparkles.push(<div key={i} className={`sparkle-particle ${type}`} style={{ top, left, width: size, height: size, animationDelay: delay }} />);
    }
    return sparkles;
  };

  const renderCard = (card, idx, isHand, isEditor = false) => {
    const disabled = isHand && !canAfford(card.cost);
    return (
      <div 
        key={card.id || idx} 
        onClick={() => {
           if(isEditor) return; 
           isHand ? playCard(card) : attackEnemy(idx);
        }}
        className={`rounded-lg border-2 flex flex-col p-1 shadow-lg shrink-0 card-base
          ${isEditor ? 'w-24 h-36' : 'w-32 h-48'}
          ${card.isAstral ? 'border-transparent' : getFactionColors(card.faction)}
          ${disabled && !isEditor ? 'opacity-50 grayscale disabled-card cursor-not-allowed' : 'cursor-pointer'}
          ${!isHand && !isEditor && card.atk && !card.hasAttacked && turnPhase === 'Player Turn' ? 'hover:-translate-y-2 ring-2 ring-yellow-300 hover:shadow-[0_0_30px_rgba(250,204,21,0.8)]' : ''}
          ${!isHand && !isEditor && card.hasAttacked ? 'opacity-50 grayscale cursor-not-allowed disabled-card' : ''}
        `}
      >
        {card.isAstral && <div className="astral-sparkle-bg"></div>}
        <div className={`h-full flex flex-col p-1 relative z-20 ${card.isAstral ? 'astral-card-content text-gray-100' : ''}`}>
          {card.isAstral && generateSparkles()}
          <div className="flex justify-between items-start mb-1 z-20">
            <span className={`font-bold uppercase opacity-80 ${card.isAstral ? 'text-purple-300' : ''} ${isEditor ? 'text-[8px]' : 'text-[10px]'}`}>{card.type}</span>
            {card.cost !== 0 && (
              <span className={`bg-black/70 rounded font-mono font-bold ${isEditor ? 'px-1 py-0.5 text-[8px]' : 'px-1.5 py-0.5 text-xs'}`}>
                {card.cost.green ? `🌿${card.cost.green}` : ''}
                {card.cost.magenta ? `♨️${card.cost.magenta}` : ''}
                {card.cost.black ? `🔮${card.cost.black}` : ''}
                {card.cost.blue ? `💧${card.cost.blue}` : ''}
              </span>
            )}
          </div>
          <div className={`text-center z-20 ${isEditor ? 'text-2xl mb-0' : 'text-3xl mb-1'}`}>{card.art}</div>
          <div className={`font-bold text-center leading-tight z-20 ${isEditor ? 'text-[9px] mb-0' : 'mb-1 text-xs'} ${card.isAstral ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-fuchsia-400 to-white' : ''}`}>{card.name}</div>
          <div className={`leading-tight text-center flex-1 overflow-y-auto custom-scrollbar px-1 z-20 opacity-90 ${isEditor ? 'text-[8px]' : 'text-[10px]'}`}>{card.desc}</div>
          
          {(card.atk !== undefined || card.def !== undefined) && (
             <div className={`absolute bottom-1 right-1 bg-black/80 rounded font-bold border border-white/20 z-20 ${isEditor ? 'px-1 py-0.5 text-[8px]' : 'px-2 py-0.5 text-xs'}`}>
               {card.atk !== undefined ? `${card.atk}/${card.def}` : `🛡️${card.def}`}
             </div>
          )}
          {!isHand && !isEditor && card.hasAttacked && <div className="absolute inset-0 flex items-center justify-center text-white font-bold bg-black/60 rounded-lg z-30 backdrop-blur-[1px]">EXHAUSTED</div>}
        </div>
      </div>
    );
  };

  const PACK_TYPES = {
    basic: { id: 'basic', name: 'Basic Supply Drop', cards: 3, desc: 'Standard provisions.', img: '📦', color: 'bg-gray-800 border-gray-600' },
    elite: { id: 'elite', name: 'Elite Commander Crate', cards: 5, desc: 'Advanced tech.', img: '💎', color: 'bg-blue-900 border-blue-500' },
    mythic: { id: 'mythic', name: 'Mythic Void-Pack', cards: 5, desc: 'Deep void artifacts.', img: '🌌', color: 'bg-fuchsia-900 border-fuchsia-400 shadow-[0_0_15px_#d946ef]' }
  };

  const syncWeb3Packs = () => {
     sfx.click(soundEnabled);
     const types = ['basic', 'elite', 'mythic'];
     const randomPack = types[Math.floor(Math.random() * types.length)];
     setPurchasedPacks(prev => [...prev, randomPack]);
     alert(`Synced with Hub Wallet! Found 1 new ${PACK_TYPES[randomPack].name}.`);
  };

  const openPack = (packId) => {
     sfx.click(soundEnabled);
     const newPacks = [...purchasedPacks];
     const index = newPacks.indexOf(packId);
     if (index > -1) newPacks.splice(index, 1);
     setPurchasedPacks(newPacks);

     const packInfo = PACK_TYPES[packId];
     const cardKeys = Object.keys(CARD_LIBRARY);
     const pulled = [];

     for(let i = 0; i < packInfo.cards; i++) {
         let randomKey = cardKeys[Math.floor(Math.random() * cardKeys.length)];
         if (packId === 'mythic' && Math.random() > 0.4) {
            const rares = cardKeys.filter(k => CARD_LIBRARY[k].rarity === 'epic' || CARD_LIBRARY[k].rarity === 'legendary');
            randomKey = rares[Math.floor(Math.random() * rares.length)];
         }
         pulled.push({ ...CARD_LIBRARY[randomKey], id: Math.random().toString(36).substr(2, 9), isNew: true, cardName: randomKey });
     }
     setOpenedCards(pulled);
     setView('pack_opening');
     setIsOpening(true);
     setTimeout(() => { setIsOpening(false); sfx.draw(soundEnabled); }, 100);
  };

  const collectCards = () => {
     sfx.click(soundEnabled);
     setCollection(prev => {
        const newCol = { ...prev };
        openedCards.forEach(card => {
           newCol[card.cardName] = (newCol[card.cardName] || 0) + 1;
        });
        return newCol;
     });
     setView('vault');
  };

  const transferRadhToHub = () => {
    sfx.click(soundEnabled);
    if (radhBalance <= 0) {
       alert("No $RADH available to transfer.");
       return;
    }
    alert(`Initiating secure Web3 connection...\n\nSuccessfully beamed ${radhBalance.toLocaleString()} $RADH to the Old Ham Farms Hub for user: ${hubUsername}!\n\nYour funds are now available on the main site.`);
    setRadhBalance(0);
  };

  if (view === 'launch') {
    const targetInfo = isPvP ? pvpEnemy : antagonists[campaignStage];
    return (
      <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center relative p-8 overflow-hidden">
        <SparkleStyles />
        <div className="absolute top-4 right-4 z-50">
           <button onClick={() => setSoundEnabled(!soundEnabled)} className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full border border-gray-600 text-xs font-bold transition-all shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {soundEnabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF'}
           </button>
        </div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-60 bg-drift z-0 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-900/40 to-transparent z-0 animate-bg-pan bg-[length:200%_200%]"></div>
        <div className="absolute inset-0 scanlines z-10 pointer-events-none"></div>
        
        <div className="z-20 flex flex-col items-center text-center">
           <h2 className="text-red-500 font-bold tracking-[0.5em] mb-16 animate-pulse text-3xl drop-shadow-[0_0_20px_rgba(239,68,68,0.9)]">EXODUS PROTOCOL INITIATED</h2>
           <div className="text-9xl mb-16 animate-ship-launch drop-shadow-[0_0_40px_rgba(255,255,255,0.6)]">🚀🐷</div>
           
           <div className="font-mono text-cyan-400 text-xl space-y-4 text-left bg-black/70 p-6 rounded-xl border border-cyan-400/50 backdrop-blur-md w-96 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
             <div className="animate-seq-1">&gt; {targetInfo.launch[0]}</div>
             <div className="animate-seq-2">&gt; {targetInfo.launch[1]}</div>
             <div className="animate-seq-3">&gt; {targetInfo.launch[2]}</div>
           </div>
        </div>
        
        <button onClick={() => { sfx.click(soundEnabled); setView('transmission'); }} className="absolute bottom-10 z-30 text-gray-500 text-xs hover:text-white uppercase tracking-widest border-b border-transparent hover:border-white transition-all">
          Skip Sequence &gt;&gt;
        </button>
      </div>
    );
  }

  if (view === 'transmission') {
    const currentEnemy = isPvP ? pvpEnemy : antagonists[campaignStage];
    return (
      <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center relative p-8 overflow-hidden">
        <SparkleStyles />
        <div className="absolute top-4 right-4 z-50">
           <button onClick={() => setSoundEnabled(!soundEnabled)} className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full border border-gray-600 text-xs font-bold transition-all shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {soundEnabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF'}
           </button>
        </div>
        <div className="absolute inset-0 scanlines z-10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/50 via-black to-black z-0"></div>
        
        <div className="z-20 w-full max-w-4xl bg-black/80 border-2 border-red-500/80 rounded-2xl p-8 backdrop-blur-xl shadow-[0_0_60px_rgba(239,68,68,0.4)] flex flex-col items-center text-center">
           <h2 className="text-red-500 font-extrabold tracking-[0.5em] mb-8 animate-pulse text-xl drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">INCOMING TRANSMISSION</h2>
           
           <div className="text-8xl mb-6 shadow-[0_0_40px_rgba(239,68,68,0.7)] rounded-full bg-red-900/30 p-6 border-2 border-red-500/50">
              {currentEnemy.icon}
           </div>
           
           <h3 className="text-2xl font-bold text-gray-200 uppercase tracking-widest mb-2 border-b-2 border-gray-600 pb-2 inline-block px-8 drop-shadow-lg">
              {currentEnemy.dialogue.sender}
           </h3>
           
           <p className="text-xl text-gray-300 italic mb-12 max-w-2xl leading-relaxed font-mono drop-shadow-md">
              "{currentEnemy.dialogue.text}"
           </p>

           <div className="flex gap-6 w-full max-w-md">
             <button onClick={() => { sfx.click(soundEnabled); setView('lobby'); }} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-500 py-3 rounded-xl font-bold text-sm text-gray-300 transition-all uppercase tracking-wider shadow-[0_0_15px_rgba(255,255,255,0.1)]">
               Abort Jump
             </button>
             <button onClick={engageBattle} className="flex-1 bg-red-600 hover:bg-red-500 border border-red-400 py-3 rounded-xl font-extrabold text-lg text-white shadow-[0_0_30px_rgba(239,68,68,0.8)] hover:shadow-[0_0_45px_rgba(239,68,68,1)] transition-all uppercase tracking-wider scale-105">
               Engage Targets
             </button>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'vault') {
    return (
      <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-8 relative">
        <SparkleStyles />
        <div className="absolute top-4 right-4 z-50">
           <button onClick={() => setSoundEnabled(!soundEnabled)} className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full border border-gray-600 text-xs font-bold transition-all shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {soundEnabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF'}
           </button>
        </div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-60 bg-drift z-0 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-orange-900/30 via-gray-900/80 to-black z-0 pointer-events-none animate-bg-pan bg-[length:200%_200%]"></div>

        <div className="z-10 w-full max-w-4xl bg-black/80 border border-orange-400/60 rounded-2xl p-6 backdrop-blur-xl shadow-[0_0_60px_rgba(249,115,22,0.3)] flex flex-col min-h-[80vh]">
          <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]">Web3 NFT Vault</h1>
              <p className="text-gray-300 text-sm mt-1">Welcome, <span className="text-white font-bold">{hubUsername}</span>. Decypher your purchased packs here.</p>
            </div>
            <div className="flex gap-4">
              <button onClick={syncWeb3Packs} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-5 py-2 rounded-lg font-bold transition-all border border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.7)] text-white">🔄 Sync Hub Wallet</button>
              <button onClick={() => { sfx.click(soundEnabled); setView('lobby'); }} className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg font-bold transition-all border border-gray-500 shadow-[0_0_15px_rgba(255,255,255,0.1)]">Return to Bridge</button>
            </div>
          </div>

          <div className="flex flex-col flex-1 items-center">
            <div className="w-full max-w-2xl bg-gray-800/60 rounded-xl border border-gray-600 p-6 flex flex-col shadow-[0_0_25px_rgba(0,0,0,0.5)]">
              <h2 className="text-xl font-extrabold text-cyan-400 uppercase tracking-widest border-b border-cyan-500/50 pb-2 mb-4 text-center drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">Unopened Supply Drops</h2>
              <p className="text-gray-400 text-xs text-center mb-6">Packs purchased on the main Old Ham Farms website appear here automatically.</p>
              
              {purchasedPacks.length === 0 ? (
                <div className="text-gray-400 italic text-center mt-10 text-lg">You have no unopened packs. Visit the main website to acquire more.</div>
              ) : (
                <div className="flex flex-col gap-5 overflow-y-auto custom-scrollbar pr-2">
                   {purchasedPacks.map((packId, idx) => {
                     const pack = PACK_TYPES[packId];
                     return (
                       <div key={idx} className={`bg-black/60 border rounded-xl p-5 flex justify-between items-center shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.02] ${pack.color}`}>
                         <div className="flex items-center gap-5">
                           <span className="text-5xl drop-shadow-md">{pack.img}</span>
                           <div>
                             <div className="text-xl font-extrabold text-white drop-shadow-md">{pack.name}</div>
                             <div className="text-sm text-gray-300">Contains {pack.cards} NFT Cards</div>
                           </div>
                         </div>
                         <button onClick={() => openPack(packId)} className="bg-gradient-to-r from-orange-600 to-amber-600 flashy-btn px-6 py-3 rounded-lg font-extrabold text-white uppercase shadow-[0_0_25px_rgba(249,115,22,0.6)]">Decypher</button>
                       </div>
                     );
                   })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'pack_opening') {
    return (
      <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center relative p-8">
        <SparkleStyles />
        <div className="absolute top-4 right-4 z-50">
           <button onClick={() => setSoundEnabled(!soundEnabled)} className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full border border-gray-600 text-xs font-bold transition-all shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {soundEnabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF'}
           </button>
        </div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-60 bg-drift z-0 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-900/50 via-blue-900/40 to-black z-0 pointer-events-none animate-bg-pan bg-[length:200%_200%]"></div>
        
        <div className="z-10 text-center mb-12">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-300 to-cyan-400 mb-2 drop-shadow-[0_0_20px_rgba(217,70,239,0.7)]">Decyphering NFT Data...</h1>
          <p className="text-gray-200 uppercase tracking-widest text-sm font-bold">Minting cards to {hubUsername}'s Ledger</p>
        </div>

        <div className="z-10 flex gap-6 flex-wrap justify-center max-w-5xl">
           {openedCards.map((card, idx) => (
              <div 
                key={idx} 
                className={`transition-all duration-1000 transform ${isOpening ? 'scale-0 rotate-180 opacity-0' : 'scale-100 rotate-0 opacity-100 hover:scale-110 hover:z-50'}`}
                style={{ transitionDelay: `${idx * 200}ms` }}
              >
                <div className={`relative rounded-xl ${card.rarity === 'legendary' ? 'shadow-[0_0_50px_#eab308] border border-yellow-300' : card.rarity === 'epic' ? 'shadow-[0_0_40px_#d946ef] border border-fuchsia-400' : card.rarity === 'rare' ? 'shadow-[0_0_30px_#3b82f6] border border-blue-400' : 'shadow-xl'}`}>
                   {renderCard({...card, hasAttacked: false}, idx, false)}
                   <div className={`absolute -top-3 -right-3 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase border tracking-wider z-50 ${
                      card.rarity === 'legendary' ? 'bg-yellow-500 text-black border-yellow-200 shadow-[0_0_25px_#eab308]' :
                      card.rarity === 'epic' ? 'bg-purple-600 text-white border-purple-300 shadow-[0_0_20px_#d946ef]' :
                      card.rarity === 'rare' ? 'bg-blue-600 text-white border-blue-300 shadow-[0_0_15px_#3b82f6]' :
                      'bg-gray-600 text-white border-gray-400'
                   }`}>
                     {card.rarity}
                   </div>
                </div>
              </div>
           ))}
        </div>

        {!isOpening && (
          <button 
            onClick={collectCards}
            className="z-10 mt-16 bg-white text-black hover:bg-gray-200 px-10 py-4 rounded-full font-extrabold text-xl shadow-[0_0_30px_rgba(255,255,255,0.8)] transition-all animate-pulse"
          >
            Collect Cards & Return
          </button>
        )}
      </div>
    );
  }

  if (view === 'editor') {
     const deckCounts = {};
     editingDeck.forEach(c => deckCounts[c] = (deckCounts[c] || 0) + 1);

     return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-6 relative">
           <SparkleStyles />
           <div className="absolute top-4 right-4 z-50">
              <button onClick={() => setSoundEnabled(!soundEnabled)} className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full border border-gray-600 text-xs font-bold transition-all shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                 {soundEnabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF'}
              </button>
           </div>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-60 bg-drift z-0 pointer-events-none"></div>
           <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/30 via-blue-900/30 to-black z-0 pointer-events-none animate-bg-pan bg-[length:200%_200%]"></div>

           <div className="z-10 w-full max-w-6xl bg-black/80 border border-cyan-400/60 rounded-2xl p-6 backdrop-blur-xl shadow-[0_0_60px_rgba(6,182,212,0.3)] flex flex-col h-[90vh]">
              
              <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4 shrink-0">
                <div>
                  <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">Deck Engineering Bay</h1>
                  <p className="text-gray-300 text-sm mt-1 uppercase tracking-widest font-bold">Modifying: <span className="text-white">{deckInfo[selectedDeckKey].name}</span></p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-gray-800/80 px-5 py-2 rounded-lg border border-gray-500 flex items-center gap-3 shadow-inner">
                    <span className="text-gray-300 font-bold">Deck Size:</span>
                    <span className={`font-extrabold text-2xl ${editingDeck.length >= 20 ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]' : 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`}>{editingDeck.length}</span>
                    <span className="text-gray-400 font-bold">/ 34</span>
                  </div>
                  <button onClick={saveDeck} className="bg-gradient-to-r from-cyan-600 to-blue-600 flashy-btn px-8 py-2 rounded-lg font-extrabold text-lg text-white transition-all shadow-[0_0_25px_rgba(6,182,212,0.6)]">Save & Return</button>
                </div>
              </div>

              <div className="flex gap-6 flex-1 min-h-0">
                 <div className="w-2/3 bg-gray-800/60 rounded-xl border border-gray-600 p-5 flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <div className="flex justify-between items-center border-b border-gray-600 pb-3 mb-4 shrink-0">
                       <h2 className="text-base font-extrabold text-cyan-400 uppercase tracking-widest drop-shadow-md">Web3 Inventory (Sandbox)</h2>
                       <span className="text-sm text-gray-300 font-bold">Click card to add to deck.</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                       <div className="flex flex-wrap gap-5">
                          {Object.keys(CARD_LIBRARY).map(cardKey => {
                             const card = CARD_LIBRARY[cardKey];
                             const owned = collection[cardKey] || 0;
                             const inDeck = deckCounts[cardKey] || 0;
                             const canAdd = inDeck < owned && editingDeck.length < 34;

                             return (
                                <div key={cardKey} className="relative group cursor-pointer transition-transform hover:scale-105" onClick={() => { if(canAdd) addCardToDeck(cardKey) }}>
                                   {renderCard(card, cardKey, false, true)}
                                   <div className={`absolute inset-0 rounded-lg flex flex-col justify-between p-2 font-bold text-xs backdrop-blur-[2px] transition-all ${canAdd ? 'bg-black/50 opacity-0 group-hover:opacity-100' : 'bg-black/80'}`}>
                                      <div className="text-center text-white bg-black/80 rounded py-1 border border-gray-600">Owned: {owned}</div>
                                      <div className="text-center text-cyan-300 bg-black/80 rounded py-1 border border-cyan-900">In Deck: {inDeck}</div>
                                   </div>
                                </div>
                             )
                          })}
                       </div>
                    </div>
                 </div>

                 <div className="w-1/3 bg-gray-900/80 rounded-xl border border-gray-500 p-5 flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <h2 className="text-base font-extrabold text-white uppercase tracking-widest border-b border-gray-600 pb-3 mb-4 shrink-0">Current Deck List</h2>
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
                       {editingDeck.length === 0 && <div className="text-gray-400 italic text-base text-center mt-10">Deck is empty. Add cards from your inventory.</div>}
                       {editingDeck.map((cardKey, index) => {
                           const card = CARD_LIBRARY[cardKey];
                           return (
                              <div key={index} onClick={() => removeCardFromDeck(index)} className={`flex items-center gap-4 p-3 rounded-lg border border-gray-600 bg-gray-800 cursor-pointer hover:bg-red-900/70 hover:border-red-400 transition-all group shadow-md`}>
                                 <div className="text-2xl w-8 text-center drop-shadow-md">{card.art}</div>
                                 <div className="flex-1">
                                    <div className="text-sm font-extrabold text-gray-100 group-hover:text-red-100">{card.name}</div>
                                    <div className="text-[11px] font-bold text-gray-400">{card.type.toUpperCase()}</div>
                                 </div>
                                 <div className="opacity-0 group-hover:opacity-100 text-red-400 text-xs font-extrabold px-3 bg-black/50 py-1 rounded">REMOVE</div>
                              </div>
                           )
                       })}
                    </div>
                 </div>
              </div>
           </div>
        </div>
     );
  }

  if (view === 'lobby') {
    const activeDeck = deckInfo[selectedDeckKey] || deckInfo['harvester'];
    const activeCommander = activeDeck.commanders[selectedCommander];

    return (
      <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center relative p-8">
        <SparkleStyles />
        <div className="absolute top-4 right-4 z-50">
           <button onClick={() => { initAudio(); setSoundEnabled(!soundEnabled); }} className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full border border-gray-600 text-xs font-bold transition-all shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {soundEnabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF'}
           </button>
        </div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-60 bg-drift z-0 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-800/40 via-purple-900/40 to-black z-0 pointer-events-none animate-bg-pan bg-[length:200%_200%]"></div>

        <div className="z-10 w-full max-w-6xl bg-black/80 border border-purple-400/50 rounded-3xl p-7 backdrop-blur-xl shadow-[0_0_60px_rgba(168,85,247,0.3)] flex flex-col h-[85vh]">
          
          <div className="flex justify-between items-center border-b border-gray-600 pb-5 mb-6 shrink-0">
            <div>
              <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-300 to-cyan-400 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">Unipiggy: Metaverse Migration</h1>
              <p className="text-gray-300 uppercase tracking-widest text-sm mt-2 font-bold">Command Bridge - Pre-Flight Setup</p>
            </div>
            <div className="flex items-center gap-5">
              <div className="bg-gray-800/80 px-4 py-2 rounded-xl border border-gray-500 flex items-center gap-3 text-base shadow-inner">
                <span className="text-gray-300 font-bold">Hub ID:</span>
                <input 
                  type="text" 
                  value={hubUsername} 
                  onChange={(e) => setHubUsername(e.target.value)}
                  className="bg-transparent text-white font-extrabold outline-none w-36 border-b-2 border-gray-500 focus:border-fuchsia-400 transition-colors"
                />
              </div>
              <div className="bg-gray-800/80 px-5 py-3 rounded-full border border-gray-500 flex items-center gap-3 shadow-inner">
                <span className="text-blue-400 font-extrabold text-xl drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">{radhBalance.toLocaleString()} $RADH</span>
                <button onClick={transferRadhToHub} className="ml-2 bg-gradient-to-r from-blue-600 to-cyan-600 flashy-btn text-white text-xs px-3 py-1.5 rounded-full font-extrabold transition-all shadow-[0_0_15px_rgba(6,182,212,0.6)]">TO HUB ↗</button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex gap-7 min-h-0">
            
            <div className="w-1/3 flex flex-col gap-4 bg-gray-800/50 p-5 rounded-2xl border border-gray-600 overflow-y-auto custom-scrollbar shadow-[0_0_20px_rgba(0,0,0,0.4)]">
              <h3 className="text-base text-gray-300 uppercase font-extrabold sticky top-0 bg-gray-900/90 backdrop-blur z-10 py-2 rounded-t drop-shadow-md">1. Select Faction</h3>
              {Object.entries(deckInfo).map(([key, deck]) => (
                <button 
                  key={key} 
                  onClick={() => { sfx.click(soundEnabled); setSelectedDeckKey(key); setSelectedCommander(0); }} 
                  className={`p-5 rounded-xl border-2 text-left transition-all ${selectedDeckKey === key ? deck.style + ' scale-[1.03] shadow-[0_0_20px_rgba(255,255,255,0.2)] ring-2 ring-white/60' : 'bg-gray-800 border-gray-600 hover:bg-gray-700 opacity-80 hover:opacity-100'}`}
                >
                  <div className="font-extrabold text-white text-xl drop-shadow-md">{deck.name}</div>
                  <div className="text-sm text-gray-300 font-bold mt-1">{deck.desc}</div>
                </button>
              ))}
            </div>

            <div className="w-1/3 flex flex-col gap-5 bg-gray-800/70 p-6 rounded-2xl border border-gray-600 overflow-y-auto custom-scrollbar shadow-[0_0_20px_rgba(0,0,0,0.4)]">
              <h3 className="text-base text-gray-300 uppercase font-extrabold drop-shadow-md">2. Faction Briefing</h3>
              <div className="text-gray-200 font-medium text-sm leading-relaxed border-l-4 border-indigo-500 pl-4 bg-black/30 p-3 rounded-r-lg">
                "{activeDeck.lore}"
              </div>
              
              <h3 className="text-base text-gray-300 uppercase font-extrabold mt-5 drop-shadow-md">3. Select Fleet Commander</h3>
              <div className="flex flex-col gap-4">
                {activeDeck.commanders.map((cmd, idx) => (
                   <div 
                     key={idx} 
                     onClick={() => { sfx.click(soundEnabled); setSelectedCommander(idx); }}
                     className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedCommander === idx ? 'bg-indigo-900/80 border-indigo-400 ring-2 ring-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-gray-900 border-gray-700 hover:bg-gray-800'}`}
                   >
                     <div className="text-4xl bg-black/60 p-3 rounded-xl border border-gray-600 drop-shadow-lg">{cmd.icon}</div>
                     <div>
                       <div className="font-extrabold text-indigo-50 text-lg drop-shadow-md">{cmd.name}</div>
                       <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1">{cmd.title}</div>
                       <div className="text-xs text-green-300 font-bold font-mono bg-black/60 px-2 py-1 rounded inline-block border border-green-900 shadow-inner">+ {cmd.buff}</div>
                     </div>
                   </div>
                ))}
              </div>
            </div>

            <div className="w-1/3 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-3 pb-2">
              <div className="flex flex-col gap-4 bg-gradient-to-br from-red-900/40 to-black/60 border-2 border-red-500/60 p-6 rounded-2xl shrink-0 shadow-[0_0_25px_rgba(239,68,68,0.2)]">
                 <div className="flex justify-between items-center mb-1 border-b border-red-900/50 pb-2">
                    <h3 className="text-base text-red-400 uppercase font-extrabold drop-shadow-md">Current Target</h3>
                    <span className="text-xs text-red-200 font-bold bg-red-900/50 px-2 py-1 rounded">Stage {campaignStage + 1} / 7</span>
                 </div>
                 <div className="flex items-center gap-3 text-white font-extrabold text-2xl drop-shadow-lg mt-2">
                   <span className="text-3xl">{antagonists[campaignStage].icon}</span> {antagonists[campaignStage].name}
                 </div>
                 <div className="text-sm text-gray-300 font-medium italic mt-1">"{antagonists[campaignStage].desc}"</div>
                 <div className="mt-3 inline-block bg-black/70 px-4 py-2 rounded-lg border border-blue-500/50 text-blue-400 text-sm font-extrabold w-max shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                   Bounty: {antagonists[campaignStage].radhReward} $RADH
                 </div>
              </div>

              <div className="flex flex-col gap-4 shrink-0 bg-gray-800/50 p-5 rounded-2xl border border-gray-600 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                <h3 className="text-base text-gray-300 uppercase font-extrabold drop-shadow-md">PvP Cardback</h3>
                <div className="flex gap-4 flex-wrap">
                  {['player-default-back', 'player-gold-back', 'player-plasma-back', 'matrix-back', 'neon-synth-back', 'hologram-back'].map(style => (
                    <div 
                      key={style} onClick={() => { sfx.click(soundEnabled); setPlayerCardback(style); }}
                      className={`w-14 h-20 rounded-xl cursor-pointer transition-all ${style} ${playerCardback === style ? 'ring-4 ring-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.7)]' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-4 shrink-0 pt-3">
                <div className="flex items-center justify-between text-base bg-gray-900/80 p-4 rounded-xl border-2 border-gray-600 shadow-inner">
                    <span className="text-gray-300 font-bold">Current Deck Size:</span>
                    <span className={`font-extrabold text-xl ${customDecks[selectedDeckKey].length >= 20 ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}>{customDecks[selectedDeckKey].length} / 34</span>
                </div>
                <button onClick={() => { sfx.click(soundEnabled); setView('vault'); }} className="w-full bg-gradient-to-r from-amber-600 to-orange-600 flashy-btn py-4 rounded-xl font-extrabold text-base text-white flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(217,119,6,0.6)] hover:shadow-[0_0_30px_rgba(217,119,6,0.8)] transition-all">
                  <span className="text-xl">🎁</span> <span>Open NFT Supply Drops</span>
                </button>
                <button onClick={openEditor} className="w-full bg-gray-800 hover:bg-gray-700 border-2 border-cyan-500 py-4 rounded-xl font-extrabold text-base text-cyan-300 flex items-center justify-center gap-3 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:text-cyan-100">
                  <span className="text-xl">🛠️</span> <span>Enter Engineering Bay (Edit Deck)</span>
                </button>
                <button onClick={startPvP} className="w-full bg-gray-800 hover:bg-gray-700 border-2 border-red-500/60 py-4 rounded-xl font-extrabold text-base text-red-400 flex items-center justify-center gap-3 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:text-red-200">
                  <span className="text-xl">⚔️</span> <span>Find PvP Match (100 $RADH)</span>
                </button>
                <button onClick={startCampaign} className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 flashy-btn py-5 rounded-xl font-extrabold text-xl text-white shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:shadow-[0_0_40px_rgba(168,85,247,0.8)] transition-all uppercase tracking-widest mt-2">
                  Deploy to Battlefield
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // BATTLE VIEW
  const currentEnemy = isPvP ? pvpEnemy : antagonists[campaignStage];

  return (
    <div className="h-screen w-full bg-gray-900 text-white font-sans overflow-hidden flex flex-col relative selection:bg-fuchsia-500 selection:text-white">
      <SparkleStyles />
      <div className="absolute top-4 right-4 z-50">
         <button onClick={() => setSoundEnabled(!soundEnabled)} className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full border border-gray-600 text-xs font-bold transition-all shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            {soundEnabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF'}
         </button>
      </div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-60 bg-drift z-0 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-purple-900/30 to-black z-0 pointer-events-none animate-bg-pan bg-[length:200%_200%]"></div>

      <header className="relative z-10 flex justify-between items-center p-4 bg-black/90 border-b-2 border-purple-500/50 shrink-0 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
        <div className="flex items-center gap-5">
          <button onClick={() => { sfx.click(soundEnabled); setView('lobby'); }} className="text-gray-300 hover:text-white bg-gray-800 border border-gray-600 hover:border-gray-400 px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all shadow-md">ABORT MISSION</button>
          <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-300 to-cyan-400 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">Battle Interface {isPvP ? '[PVP MODE]' : ''}</h1>
        </div>
        <div className="flex items-center gap-4 text-base">
          <div className="text-indigo-300 font-extrabold tracking-widest drop-shadow-md bg-indigo-900/40 px-4 py-1 rounded border border-indigo-500/50">{turnPhase.toUpperCase()}</div>
        </div>
      </header>

      <main className="flex-1 relative z-10 flex flex-col p-5 gap-5 overflow-hidden">
        
        {/* ENEMY ROW */}
        <div className="flex gap-5 h-52 shrink-0">
          <div className="flex flex-col gap-3 w-52 shrink-0">
            <h2 className="text-red-400 font-extrabold uppercase tracking-widest text-sm truncate flex items-center gap-2 drop-shadow-md">
              <span>{currentEnemy.icon}</span> {currentEnemy.name}
            </h2>
            <div className="bg-red-900/50 border-2 border-red-500 p-3 rounded-xl text-center shadow-[0_0_25px_rgba(239,68,68,0.4)] backdrop-blur-sm">
              <div className="text-xs text-red-300 uppercase font-extrabold mb-1 tracking-wider">Hull Integrity</div>
              <div className="text-4xl font-mono font-extrabold text-white flex items-center justify-center gap-2 drop-shadow-lg"><span>🛸</span> {enemyHull}</div>
            </div>
            <div className="bg-gray-900/80 border border-gray-600 rounded-lg p-3 text-sm font-bold flex justify-between text-gray-300 shadow-inner">
               <span>Cards: <span className="text-white">{enemyHand}</span></span>
               <span>Aether: <span className="text-fuchsia-400">{enemyAetherPool}</span></span>
            </div>
          </div>
          
          <div className="flex-1 flex gap-5 p-5 bg-black/50 rounded-2xl border-2 border-red-900/60 items-center overflow-x-auto custom-scrollbar shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
            {enemyBoard.map((unit, idx) => (
               <div key={idx} className={`w-28 h-44 shrink-0 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.6)] border-2 border-red-400/80 bg-gradient-to-b from-gray-800 to-gray-900 flex flex-col items-center justify-center p-2 relative animate-[slide-up_0.3s_ease-out] ${isPvP ? 'pvp-enemy-back' : ''}`}>
                 <span className="text-5xl mb-3 drop-shadow-lg">{unit.art}</span>
                 <span className="font-extrabold text-xs text-red-300 text-center leading-tight drop-shadow-md px-1">{unit.name}</span>
                 <div className="absolute bottom-2 right-2 bg-black/90 px-2 py-1 rounded text-xs font-bold text-red-400 border border-red-500/50 shadow-lg">{unit.atk}/{unit.def}</div>
               </div>
            ))}
          </div>
        </div>

        {/* PLAYER BOARD ROW */}
        <div className="flex-1 flex flex-col min-h-[200px] bg-cyan-900/20 border-2 border-cyan-500/40 rounded-2xl p-5 overflow-hidden relative shadow-[inset_0_0_50px_rgba(6,182,212,0.15)]">
          <div className="absolute top-3 left-5 text-cyan-400/40 font-extrabold uppercase tracking-widest text-3xl pointer-events-none drop-shadow-md">Battlefield</div>
          <div className="w-full h-full flex gap-5 overflow-x-auto custom-scrollbar items-center pb-2 z-10">
            {board.map((card, idx) => renderCard(card, idx, false))}
          </div>
        </div>

        {/* PLAYER CONTROL ROW */}
        <div className="h-60 shrink-0 flex gap-5 pt-2">
          <div className="w-52 flex flex-col gap-3 shrink-0">
             <div className={`flex-1 rounded-2xl flex flex-col items-center justify-center opacity-90 shadow-[0_0_20px_rgba(255,255,255,0.2)] border-2 border-white/30 ${playerCardback}`}>
               <div className="text-4xl mb-2 opacity-60 drop-shadow-lg">🃏</div>
               <span className="bg-black/90 px-4 py-1.5 rounded-full text-sm font-extrabold text-white shadow-inner border border-gray-600">
                 DECK: {deck.length}
               </span>
             </div>
             
             <div className="bg-cyan-900/50 border-2 border-cyan-400 p-3 rounded-2xl text-center shadow-[0_0_25px_rgba(6,182,212,0.4)] backdrop-blur-sm">
              <div className="text-xs text-cyan-300 uppercase font-extrabold mb-1 tracking-wider">Your Hull</div>
              <div className="text-3xl font-mono font-extrabold text-white flex items-center justify-center gap-2 drop-shadow-lg"><span>🛡️</span> {playerHull}<span className="text-base text-cyan-500">/{maxPlayerHull}</span></div>
            </div>
          </div>

          <div className="flex-1 bg-gray-800/70 p-4 rounded-2xl border-2 border-gray-600 flex gap-4 overflow-x-auto custom-scrollbar relative shadow-inner backdrop-blur-sm">
             {hand.map((card) => renderCard(card, card.id, true))}
          </div>

          <div className="w-64 flex flex-col gap-3 shrink-0">
            <div className="bg-gray-900/90 p-4 rounded-2xl border-2 border-gray-600 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] flex flex-col gap-2">
              <div className="text-[11px] text-gray-300 uppercase font-extrabold text-center tracking-widest drop-shadow-md">Aether (Actions)</div>
              <div className="grid grid-cols-2 gap-3 text-base mt-1">
                <div className="flex justify-between items-center bg-black/60 px-3 py-1.5 rounded-lg border border-green-500/50 shadow-md"><span className="text-green-400 drop-shadow-md">🌿</span> <span className="font-mono font-extrabold text-white">{aetherPool.green}</span></div>
                <div className="flex justify-between items-center bg-black/60 px-3 py-1.5 rounded-lg border border-fuchsia-500/50 shadow-md"><span className="text-fuchsia-400 drop-shadow-md">♨️</span> <span className="font-mono font-extrabold text-white">{aetherPool.magenta}</span></div>
                <div className="flex justify-between items-center bg-black/60 px-3 py-1.5 rounded-lg border border-purple-500/50 shadow-md"><span className="text-purple-400 drop-shadow-md">🔮</span> <span className="font-mono font-extrabold text-white">{aetherPool.black}</span></div>
                <div className="flex justify-between items-center bg-black/60 px-3 py-1.5 rounded-lg border border-cyan-500/50 shadow-md"><span className="text-cyan-400 drop-shadow-md">💧</span> <span className="font-mono font-extrabold text-white">{aetherPool.blue}</span></div>
              </div>
            </div>

            <div className="flex-1 bg-black/90 rounded-2xl border-2 border-gray-700 p-3 flex flex-col overflow-hidden text-xs font-mono shadow-inner">
               <div className="text-gray-400 border-b border-gray-700 pb-1.5 mb-2 font-bold tracking-widest">TERMINAL LOG</div>
               <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 text-gray-300 pr-1">
                 {combatLog.map((log, i) => ( <div key={i} className="drop-shadow-sm">&gt; {log}</div> ))}
                 <div ref={logEndRef} />
               </div>
            </div>

            <button 
               onClick={endTurn} disabled={turnPhase !== 'Player Turn'}
               className={`py-4 rounded-2xl font-extrabold transition-all text-base uppercase tracking-widest shadow-lg ${turnPhase === 'Player Turn' ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 flashy-btn text-white shadow-[0_0_20px_rgba(168,85,247,0.6)] border-0' : 'bg-gray-800 text-gray-500 border-2 border-gray-700 cursor-not-allowed'}`}
             >
               {turnPhase === 'Player Turn' ? 'End Turn' : 'Enemy Thinking...'}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
