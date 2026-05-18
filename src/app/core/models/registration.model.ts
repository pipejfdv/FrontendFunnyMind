export type MembershipType = 'DemoUser' | 'PremiumUser';

export interface MembershipPlan {
  type: MembershipType;
  name: string;
  price: string;
  features: string[];
  limitations: string[];
  color: string;
}

export interface DocumentType {
  id: string;
  type: string;
}

export interface Relationship {
  id: string;
  relationship: string;
}

export interface TceClassification {
  id: string;
  classification: string;
}

export interface WizardData {
  // Step 1 - Guardian
  guardian: {
    name: string;
    lastname: string;
    phone: string;
    biography: string;
    documentTypeId: string;
    document: string;
  };
  // Step 2 - Relationship
  relationshipId: string;
  // Step 3 - Child
  child: {
    names: string;
    lastName: string;
    birthDate: string;
    documentTypeId: string;
    document: string;
  };
  // Step 4 - TCE
  tceClassificationId: string | null;
  usesQuestionnaire: boolean;
  questionnaireAnswers: number[];
}

export interface TceQuestion {
  id: number;
  question: string;
  options: { value: number; label: string }[];
}

export const TCE_QUESTIONS: TceQuestion[] = [
  {
    id: 1, question: '¿El niño perdió el conocimiento?',
    options: [
      { value: 0, label: 'No' },
      { value: 4, label: 'Menos de 5 minutos' },
      { value: 8, label: 'Entre 5 y 30 minutos' },
      { value: 13, label: 'Más de 30 minutos' },
    ],
  },
  {
    id: 2, question: '¿Abre los ojos?',
    options: [
      { value: 4, label: 'Sí, con normalidad' },
      { value: 3, label: 'Solo al llamarlo' },
      { value: 2, label: 'Solo al sentir dolor' },
      { value: 1, label: 'No abre los ojos' },
    ],
  },
  {
    id: 3, question: '¿Cómo responde al hablarle?',
    options: [
      { value: 5, label: 'Está orientado, responde bien' },
      { value: 4, label: 'Está confundido' },
      { value: 3, label: 'Dice palabras sueltas' },
      { value: 2, label: 'Solo hace sonidos' },
      { value: 1, label: 'No responde' },
    ],
  },
  {
    id: 4, question: '¿Cómo se mueve?',
    options: [
      { value: 6, label: 'Obedece órdenes, movimiento normal' },
      { value: 5, label: 'Localiza el dolor' },
      { value: 4, label: 'Retira extremidades del dolor' },
      { value: 3, label: 'Flexión anormal (decorticación)' },
      { value: 2, label: 'Extensión anormal (descerebración)' },
      { value: 1, label: 'No se mueve' },
    ],
  },
  {
    id: 5, question: '¿Tuvo convulsiones?',
    options: [
      { value: 0, label: 'No' },
      { value: 5, label: 'Sí' },
    ],
  },
  {
    id: 6, question: '¿Presentó vómitos?',
    options: [
      { value: 0, label: 'No' },
      { value: 3, label: 'Una o dos veces' },
      { value: 6, label: 'Varias veces / persistentes' },
    ],
  },
  {
    id: 7, question: '¿Se queja de dolor de cabeza?',
    options: [
      { value: 0, label: 'No' },
      { value: 2, label: 'Leve' },
      { value: 5, label: 'Fuerte o persistente' },
    ],
  },
  {
    id: 8, question: '¿Tiene visión borrosa o doble?',
    options: [
      { value: 0, label: 'No' },
      { value: 4, label: 'Sí' },
    ],
  },
  {
    id: 9, question: '¿Presenta mareos o pérdida de equilibrio?',
    options: [
      { value: 0, label: 'No' },
      { value: 3, label: 'Sí, leves' },
      { value: 6, label: 'Sí, severos' },
    ],
  },
  {
    id: 10, question: '¿Ha notado cambios en su comportamiento?',
    options: [
      { value: 0, label: 'No' },
      { value: 3, label: 'Sí, está irritable' },
      { value: 6, label: 'Sí, cambio drástico' },
    ],
  },
  {
    id: 11, question: '¿Tiene dificultad para hablar?',
    options: [
      { value: 0, label: 'No' },
      { value: 5, label: 'Sí' },
    ],
  },
  {
    id: 12, question: '¿Presenta debilidad en brazos o piernas?',
    options: [
      { value: 0, label: 'No' },
      { value: 4, label: 'Sí, en un lado' },
      { value: 7, label: 'Sí, en ambos lados' },
    ],
  },
  {
    id: 13, question: '¿Sangrado por nariz u oídos?',
    options: [
      { value: 0, label: 'No' },
      { value: 7, label: 'Sí' },
    ],
  },
  {
    id: 14, question: '¿Las pupilas están normales?',
    options: [
      { value: 0, label: 'Sí, normales y reaccionan' },
      { value: 4, label: 'Están dilatadas' },
      { value: 8, label: 'Una más grande que la otra' },
    ],
  },
  {
    id: 15, question: '¿Recuerda lo que pasó durante el accidente?',
    options: [
      { value: 0, label: 'Sí, lo recuerda todo' },
      { value: 2, label: 'Recuerda partes' },
      { value: 5, label: 'No recuerda nada' },
    ],
  },
];

export function calculateTceEstimation(answers: number[]): string {
  let totalScore = 0;

  // GCS component (questions 2-4)
  const gcs = answers[1] + answers[2] + answers[3]; // eye + verbal + motor (range 3-15)
  totalScore += Math.max(0, 15 - gcs) * 2; // lower GCS = more severity points

  // Loss of consciousness (question 1)
  totalScore += answers[0];

  // Severity symptoms (questions 5-15)
  for (let i = 4; i < answers.length; i++) {
    totalScore += answers[i];
  }

  if (gcs <= 8 || totalScore >= 50) return 'Grave - GCS 3-8';
  if (gcs <= 12 || totalScore >= 25) return 'Moderado - GCS 9-12';
  return 'Leve - GCS 13-15';
}
