export function isHebrew(text: string): boolean {
  const hebPattern = /[\u0590-\u05FF]/;
  return hebPattern.test(text);
}

export function getDirection(text: string): 'rtl' | 'ltr' {
  return isHebrew(text) ? 'rtl' : 'ltr';
}
