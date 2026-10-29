// ==============================================================================
// LYPSYOS SECURITY GUARD - UTILITÁRIOS DE SEGURANÇA, SENHAS E ANTI-BOT
// ==============================================================================

/**
 * Avalia a força da senha de acordo com padrões modernos (NIST SP 800-63B)
 * @param {string} password 
 * @returns {Object} score, label, color, feedback, isValid
 */
export function evaluatePasswordStrength(password = '') {
  if (!password) {
    return {
      score: 0,
      label: 'Vazia',
      color: 'bg-slate-200 text-slate-500',
      barColor: 'bg-slate-200',
      width: '0%',
      feedback: ['Digite uma senha segura'],
      isValid: false
    };
  }

  const feedback = [];
  let score = 0;

  // 1. Comprimento
  if (password.length >= 8) score += 1;
  else feedback.push('Pelo menos 8 caracteres');

  if (password.length >= 12) score += 1;

  // 2. Complexidade
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (hasLower && hasUpper) score += 1;
  else feedback.push('Letras maiúsculas e minúsculas');

  if (hasNumber) score += 1;
  else feedback.push('Pelo menos um número');

  if (hasSpecial) score += 1;
  else feedback.push('Pelo menos um símbolo (ex: @, #, !)');

  // 3. Bloqueio de senhas comuns óbvias
  const commonPasswords = ['123456', '12345678', 'password', 'senha123', 'admin123', 'manicure123', 'salao123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    return {
      score: 1,
      label: 'Muito Fraca (Óbvia)',
      color: 'bg-rose-100 text-rose-700',
      barColor: 'bg-rose-500',
      width: '20%',
      feedback: ['Essa senha é comum demais e fácil de adivinhar.'],
      isValid: false
    };
  }

  // Normaliza pontuação de 0 a 4
  const normalizedScore = Math.min(4, Math.floor(score * 0.8));

  switch (normalizedScore) {
    case 0:
    case 1:
      return {
        score: 1,
        label: 'Fraca',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        barColor: 'bg-rose-500',
        width: '25%',
        feedback: feedback.length ? feedback : ['Adicione mais variedade de caracteres'],
        isValid: false
      };
    case 2:
      return {
        score: 2,
        label: 'Média',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        barColor: 'bg-amber-500',
        width: '50%',
        feedback: feedback,
        isValid: password.length >= 8
      };
    case 3:
      return {
        score: 3,
        label: 'Boa',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        barColor: 'bg-blue-600',
        width: '75%',
        feedback: feedback,
        isValid: true
      };
    case 4:
    default:
      return {
        score: 4,
        label: 'Forte & Segura',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        barColor: 'bg-emerald-500',
        width: '100%',
        feedback: ['Excelente! Sua senha está bem protegida.'],
        isValid: true
      };
  }
}

/**
 * Gera uma senha forte criptograficamente segura
 * @param {number} length 
 * @returns {string} senha gerada
 */
export function generateStrongPassword(length = 16) {
  const lowercase = 'abcdefghijkmnopqrstuvwxyz'; // sem 'l' ambíguo
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sem 'I', 'O'
  const numbers = '23456789'; // sem '1', '0'
  const symbols = '!@#$%&*_-+=?';

  const allChars = lowercase + uppercase + numbers + symbols;

  // Garante ao menos 1 de cada categoria
  const guaranteed = [
    lowercase[Math.floor(Math.random() * lowercase.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  const randomValues = new Uint32Array(length - guaranteed.length);
  window.crypto.getRandomValues(randomValues);

  const remainder = [];
  for (let i = 0; i < randomValues.length; i++) {
    remainder.push(allChars[randomValues[i] % allChars.length]);
  }

  // Embaralha com Fisher-Yates
  const passwordArray = [...guaranteed, ...remainder];
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
}

/**
 * Detecção de Automação / Bots / Web Scraping no Cliente
 */
export const BotDefense = {
  /**
   * Verifica se o navegador está sob controle automatizado (Selenium, Puppeteer, Playwright)
   */
  isAutomatedBrowser: () => {
    try {
      if (typeof window === 'undefined') return false;
      // Headless Chrome / WebDriver flag
      if (navigator.webdriver) return true;
      if (window.document.documentElement.getAttribute('webdriver')) return true;
      if (window.__puppeteer_evaluation_script__ !== undefined) return true;
      if (window.__playwright !== undefined) return true;
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Honeypot Check: Se o campo invisível foi preenchido, é um bot de preenchimento automático
   */
  isHoneypotTriggered: (value) => {
    return Boolean(value && value.trim().length > 0);
  },

  /**
   * Timestamp Defense: Verifica se o envio do formulário foi rápido demais (< 1.2 segundos para humanos)
   */
  isTooFastSubmission: (startTime, minDurationMs = 1200) => {
    if (!startTime) return false;
    return (Date.now() - startTime) < minDurationMs;
  }
};

