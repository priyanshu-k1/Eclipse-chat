function generateRandomName() {
  const adjectives = [
    'Supreme', 'Mighty', 'Ancient', 'Golden', 'Silent', 'Blazing', 'Frozen', 'Wild',
    'Noble', 'Fierce', 'Mystic', 'Electric', 'Cosmic', 'Shadow', 'Crystal', 'Thunder',
    'Crimson', 'Silver', 'Jade', 'Phantom', 'Stellar', 'Emerald', 'Obsidian', 'Radiant',
    'Savage', 'Ethereal', 'Titanium', 'Velvet', 'Iron', 'Diamond', 'Neon', 'Lunar',
    'Galactic', 'Solar', 'Celestial', 'Orbital', 'Interstellar', 'Cosmic', 'Nebula',
    'Comet', 'Vortex', 'Quasar', 'Stardust', 'Asteroid', 'Planetary', 'Supernova',
    'Singular', 'Warped', 'Binary', 'Twilight', 'Zenith', 'Abyssal', 'Astro',
    'Chrono', 'Crescent', 'Drifting', 'Echoing', 'Gravitational', 'Hyper',
    'Ionized', 'Kinetic', 'Luminous', 'Meteor', 'Polaris', 'Quantum', 'Seraphic',
    'Temporal', 'Vacuum', 'Vapor', 'Zodiacal', 'Helios', 'Saturnine', 'Martian'
  ];

  const nouns = [
    'Monkey', 'Dragon', 'Wolf', 'Phoenix', 'Tiger', 'Eagle', 'Shark', 'Panther',
    'Falcon', 'Lion', 'Bear', 'Raven', 'Fox', 'Hawk', 'Viper', 'Stallion',
    'Warrior', 'Knight', 'Guardian', 'Hunter', 'Ninja', 'Samurai', 
    'Wizard','Scholar','Titan', 'Champion', 'Legend', 'Master', 'Sage', 'Ghost', 
    'Storm', 'Blade','Pulsar', 'Nova', 'Comet', 'Nebula', 'Galaxy', 'Astronaut', 
    'Cosmonaut','Satellite', 'Orbit', 'Star', 'Vortex', 'Quasar', 'Eclipse', 'Meteor',
    'Drift', 'Warp', 'Vector', 'Nexus', 'Horizon', 'Core', 'Cluster', 'Beacon',
    'Cygnus', 'Orion', 'Centauri', 'Polaris', 'Spire', 'Sphere', 'Nexus',
    'Chaser', 'Echo', 'Wanderer', 'Stray', 'Glitch', 'Flux', 'Phantom',
    'Sentry', 'Oracle', 'Monolith', 'Titan', 'Vagabond', 'Rider', 'Spectre'
  ];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective} ${randomNoun}`;
}

module.exports=generateRandomName;
