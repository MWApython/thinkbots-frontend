export interface Requirement {
  id: string;
  domain: string;
  title: string;
  aiExplanation: string;
  status: 'Compliant' | 'Work-In-Progress' | 'Non-compliant';
  comments: string;
  sociactReference: string;
  guidanceReference: string;
} 