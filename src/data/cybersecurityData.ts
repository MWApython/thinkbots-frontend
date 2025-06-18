export interface CybersecurityRequirement {
  id: string;
  hazardDomain: string;
  control: string;
  sociActReference: string;
  guidanceReference: string;
  status: 'Compliant' | 'Work-In-Progress' | 'Non-compliant';
  comments?: string;
}

export const cybersecurityRequirements: CybersecurityRequirement[] = [
  {
    id: '1',
    hazardDomain: 'Cybersecurity',
    control: 'Conduct Cyber Risk Assessment',
    sociActReference: '30AH(1)(b)(i)',
    guidanceReference: 'Section 5.1, p.16',
    status: 'Work-In-Progress',
    comments: ''
  },
  {
    id: '2',
    hazardDomain: 'Cybersecurity',
    control: 'Implement Multi-Factor Authentication (MFA)',
    sociActReference: '30AH(1)(b)(ii)',
    guidanceReference: 'Section 5.1, p.18',
    status: 'Work-In-Progress',
    comments: ''
  },
  {
    id: '3',
    hazardDomain: 'Cybersecurity',
    control: 'Develop and Maintain Incident Response Plan (CIRMP)',
    sociActReference: '30AH(1)(b)(iii)',
    guidanceReference: 'Section 5.1, p.17',
    status: 'Work-In-Progress',
    comments: ''
  },
  {
    id: '4',
    hazardDomain: 'Cybersecurity',
    control: 'Have a formal Incident Response Plan (IRP) (Part 2C)',
    sociActReference: '30CJ(1)',
    guidanceReference: 'Part 2C, Division 2, p.122',
    status: 'Work-In-Progress',
    comments: ''
  },
  {
    id: '5',
    hazardDomain: 'Cybersecurity',
    control: 'Submit IR Plan to the Secretary',
    sociActReference: '30CH',
    guidanceReference: 'Part 2C, Division 2, p.121',
    status: 'Non-compliant',
    comments: ''
  },
  {
    id: '6',
    hazardDomain: 'Cybersecurity',
    control: 'Conduct Cybersecurity Exercises (as directed)',
    sociActReference: '30CM',
    guidanceReference: 'Part 2C, Division 3, p.123',
    status: 'Work-In-Progress',
    comments: ''
  },
  {
    id: '7',
    hazardDomain: 'Cybersecurity',
    control: 'Submit Internal & External Evaluation Reports',
    sociActReference: '30CQ, 30CR',
    guidanceReference: 'Part 2C, Division 3, pp.126–127',
    status: 'Non-compliant',
    comments: ''
  },
  {
    id: '8',
    hazardDomain: 'Cybersecurity',
    control: 'Conduct Vulnerability Assessments',
    sociActReference: '30CU',
    guidanceReference: 'Part 2C, Division 4, p.130',
    status: 'Work-In-Progress',
    comments: ''
  },
  {
    id: '9',
    hazardDomain: 'Cybersecurity',
    control: 'Submit Vulnerability Reports',
    sociActReference: '30CZ',
    guidanceReference: 'Part 2C, Section 30CZ, p.133',
    status: 'Non-compliant',
    comments: ''
  },
  {
    id: '10',
    hazardDomain: 'Cybersecurity',
    control: 'Share System Info with ASD',
    sociActReference: '30DB, 30DC',
    guidanceReference: 'Part 2C, Division 6',
    status: 'Work-In-Progress',
    comments: ''
  },
  {
    id: '11',
    hazardDomain: 'Cybersecurity',
    control: 'Install Monitoring Software (if directed by ASD)',
    sociActReference: '30DJ',
    guidanceReference: 'Part 2C, Division 6',
    status: 'Compliant',
    comments: ''
  }
]; 