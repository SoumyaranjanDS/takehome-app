const fs = require('fs');
const path = require('path');

const screensDir = 'c:/Users/soumy/OneDrive/Desktop/HTML/app-test/PadosiProApp/src/screens';
const screens = fs.readdirSync(screensDir).filter(f => f.endsWith('.jsx'));

for (const screen of screens) {
  const filePath = path.join(screensDir, screen);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Remove BackgroundGraphics component
  content = content.replace(/const BackgroundGraphics = \(\) => \([\s\S]*?\);\n\n/g, '');
  
  // 2. Remove <BackgroundGraphics /> from JSX
  content = content.replace(/<BackgroundGraphics \/>\n?\s*/g, '');

  // 3. Remove graphicCircle styles from StyleSheet
  content = content.replace(/\/\/ Background Graphics[\s\S]*?graphicCircle1: \{[\s\S]*?\},/g, '');
  content = content.replace(/graphicCircle[1-3]: \{[\s\S]*?\},/g, '');
  
  // 4. Remove all fontFamily overrides to fallback to system default (San Francisco/Roboto)
  content = content.replace(/fontFamily:\s*[^,]+,/g, '');

  // 5. Update typography styles for a professional look
  content = content.replace(/brandText:\s*\{[^}]+\}/g, "brandText: { fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 12 }");
  content = content.replace(/title:\s*\{[^}]+\}/g, "title: { fontSize: 36, fontWeight: '800', color: colors.primary, marginBottom: 12, letterSpacing: -1 }");
  content = content.replace(/subtitle:\s*\{[^}]+\}/g, "subtitle: { fontSize: 16, color: colors.textMuted, lineHeight: 24 }");
  
  fs.writeFileSync(filePath, content);
}

// Write new professional colors
const colorsContent = `export const colors = {
  background: '#09090B', // Zinc 950
  surface: '#18181B', // Zinc 900
  primary: '#FAFAFA', // Zinc 50
  primaryLight: '#3B82F6', // Blue 500 for subtle accents
  secondary: '#27272A', // Zinc 800
  text: '#FAFAFA',
  textMuted: '#A1A1AA', // Zinc 400
  border: '#27272A',
  error: '#EF4444', // Red 500
  white: '#FFFFFF',
  transparent: 'transparent',
};`;
fs.writeFileSync('c:/Users/soumy/OneDrive/Desktop/HTML/app-test/PadosiProApp/src/theme/colors.js', colorsContent);

console.log("UI updated to Professional Minimalist Dark Theme.");
