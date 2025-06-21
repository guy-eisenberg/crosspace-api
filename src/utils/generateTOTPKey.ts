export function generateTOTPKey() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let key = '';

  for (let i = 0; i < 32; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    key += characters[randomIndex];
  }

  return key;
}
