export interface CIRMPRequirement {
  id: string;
  section: string;
  requirement: string;
  reference: string;
  explanation: string;
  status: 'Compliant' | 'Non-compliant' | 'Work-In-Progress' | 'Not Applicable' | 'Other';
  comments: string;
  custom?: boolean;
  lastUpdatedBy?: string;
}

export const cirmpRequirements: CIRMPRequirement[] = [
  // 1. CIRMP Adoption
  {
    id: 'cirmp-1',
    section: '1. CIRMP Adoption',
    requirement: 'Entity must adopt and maintain a CIRMP',
    reference: 'Section 30AC',
    explanation: 'Required for all responsible entities of critical infrastructure assets',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  },
  {
    id: 'cirmp-2',
    section: '1. CIRMP Adoption',
    requirement: 'Entity must comply with the adopted CIRMP',
    reference: 'Section 30AD',
    explanation: 'Whether it\'s the original or a varied version',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  },

  // 2. Review & Update
  {
    id: 'cirmp-3',
    section: '2. Review & Update',
    requirement: 'Review CIRMP on a regular basis',
    reference: 'Section 30AE',
    explanation: 'Ensure it reflects current threats, controls, and risks',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  },
  {
    id: 'cirmp-4',
    section: '2. Review & Update',
    requirement: 'Keep CIRMP up-to-date',
    reference: 'Section 30AF',
    explanation: 'Must be updated when significant changes occur',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  },

  // 3. Annual Reporting
  {
    id: 'cirmp-5',
    section: '3. Annual Reporting',
    requirement: 'Submit an annual report to CISC within 90 days of financial year end',
    reference: 'Section 30AG',
    explanation: 'Report must describe CIRMP implementation and changes',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  },
  {
    id: 'cirmp-6',
    section: '3. Annual Reporting',
    requirement: 'Board or accountable authority must approve the report',
    reference: 'Section 30AG(2)(f)',
    explanation: 'Ensures executive oversight and accountability',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  },

  // 4. Core Risk Management Duties
  {
    id: 'cirmp-7',
    section: '4. Core Risk Management Duties',
    requirement: 'Identify material hazards for each asset',
    reference: 'Section 30AH(1)(b)(i)',
    explanation: 'Identify risks that could significantly impact operations',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  },
  {
    id: 'cirmp-8',
    section: '4. Core Risk Management Duties',
    requirement: 'Minimise or eliminate those risks',
    reference: 'Section 30AH(1)(b)(ii)',
    explanation: 'Take steps to prevent those risks where practical',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  },
  {
    id: 'cirmp-9',
    section: '4. Core Risk Management Duties',
    requirement: 'Mitigate the impact of risks if they occur',
    reference: 'Section 30AH(1)(b)(iii)',
    explanation: 'Preparedness, response, and recovery plans required',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  },

  // 5. Governance-Specific Requirements
  {
    id: 'cirmp-10',
    section: '5. Governance-Specific Requirements',
    requirement: 'CIRMP must comply with rules made for the asset',
    reference: 'Section 30AH(1)(c)',
    explanation: 'Must align with sector-specific obligations (e.g. electricity, ports, health)',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  },
  {
    id: 'cirmp-11',
    section: '5. Governance-Specific Requirements',
    requirement: 'Permit AusCheck background checks if required',
    reference: 'Section 30AH(4)(a)',
    explanation: 'Allow for national security vetting of workers',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  },
  {
    id: 'cirmp-12',
    section: '5. Governance-Specific Requirements',
    requirement: 'May include identity verification of personnel',
    reference: 'Section 30AH(4)(d)',
    explanation: 'Useful for preventing insider threats and identity fraud',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  },

  // 6. Direction and Variation
  {
    id: 'cirmp-13',
    section: '6. Direction and Variation',
    requirement: 'Entity must comply with any direction to vary the CIRMP',
    reference: 'Section 30AI',
    explanation: 'Secretary of Home Affairs may issue this direction',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  },
  {
    id: 'cirmp-14',
    section: '6. Direction and Variation',
    requirement: 'Entity may revoke and adopt a new CIRMP',
    reference: 'Section 30AK',
    explanation: 'Flexibility provided under the Act for strategic changes',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  },

  // 7. Governance Principles
  {
    id: 'cirmp-15',
    section: '7. Governance Principles',
    requirement: 'CIRMP obligations must consider cost, proportionality, and overlap with other laws',
    reference: 'Section 30AH(6)',
    explanation: 'Prevents duplication of compliance burdens',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  },

  // 8. Risk Interpretation
  {
    id: 'cirmp-16',
    section: '8. Risk Interpretation',
    requirement: '"Material risk" must be assessed based on likelihood and impact',
    reference: 'Section 30AH(7)',
    explanation: 'Supports alignment with ISO/NIST-style risk frameworks',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  },

  // 9. Simplified Compliance Actions
  {
    id: 'cirmp-17',
    section: '9. Simplified Compliance Actions',
    requirement: 'Rules may define actions that count as compliance',
    reference: 'Section 30AH(9–12)',
    explanation: 'Reduces ambiguity — e.g. following ASD guidance might satisfy cyber control',
    status: 'Work-In-Progress',
    comments: '',
    custom: false
  }
]; 