export interface KeyDocument {
  id: string;
  document: string;
  purpose: string;
  reference: string;
  requiredFor: string;
  category: 'Required' | 'Supporting';
  documentLink?: string;
}

export const keyDocuments: KeyDocument[] = [
  // Required Documents
  {
    id: 'doc-1',
    document: 'Critical Infrastructure Risk Management Program (CIRMP)',
    purpose: 'Outlines how material risks are identified, mitigated, and reviewed',
    reference: 'Sections 30AC–30AF',
    requiredFor: 'All responsible entities of critical infrastructure assets',
    category: 'Required'
  },
  {
    id: 'doc-2',
    document: 'Annual CIRMP Report',
    purpose: 'Demonstrates implementation of the CIRMP, hazard risks, updates, board approval',
    reference: 'Section 30AG',
    requiredFor: 'All CIRMP-reporting entities',
    category: 'Required'
  },
  {
    id: 'doc-3',
    document: 'Board/Governing Body Approval Record',
    purpose: 'Verifies executive oversight of the annual report',
    reference: 'Section 30AG(2)(f)',
    requiredFor: 'All CIRMP-reporting entities',
    category: 'Required'
  },
  {
    id: 'doc-4',
    document: 'Risk Register',
    purpose: 'Records identified risks across 4 hazard domains (Cyber, Physical, Personnel, Supply Chain)',
    reference: 'Section 30AH(1)(b)',
    requiredFor: 'All CIRMP participants',
    category: 'Required'
  },
  {
    id: 'doc-5',
    document: 'Evidence of Risk Treatment',
    purpose: 'Policies, procedures, contracts, or plans that mitigate/eliminate risks',
    reference: 'Section 30AH(1)(b)(ii–iii)',
    requiredFor: 'All CIRMP participants',
    category: 'Required'
  },
  {
    id: 'doc-6',
    document: 'Cybersecurity Incident Response Plan (IRP)',
    purpose: 'Documents how your organisation will detect, respond to, and recover from cyber incidents',
    reference: 'Section 30CH–30CJ',
    requiredFor: 'Required for SoNS and if directed under Part 2C',
    category: 'Required'
  },
  {
    id: 'doc-7',
    document: 'Vulnerability Assessment Reports',
    purpose: 'Documents results of internal or ASD-coordinated assessments',
    reference: 'Section 30CU–30CZ',
    requiredFor: 'SoNS (if directed)',
    category: 'Required'
  },
  {
    id: 'doc-8',
    document: 'Cybersecurity Exercise Reports',
    purpose: 'Internal & external evaluations of resilience tests',
    reference: 'Section 30CM–30CR',
    requiredFor: 'SoNS (if directed)',
    category: 'Required'
  },
  {
    id: 'doc-9',
    document: 'Background Checks & Vetting Procedures',
    purpose: 'Shows screening and access control processes for critical roles',
    reference: 'Section 30AH(4)(a)',
    requiredFor: 'Personnel domain of CIRMP',
    category: 'Required'
  },
  {
    id: 'doc-10',
    document: 'Third-Party Supplier Risk Assessments',
    purpose: 'Documents supply chain risk evaluations and mitigation controls',
    reference: 'Section 30AH(2)(b)',
    requiredFor: 'Supply chain domain of CIRMP',
    category: 'Required'
  },
  {
    id: 'doc-11',
    document: 'Physical Security Plan',
    purpose: 'Access control, surveillance, and physical response procedures',
    reference: 'Section 30AH(2)(c)',
    requiredFor: 'Physical domain of CIRMP',
    category: 'Required'
  },
  {
    id: 'doc-12',
    document: 'Identity Verification Process',
    purpose: 'Describes digital or physical identity checks for critical workers',
    reference: 'Section 30AH(4)(d)',
    requiredFor: 'Personnel domain of CIRMP',
    category: 'Required'
  },
  {
    id: 'doc-13',
    document: 'System Information Reports to ASD',
    purpose: 'Logs, telemetry or system data for cyber monitoring (if required)',
    reference: 'Section 30DB–30DJ',
    requiredFor: 'SoNS (on direction)',
    category: 'Required'
  },
  // Supporting Documents
  {
    id: 'doc-14',
    document: 'Business Continuity & Disaster Recovery Plans',
    purpose: 'Supports mitigation of operational and cyber disruptions',
    reference: 'Best Practice',
    requiredFor: 'Optional',
    category: 'Supporting'
  },
  {
    id: 'doc-15',
    document: 'Access Control Matrix / Privilege Model',
    purpose: 'Demonstrates role-based access enforcement',
    reference: 'Best Practice',
    requiredFor: 'Optional',
    category: 'Supporting'
  },
  {
    id: 'doc-16',
    document: 'Third-party Security Agreements',
    purpose: 'Binds suppliers to equivalent controls',
    reference: 'Best Practice',
    requiredFor: 'Optional',
    category: 'Supporting'
  },
  {
    id: 'doc-17',
    document: 'Incident Logs / Register',
    purpose: 'Records past events and corrective actions',
    reference: 'Best Practice',
    requiredFor: 'Optional',
    category: 'Supporting'
  },
  {
    id: 'doc-18',
    document: 'Policy Register',
    purpose: 'Index of approved cybersecurity, physical, and HR policies',
    reference: 'Best Practice',
    requiredFor: 'Optional',
    category: 'Supporting'
  },
  {
    id: 'doc-19',
    document: 'Training Records',
    purpose: 'Evidence of security awareness for staff and contractors',
    reference: 'Best Practice',
    requiredFor: 'Optional',
    category: 'Supporting'
  }
]; 