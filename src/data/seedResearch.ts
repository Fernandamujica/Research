import type { Research } from '../types/research';
// CSAT_W1_IMAGES kept for reference — replaced by BRB_IMAGES below
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CSAT_W1_IMAGES as _unused } from './csatImages';
import { SPEI_IMAGES } from './speiImages';
import { BRB_IMAGES } from './brbImages';

export const SEED_RESEARCH: Research[] = [
  {
    id: 'seed-001',
    title: 'Qualitative Deep Dive: Mexico SPEI CSAT',
    description:
      'Qualitative deep dive based on 3,500 CSAT open-ended responses about SPEI transfers in Mexico, to identify satisfaction drivers, friction points, and actionable improvement opportunities for the transfer experience.',
    date: '2025-10-01',
    country: 'mexico',
    squad: 'tout',
    researcher: 'Miriam Matus',
    methodology:
      'Qualitative deep dive analyzing 3,500 CSAT open-ended survey responses about SPEI transfers. Comments were categorized by rating (1–5) and tone (positive, improvement opportunities, negative).',
    team: ['Miriam Matus'],
    tags: ['CSAT', 'SPEI', 'transfers', 'UX', 'qualitative', 'Mexico'],
    keyLearnings: [
      'Speed = Trust: Instant transfer confirmation is the #1 driver of satisfaction — any delay creates doubt about whether the transfer succeeded and directly erodes user confidence.',
      'Errors Without Clarity: Generic error messages are confusing and anxiety-inducing. Users need to understand what went wrong and how to fix it, especially for failed or misdirected transfers.',
      'Friction Reduces Confidence: App freezes, slow balance updates, and unclear confirmations make users question Nu\'s reliability as a financial tool.',
      'Users Want Less Effort: Automatic bank detection, no need to save contacts for one-time transfers, and immediate visibility of completed transfers were the top requested simplifications.',
      'Post-Transfer UX Matters: The repetitive "invite a friend" prompt after every transfer feels out of place and annoying — post-transaction screens should focus on reassurance, not promotion.',
    ],
    presentationUrl: 'https://docs.google.com/presentation/d/100zCeRKmJWHy6YjjpEkMvhOoDlvM92IQIaqLAqJtwDw/edit?slide=id.g31d2d017d06_8_3299#slide=id.g31d2d017d06_8_3299',
    pptScreenshots: SPEI_IMAGES,
    usefulLinks: [],
    createdAt: '2025-10-15T10:00:00.000Z',
  },
  {
    id: 'seed-002',
    title: 'Colombia Bre-B (TOUT) CSAT — Wave 1 (Dec 2025)',
    description:
      'First CSAT wave for Colombia\'s Bre-B instant transfer feature, analyzing 3,932 user responses to identify satisfaction drivers, pain points, and improvement opportunities for the transfer experience.',
    date: '2025-12-01',
    country: 'colombia',
    squad: 'tout',
    researcher: 'Fernanda Mujica',
    methodology:
      'Quantitative CSAT survey with 3,932 responses and qualitative verbatim analysis. 62% response rate with written feedback (2,439 verbatims analyzed). Verbatims were sub-categorized by sentiment and topic.',
    team: ['Fernanda Mujica', 'Daniel Vega', 'Diego Santamaria'],
    tags: ['CSAT', 'Bre-B', 'transfers', 'Colombia', 'TOUT', 'quantitative', 'instant payments', 'W1'],
    keyLearnings: [
      'Overall CSAT score of 71.8% (ratings 4–5) in Wave 1. Transfer failures and instability (38.8% of dissatisfied verbatims) is the #1 pain — partially caused by third-party outages (Nequi, IRC incidents).',
      'Speed drives high satisfaction — when Bre-B works, users describe it as "instant," "agile," and "reliable." 11.6% of positive verbatims explicitly mention efficiency as the reason for satisfaction.',
      'The 4×1000 tax creates unique Colombian friction: surprise deductions and lack of visibility into exemption limits erode trust and generate 4.5% of all improvement requests.',
      'Users feel abandoned when errors occur. Error messages like "La cuenta receptor no cumple con las validaciones requeridas" lack context, leaving users guessing and retrying multiple times.',
      'Minor UX changes — simplified flow, QR code support, clearer navigation after transfer — could convert neutral users (25.3% dissatisfied) into satisfied customers.',
    ],
    presentationUrl: 'https://docs.google.com/presentation/d/1EryRVsODPStWv-QRQP2uSpra6pFdhRV_gtV80UYvsrc/edit?slide=id.g3c451600923_0_121#slide=id.g3c451600923_0_121',
    pptScreenshots: BRB_IMAGES,
    usefulLinks: [],
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'seed-003',
    title: 'CO Research: MagicApp Vision — Qualitative Usability Study (Jan 2026)',
    description:
      'Qualitative in-person usability research evaluating Nubank\'s MagicApp prototype with 12 customers and non-customers in Bogotá, Colombia. Goal: understand local context, jobs to be done, and how the prototype architecture performs against user expectations.',
    date: '2026-01-15',
    country: 'colombia',
    squad: 'mb-account-xp',
    methodology:
      'Qualitative in-person research: in-depth usability sessions in Bogotá with 12 participants (6 Nu Customers: 4 Middle Market + 2 SuCo; 6 Non-Nu Customers: 4 Middle Market + 2 SuCo). Participants interacted with a Figma prototype of the MagicApp Vision.',
    team: ['Carolina Leyva', 'Jose Altuzarra', 'Andre Torales'],
    tags: ['MagicApp', 'UX', 'usability', 'information architecture', 'Colombia', 'qualitative', 'prototype'],
    keyLearnings: [
      'Nu is perceived as an "evolved digital wallet" — positioned between Nequi (fast P2P wallet) and Bancolombia (full-service incumbent). It\'s seen as a good savings tool with low-cost transfers, but not yet essential enough to replace existing apps.',
      'Mixing transactional (pay, send, monitor) and mindful (hire a loan, CDT, refinancing) actions in the same view breaks users\' mental models and increases cognitive load — people couldn\'t find primary tasks quickly.',
      'The prototype\'s heavier architecture risks positioning Nu as a "slow wallet" or "branchless incumbent" instead of leveraging its core strength as an agile, frictionless fintech.',
      'Multiple overlapping entry points, redundant cross-sell areas, and unclear product findability (e.g., users unsure if a Cajita was created) compromise the clarity of the app narrative.',
      'Colombians use 2+ financial apps simultaneously (Nequi for P2P + an incumbent for payroll/savings). Nu must clearly differentiate its value to earn a primary slot — the "in-between" position is a strategic opportunity, not just a risk.',
    ],
    usefulLinks: [],
    createdAt: '2026-01-20T10:00:00.000Z',
  },
];
