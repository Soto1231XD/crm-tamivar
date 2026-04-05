export type SoftBadgeTone = 'slate' | 'indigo' | 'blue' | 'green' | 'amber' | 'red';

const SOFT_BADGE_STYLES: Record<
  SoftBadgeTone,
  { backgroundColor: string; color: string; borderColor: string }
> = {
  slate: {
    backgroundColor: '#F1F5F9',
    color: '#334155',
    borderColor: '#CBD5E1',
  },
  indigo: {
    backgroundColor: '#EEF2FF',
    color: '#312C85',
    borderColor: '#C7D2FE',
  },
  blue: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
    borderColor: '#BFDBFE',
  },
  green: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    borderColor: '#BBF7D0',
  },
  amber: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    borderColor: '#FDE68A',
  },
  red: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    borderColor: '#FECACA',
  },
};

export function getSoftBadgeStyles(tone: SoftBadgeTone): {
  backgroundColor: string;
  color: string;
  borderColor: string;
} {
  return SOFT_BADGE_STYLES[tone];
}
