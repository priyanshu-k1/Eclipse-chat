function AvatarGenerator(name) {
  const initial = (name && name.length > 0) ? name[0].toUpperCase() : '?';
  const gradientColors = [
    ["3B82F6", "9333EA"],   
    ["9333EA", "F59E0B"], 
    ["0F172A", "3B82F6"], 
    ["1A1A40", "F59E0B"], 
    ["1E1E2F", "00C2FF"], 
  ];
  const charCodeSum = name ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  const gradientIndex = charCodeSum % gradientColors.length;

  const [color1, color2] = gradientColors[gradientIndex];
  const textColor = "FFFFFF"; 
  const size = 80; 
  return `https://placehold.co/${size}x${size}/${color1}/${textColor}?text=${initial}&font=Montserrat&bg=${color1},${color2}&radius=50`;
}

export default AvatarGenerator;
