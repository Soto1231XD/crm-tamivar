export type AdvisorStats = {
  id: string;
  key: string;
  name: string;
  leadCount: number;
  visitCount: number;
  leadStatuses: Record<string, number>;
  visitStatuses: Record<string, number>;
};
