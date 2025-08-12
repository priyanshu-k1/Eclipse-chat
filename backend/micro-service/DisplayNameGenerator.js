function generateRandomName() {
  const adjectives = [
    'Supreme', 'Mighty', 'Ancient', 'Golden', 'Silent', 'Blazing', 'Frozen', 'Wild',
    'Noble', 'Fierce', 'Mystic', 'Electric', 'Cosmic', 'Shadow', 'Crystal', 'Thunder',
    'Crimson', 'Silver', 'Jade', 'Phantom', 'Stellar', 'Emerald', 'Obsidian', 'Radiant',
    'Savage', 'Ethereal', 'Titanium', 'Velvet', 'Iron', 'Diamond', 'Neon', 'Lunar'
  ];

  const nouns = [
    'Monkey', 'Dragon', 'Wolf', 'Phoenix', 'Tiger', 'Eagle', 'Shark', 'Panther',
    'Falcon', 'Lion', 'Bear', 'Raven', 'Fox', 'Hawk', 'Viper', 'Stallion',
    'Warrior', 'Knight', 'Guardian', 'Hunter', 'Ninja', 'Samurai', 
    'Wizard','Scholar','Titan', 'Champion', 'Legend', 'Master', 'Sage', 'Ghost', 'Storm', 'Blade'
  ];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective} ${randomNoun}`;
}

module.exports=generateRandomName;
