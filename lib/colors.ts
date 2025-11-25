// Retro color palette inspired by vintage Olympic posters
// Warm, muted tones with gradation - not standard rainbow

export const FAMILY_COLORS = [
  {
    id: "mustard",
    name: "Mustard",
    value: "#E8B339",
    textColor: "#1F1A0D", // Dark text for light background
  },
  {
    id: "coral",
    name: "Coral",
    value: "#E57F7F",
    textColor: "#1F0F0F",
  },
  {
    id: "terracotta",
    name: "Terracotta",
    value: "#B85A4A",
    textColor: "#FFFFFF",
  },
  {
    id: "burnt-orange",
    name: "Burnt Orange",
    value: "#E8824D",
    textColor: "#1F1F1F",
  },
  {
    id: "teal",
    name: "Teal",
    value: "#4A9B9B",
    textColor: "#FFFFFF",
  },
  {
    id: "dusty-blue",
    name: "Dusty Blue",
    value: "#6B8FB3",
    textColor: "#FFFFFF",
  },
  {
    id: "sage",
    name: "Sage",
    value: "#88A681",
    textColor: "#1F1F1F",
  },
  {
    id: "lavender",
    name: "Lavender",
    value: "#A98BB3",
    textColor: "#FFFFFF",
  },
] as const;

export type FamilyColorId = typeof FAMILY_COLORS[number]["id"];

export function getColorById(id: string) {
  return FAMILY_COLORS.find((c) => c.id === id) || FAMILY_COLORS[0];
}

export function getRandomColor() {
  return FAMILY_COLORS[Math.floor(Math.random() * FAMILY_COLORS.length)];
}

export function getNextAvailableColor(usedColors: string[]) {
  const available = FAMILY_COLORS.filter((c) => !usedColors.includes(c.id));
  return available.length > 0 ? available[0] : getRandomColor();
}

export function getRandomAvailableColor(usedColors: string[]) {
  const available = FAMILY_COLORS.filter((c) => !usedColors.includes(c.id));
  if (available.length === 0) return getRandomColor();
  // Randomly select from available colors
  return available[Math.floor(Math.random() * available.length)];
}
