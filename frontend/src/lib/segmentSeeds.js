export const SEGMENTS = [
  {
    id: 'manicure',
    title: 'Manicure & Nail Designer',
    description: 'Unhas, esmaltação em gel, spa e alongamentos.',
    icon: '💅',
    defaultServices: [
      { name: 'Manicure Tradicional', price: 35.0, duration_minutes: 45 },
      { name: 'Pedicure Completa', price: 45.0, duration_minutes: 50 },
      { name: 'Alongamento em Gel / Fibra', price: 120.0, duration_minutes: 120 },
      { name: 'Spa dos Pés & Mãos', price: 85.0, duration_minutes: 75 }
    ]
  },
  {
    id: 'barbearia',
    title: 'Barbearia & Barber Shop',
    description: 'Cortes masculinos, barba na navalha e cuidados.',
    icon: '💈',
    defaultServices: [
      { name: 'Corte Degradê / Social', price: 45.0, duration_minutes: 40 },
      { name: 'Barboterapia com Toalha Quente', price: 40.0, duration_minutes: 35 },
      { name: 'Combo Cabelo + Barba', price: 75.0, duration_minutes: 60 },
      { name: 'Pézinho & Acabamento', price: 20.0, duration_minutes: 20 }
    ]
  },
  {
    id: 'salao',
    title: 'Salão de Beleza & Cabelos',
    description: 'Cortes, escovas, mechas, tratamentos capilares.',
    icon: '💇‍♀️',
    defaultServices: [
      { name: 'Escova Modelada + Lavagem', price: 60.0, duration_minutes: 45 },
      { name: 'Corte Feminino com Visagismo', price: 85.0, duration_minutes: 50 },
      { name: 'Hidratação Profunda / Nutrição', price: 110.0, duration_minutes: 60 },
      { name: 'Coloração & Mechas', price: 220.0, duration_minutes: 150 }
    ]
  },
  {
    id: 'estetica',
    title: 'Estética & Sobrancelhas',
    description: 'Design de sobrancelhas, limpeza de pele e massagens.',
    icon: '✨',
    defaultServices: [
      { name: 'Design de Sobrancelhas com Henna', price: 45.0, duration_minutes: 35 },
      { name: 'Limpeza de Pele Profunda', price: 130.0, duration_minutes: 75 },
      { name: 'Drenagem Linfática Corporal', price: 95.0, duration_minutes: 60 },
      { name: 'Massagem Relaxante com Óleos', price: 100.0, duration_minutes: 60 }
    ]
  },
  {
    id: 'outro',
    title: 'Consultoria & Serviços Gerais',
    description: 'Psicologia, advocacia, tatuagem e outros serviços.',
    icon: '💼',
    defaultServices: [
      { name: 'Consulta / Atendimento Inicial', price: 150.0, duration_minutes: 60 },
      { name: 'Sessão de Retorno / Acompanhamento', price: 100.0, duration_minutes: 45 }
    ]
  }
];

