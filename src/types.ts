export type AgentRole = 'Host' | 'Scientist' | 'Engineer' | 'Philosopher' | 'Innovator' | 'Miner' | 'Referee';

export interface Message {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: number;
}

export interface KnowledgeCapsule {
  title: string;
  coreQuestion: string;
  keyPrinciples: string;
  innovationMethods: string;
  applicationScenarios: string;
  futurePotential: string;
  level: '基础' | '进阶' | '突破';
}

export interface RefereeReport {
  truth: number;
  goodness: number;
  beauty: number;
  spirit: number;
  totalScore: number;
  level: string;
  tokenValue: number;
}

export interface SavedCapsule {
  id: string;
  capsule: KnowledgeCapsule;
  report: RefereeReport;
  timestamp: number;
}

export interface SalonState {
  theme: string;
  status: 'idle' | 'discussing' | 'extracting' | 'generating' | 'evaluating' | 'completed';
  messages: Message[];
  capsule?: KnowledgeCapsule;
  report?: RefereeReport;
  savedCapsules: SavedCapsule[];
}
