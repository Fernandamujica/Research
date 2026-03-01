import type { Squad, Country } from '../types/research';

export interface PlannedResearch {
  id: string;
  title: string;
  question: string;
  squad: Squad;
  researcher: string;
  countries: Country[];
  tags: string[];
  month?: string;
}

export const PLANNED_RESEARCH: PlannedResearch[] = [
  // ── Money In ──────────────────────────────────────────────
  {
    id: 'plan-1',
    title: 'Global Keys Experience',
    question:
      'How can we make key registration and management globally scalable while respecting local habits in each country?',
    squad: 'money-in',
    researcher: 'Miriam Matus',
    countries: ['brasil', 'mexico', 'colombia'],
    tags: ['global', 'keys', 'pix', 'identifiers'],
    month: 'Mar 2026',
  },
  {
    id: 'plan-2',
    title: 'CICO Cash-Out Awareness (MX & CO)',
    question:
      'How aware and confident are MX and CO customers about our cash-out options, and what improves perceived ease and safety of withdrawing digital money?',
    squad: 'money-in',
    researcher: 'Miriam Matus',
    countries: ['mexico', 'colombia'],
    tags: ['CICO', 'cash-out', 'awareness'],
    month: 'Apr 2026',
  },
  {
    id: 'plan-3',
    title: 'Pix Experience — Toward a Global Keys Framework',
    question:
      'How can we activate customers who already have a Pix key registered at Nu, and what are they using Pix keys for within Money-in?',
    squad: 'money-in',
    researcher: 'Miriam Matus',
    countries: ['brasil'],
    tags: ['pix', 'keys', 'activation'],
    month: 'Apr 2026',
  },
  {
    id: 'plan-4',
    title: 'One-Click Opportunities Mapping',
    question:
      'What pains and barriers stop people from becoming more active after they connect an external account to Nu via Open Finance?',
    squad: 'money-in',
    researcher: 'Miriam Matus',
    countries: ['brasil'],
    tags: ['open-finance', 'one-click', 'activation'],
    month: 'May 2026',
  },
  {
    id: 'plan-5',
    title: 'Payroll Portability (MX)',
    question:
      'What are the drivers and barriers for choosing a payroll account and switching via portability in MX, and how can Nu position payroll portability to win principality?',
    squad: 'money-in',
    researcher: 'Miriam Matus',
    countries: ['mexico'],
    tags: ['payroll', 'portability', 'principality'],
    month: 'Jun 2026',
  },
  {
    id: 'plan-6',
    title: 'Identifiers Integration with Money Boxes',
    question:
      'How should we couple identifiers to money boxes and what capabilities should they have to improve keys management globally?',
    squad: 'money-in',
    researcher: 'Miriam Matus',
    countries: ['brasil', 'mexico', 'colombia'],
    tags: ['identifiers', 'money-boxes', 'global'],
    month: 'Q3 2026',
  },

  // ── MB & Account XP ───────────────────────────────────────
  {
    id: 'plan-7',
    title: 'Pre-launch Global BR Improvements — Money Boxes',
    question:
      'How are people engaging with the new goal and recurrence features in regions with more or less money restrictions?',
    squad: 'mb-account-xp',
    researcher: 'Anita',
    countries: ['brasil'],
    tags: ['money-boxes', 'pre-launch', 'usability'],
    month: 'Feb 2026',
  },
  {
    id: 'plan-8',
    title: 'Dashboard Money Visibility Post-Launch (BR)',
    question:
      'Is the new dashboard improving the experience and visibility/organization of finances?',
    squad: 'mb-account-xp',
    researcher: 'Anita',
    countries: ['brasil'],
    tags: ['dashboard', 'post-launch', 'money-visibility'],
    month: 'Mar 2026',
  },
  {
    id: 'plan-9',
    title: 'EOY 2026 Dashboard + MBs Magic Vision (MX)',
    question:
      'Money boxes details: savings and spending — does the experience support visibility and engagement?',
    squad: 'mb-account-xp',
    researcher: 'Anita',
    countries: ['mexico', 'colombia'],
    tags: ['dashboard', 'money-boxes', 'magic-vision'],
    month: 'May 2026',
  },
  {
    id: 'plan-10',
    title: 'Dashboard 2.0 (MX & CO)',
    question:
      'How do people relate to the improvements in dashboard 2.0? Does the experience facilitate money management and visibility?',
    squad: 'mb-account-xp',
    researcher: 'Anita',
    countries: ['mexico', 'colombia'],
    tags: ['dashboard', 'money-visibility', 'global'],
    month: 'Apr 2026',
  },
  {
    id: 'plan-11',
    title: 'Dashboard Customer Profiling',
    question:
      'Who are our dashboard users and what financial management behaviors do they exhibit across markets?',
    squad: 'mb-account-xp',
    researcher: 'Anita',
    countries: ['brasil', 'mexico', 'colombia'],
    tags: ['dashboard', 'customer-profiling', 'segmentation'],
    month: 'Q3 2026',
  },

  // ── Payments Assistant ────────────────────────────────────
  {
    id: 'plan-12',
    title: 'Gift Cards Post-Launch Evaluation (MX)',
    question:
      'How do customers receive the gift card experience and what are the opportunities for improvement?',
    squad: 'payments-assistant',
    researcher: 'Erika Martinez',
    countries: ['mexico'],
    tags: ['gift-cards', 'post-launch', 'payments-assistant'],
    month: 'Feb 2026',
  },
  {
    id: 'plan-13',
    title: 'PA MVP Discovery — Colombia',
    question:
      'Should the MVP for Colombia Payments Assistant be the same as the one launched in Mexico?',
    squad: 'payments-assistant',
    researcher: 'Erika Martinez',
    countries: ['colombia'],
    tags: ['PA', 'MVP', 'colombia'],
    month: 'Mar 2026',
  },
  {
    id: 'plan-14',
    title: 'PA + FinSum / Lila / Magic App Integration',
    question:
      'Which use cases should each interface handle and how should Payments Assistant, FinSum, Lila, and Magic App be integrated?',
    squad: 'payments-assistant',
    researcher: 'Alan Paschoal',
    countries: ['brasil', 'mexico'],
    tags: ['PA', 'magic-app', 'integration'],
    month: 'Apr 2026',
  },
  {
    id: 'plan-15',
    title: 'PA Value Prop Awareness (BR & MX)',
    question:
      'How can we better communicate the Payments Assistant value proposition to customers?',
    squad: 'payments-assistant',
    researcher: 'Alan Paschoal',
    countries: ['brasil', 'mexico'],
    tags: ['PA', 'value-prop', 'communication'],
    month: 'May 2026',
  },
  {
    id: 'plan-16',
    title: 'Global Bill Capture & Pre-Commitment Validation',
    question:
      'Is the bill capture flow clear and trusted enough for customers to commit before completing a payment?',
    squad: 'payments-assistant',
    researcher: 'Erika Martinez',
    countries: ['brasil', 'mexico', 'colombia'],
    tags: ['bill-capture', 'validation', 'global'],
    month: 'May 2026',
  },
  {
    id: 'plan-17',
    title: 'WhatsApp Communication Assessment',
    question:
      'Is it relevant for customers to receive payment communications via WhatsApp? Explore WA as a new channel for recurring payment communication.',
    squad: 'payments-assistant',
    researcher: 'Alan Paschoal',
    countries: ['brasil', 'mexico'],
    tags: ['WhatsApp', 'communication', 'payments'],
    month: 'Jun 2026',
  },

  // ── Troy (GBA Factory) ────────────────────────────────────
  {
    id: 'plan-18',
    title: 'Post-Launch Beta with Nubankers (Troy)',
    question:
      'What are the general product impressions, highlights, and opportunities for improvement among Nubanker early testers?',
    squad: 'troy',
    researcher: 'Matheus Rahme',
    countries: ['usa'],
    tags: ['troy', 'beta', 'post-launch', 'USA'],
    month: 'Feb 2026',
  },
  {
    id: 'plan-19',
    title: 'Post-Launch F&F — Friends & Family (Troy)',
    question:
      'What are the general impressions, gap opportunities, and debit/CICO fee perceptions among Friends & Family testers?',
    squad: 'troy',
    researcher: 'Matheus Rahme',
    countries: ['usa'],
    tags: ['troy', 'F&F', 'post-launch'],
    month: 'Mar 2026',
  },
  {
    id: 'plan-20',
    title: 'Pre-Discovery Nu-to-Nu (Troy)',
    question:
      'What is the main benefit of Nu-to-Nu transfers? How can we leverage interactions and create WOW moments?',
    squad: 'troy',
    researcher: 'Matheus Rahme',
    countries: ['usa'],
    tags: ['troy', 'nu2nu', 'discovery'],
    month: 'Apr 2026',
  },
  {
    id: 'plan-21',
    title: 'Post-Launch D1PL (Troy)',
    question:
      'What is the product attractiveness, memory of main flows, and comparison with competitors among Day-1 Public Launch users?',
    squad: 'troy',
    researcher: 'Matheus Rahme',
    countries: ['usa'],
    tags: ['troy', 'D1PL', 'post-launch', 'benchmark'],
    month: 'Q3 2026',
  },

  // ── TOUT (Transfer Out) ───────────────────────────────────
  {
    id: 'plan-22',
    title: 'Global Transfer-Out Vision / Transfers Hub Revamp',
    question:
      'Does the new transfers hub revamp solve the main problems users face? Prototype validation.',
    squad: 'tout',
    researcher: 'Deleu',
    countries: ['brasil', 'mexico', 'colombia'],
    tags: ['transfer-out', 'hub', 'revamp', 'global'],
    month: 'Mar 2026',
  },
  {
    id: 'plan-23',
    title: '[CO] Standardize Payments Flow',
    question:
      'How do Colombian customers receive the new unified payments experience? Is it clear enough or does it need localization?',
    squad: 'tout',
    researcher: 'Fernanda Mujica',
    countries: ['colombia'],
    tags: ['payments-flow', 'standardize', 'colombia'],
    month: 'Feb 2026',
  },
  {
    id: 'plan-24',
    title: 'Magic App Pix Programado — Pre-Launch (BR)',
    question:
      'Does the new Pix scheduled payment flow in Magic App meet customer expectations before launch?',
    squad: 'tout',
    researcher: 'Deleu',
    countries: ['brasil'],
    tags: ['pix', 'scheduled', 'magic-app', 'pre-launch'],
    month: 'Apr 2026',
  },
  {
    id: 'plan-25',
    title: '[MX] Scheduled Transfers Post-Launch',
    question:
      'How did Mexican customers receive the scheduled transfers experience after launch?',
    squad: 'tout',
    researcher: 'Fernanda Mujica',
    countries: ['mexico'],
    tags: ['scheduled-transfers', 'post-launch', 'mexico'],
    month: 'May 2026',
  },

  // ── Cross GBA ─────────────────────────────────────────────
  {
    id: 'plan-26',
    title: 'The Moment of Switch',
    question:
      'What is the exact moment and emotional rationale that led the customer to switch from their main bank to Nubank?',
    squad: 'cross-gba',
    researcher: 'Yas',
    countries: ['brasil', 'mexico', 'colombia'],
    tags: ['switch', 'principality', 'qualitative'],
    month: 'Mar 2026',
  },
  {
    id: 'plan-27',
    title: 'Win-Back Inactive Customers',
    question:
      'What is the main reason customers stop using the product and what needs to happen to re-engage them?',
    squad: 'cross-gba',
    researcher: 'Yas',
    countries: ['brasil', 'mexico', 'colombia'],
    tags: ['win-back', 'churn', 're-engagement'],
    month: 'Apr 2026',
  },
  {
    id: 'plan-28',
    title: 'Informals Impact on Account Usage',
    question:
      'How does income instability shape account usage and what features reduce insecurity and friction for informal workers?',
    squad: 'cross-gba',
    researcher: 'Yas',
    countries: ['brasil', 'mexico', 'colombia'],
    tags: ['informal', 'income', 'account-usage'],
    month: 'May 2026',
  },
  {
    id: 'plan-29',
    title: 'GBA Flywheels',
    question:
      'How can we connect all our products in a contextual journey and create a flywheel effect across GBA?',
    squad: 'cross-gba',
    researcher: 'Matheus Rahme',
    countries: ['brasil', 'mexico', 'colombia'],
    tags: ['flywheel', 'cross-product', 'journey'],
    month: 'Jun 2026',
  },
  {
    id: 'plan-30',
    title: 'PBA Transactional vs. Declared',
    question:
      'Do non-transactional PBAs have the ability to become transactional? What are the levers to close the gap between declared and transactional metrics?',
    squad: 'cross-gba',
    researcher: 'Matheus Rahme',
    countries: ['brasil', 'mexico', 'colombia'],
    tags: ['PBA', 'transactional', 'metrics'],
    month: 'Jun 2026',
  },
  {
    id: 'plan-31',
    title: 'Internal pNPS / Account pNPS (External Panel)',
    question:
      'What is the likelihood of recommending a Nubank account, and how does it compare across markets?',
    squad: 'cross-gba',
    researcher: 'Daniel Kaihara',
    countries: ['brasil', 'mexico', 'colombia'],
    tags: ['pNPS', 'NPS', 'tracking'],
    month: 'Q3 2026',
  },

  // ── Payments & Core Infra ─────────────────────────────────
  {
    id: 'plan-32',
    title: 'Cash-Out QR (OXXO) — Mexico',
    question:
      'What is the impact on customer experience and which cash-out scenario via QR / OXXO is the most fluid?',
    squad: 'payments-core-infra',
    researcher: 'Miriam Matus',
    countries: ['mexico'],
    tags: ['cash-out', 'QR', 'OXXO', 'CICO'],
    month: 'Mar 2026',
  },
  {
    id: 'plan-33',
    title: 'CICO Mystery Shopper',
    question:
      'What are the highlights and gaps in the physical deposit and withdrawal experience across markets?',
    squad: 'payments-core-infra',
    researcher: 'Miriam Matus',
    countries: ['mexico', 'colombia'],
    tags: ['CICO', 'mystery-shopper', 'physical'],
    month: 'Apr 2026',
  },
  {
    id: 'plan-34',
    title: 'Domiciliación Post-Launch (MX)',
    question:
      'How are customers adopting domiciliación after regulatory compliance? What are the main friction points?',
    squad: 'payments-core-infra',
    researcher: 'Erika Martinez',
    countries: ['mexico'],
    tags: ['domiciliacion', 'post-launch', 'regulatory'],
    month: 'Q3 2026',
  },

  // ── TOUT — Colombia Instant Payments ─────────────────────
  {
    id: 'plan-35',
    title: 'Increasing Usage of Keys — Colombia',
    question:
      'What are the main barriers to using Pix/Transfiya keys for transfers in Colombia, and how can we increase key usage and transactionality?',
    squad: 'tout',
    researcher: 'Erika Martinez',
    countries: ['colombia'],
    tags: ['keys', 'transactionality', 'colombia'],
    month: 'Feb 2026',
  },
  {
    id: 'plan-36',
    title: 'QR Code Merchants — Colombia',
    question:
      'How do Colombian merchants and customers experience QR code payments, and what are the gaps vs. competitors?',
    squad: 'tout',
    researcher: 'Miriam Matus',
    countries: ['colombia'],
    tags: ['QR', 'merchants', 'instant-payments'],
    month: 'May 2026',
  },
  {
    id: 'plan-37',
    title: 'Keys Portability — Usability Test (CO)',
    question:
      'Can customers easily port their keys in Colombia? What are the main friction points in the flow?',
    squad: 'tout',
    researcher: 'Erika Martinez',
    countries: ['colombia'],
    tags: ['keys', 'portability', 'usability-test'],
    month: 'Jun 2026',
  },
];
