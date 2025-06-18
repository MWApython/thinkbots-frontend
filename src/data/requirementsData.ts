export interface Requirement {
  id: string;
  title: string;
  summary: string;
  legalReference: string;
  example: string;
  checklist: string[];
  sector: string[];
  category: string;
  subCategory?: string;
  priority?: 'Critical' | 'High' | 'Medium' | 'Low';
  complianceDeadline?: string;
  reportingFrequency?: string;
}

export const requirements: Requirement[] = [
  // GOVERN (GV)
  {
    id: 'gv-oc-1',
    category: 'Govern',
    subCategory: 'Organizational Context',
    title: 'Organizational Context',
    summary: 'Organizations must understand their cybersecurity risk management context, including mission, stakeholders, dependencies, and legal requirements.',
    legalReference: 'NIST CSF 2.0 - GV.OC',
    example: 'A financial institution documents its cybersecurity risk management context, including regulatory requirements and stakeholder expectations.',
    checklist: [
      'Identify organizational mission and objectives',
      'Document stakeholder expectations',
      'Map dependencies and relationships',
      'Understand legal and regulatory requirements',
      'Establish governance structure'
    ],
    sector: ['All Sectors'],
    priority: 'Critical',
    reportingFrequency: 'Annual'
  },
  {
    id: 'gv-rm-1',
    category: 'Govern',
    subCategory: 'Risk Management Strategy',
    title: 'Risk Management Strategy',
    summary: 'Organizations must develop and maintain a risk management strategy that addresses cybersecurity risks.',
    legalReference: 'NIST CSF 2.0 - GV.RM',
    example: 'A healthcare provider establishes a risk management strategy that aligns with its business objectives.',
    checklist: [
      'Develop risk management strategy',
      'Align with business objectives',
      'Define risk tolerance levels',
      'Establish risk management processes'
    ],
    sector: ['All Sectors'],
    priority: 'High',
    reportingFrequency: 'Annual'
  },
  {
    id: 'gv-rr-1',
    category: 'Govern',
    subCategory: 'Roles, Responsibilities, and Authorities',
    title: 'Roles and Responsibilities',
    summary: 'Organizations must define and communicate roles, responsibilities, and authorities for cybersecurity risk management.',
    legalReference: 'NIST CSF 2.0 - GV.RR',
    example: 'A technology company clearly defines cybersecurity roles and responsibilities across all departments.',
    checklist: [
      'Define cybersecurity roles',
      'Assign responsibilities',
      'Document authorities',
      'Communicate roles to stakeholders'
    ],
    sector: ['All Sectors'],
    priority: 'Critical'
  },
  {
    id: 'gv-po-1',
    category: 'Govern',
    subCategory: 'Policy',
    title: 'Cybersecurity Policy',
    summary: 'Organizations must establish and maintain cybersecurity policies.',
    legalReference: 'NIST CSF 2.0 - GV.PO',
    example: 'A manufacturing company maintains comprehensive cybersecurity policies for all operations.',
    checklist: [
      'Develop cybersecurity policies',
      'Review policies regularly',
      'Update policies as needed',
      'Communicate policy changes'
    ],
    sector: ['All Sectors'],
    priority: 'High'
  },
  {
    id: 'gv-ov-1',
    category: 'Govern',
    subCategory: 'Oversight',
    title: 'Cybersecurity Oversight',
    summary: 'Organizations must implement oversight processes for cybersecurity risk management.',
    legalReference: 'NIST CSF 2.0 - GV.OV',
    example: 'A utility company conducts regular oversight reviews of its cybersecurity program.',
    checklist: [
      'Establish oversight processes',
      'Conduct regular reviews',
      'Monitor compliance',
      'Report on program effectiveness'
    ],
    sector: ['All Sectors'],
    priority: 'Critical'
  },
  {
    id: 'gv-sc-1',
    category: 'Govern',
    subCategory: 'Supply Chain Risk Management',
    title: 'Supply Chain Risk Management',
    summary: 'Organizations must manage cybersecurity risks in their supply chain.',
    legalReference: 'NIST CSF 2.0 - GV.SC',
    example: 'A retail company assesses and monitors cybersecurity risks from its suppliers.',
    checklist: [
      'Assess supplier risks',
      'Monitor supply chain',
      'Implement controls',
      'Review supplier security'
    ],
    sector: ['All Sectors'],
    priority: 'High'
  },

  // IDENTIFY (ID)
  {
    id: 'id-am-1',
    category: 'Identify',
    subCategory: 'Asset Management',
    title: 'Asset Management',
    summary: 'Organizations must identify and manage their critical assets and systems.',
    legalReference: 'NIST CSF 2.0 - ID.AM',
    example: 'A manufacturing company maintains an inventory of its critical industrial control systems.',
    checklist: [
      'Inventory critical assets',
      'Document asset dependencies',
      'Classify asset criticality',
      'Maintain asset documentation'
    ],
    sector: ['All Sectors'],
    priority: 'Critical'
  },
  {
    id: 'id-ra-1',
    category: 'Identify',
    subCategory: 'Risk Assessment',
    title: 'Risk Assessment',
    summary: 'Organizations must assess cybersecurity risks to their assets and operations.',
    legalReference: 'NIST CSF 2.0 - ID.RA',
    example: 'A utility company conducts regular risk assessments of its critical infrastructure.',
    checklist: [
      'Identify threats and vulnerabilities',
      'Assess likelihood and impact',
      'Document risk assessment results',
      'Review and update assessments'
    ],
    sector: ['All Sectors'],
    priority: 'High'
  },
  {
    id: 'id-im-1',
    category: 'Identify',
    subCategory: 'Improvement',
    title: 'Continuous Improvement',
    summary: 'Organizations must continuously improve their cybersecurity risk management processes.',
    legalReference: 'NIST CSF 2.0 - ID.IM',
    example: 'A financial institution regularly reviews and improves its risk management processes.',
    checklist: [
      'Review current processes',
      'Identify improvement areas',
      'Implement improvements',
      'Monitor effectiveness'
    ],
    sector: ['All Sectors'],
    priority: 'High'
  },

  // PROTECT (PR)
  {
    id: 'pr-aa-1',
    category: 'Protect',
    subCategory: 'Identity Management, Authentication, and Access Control',
    title: 'Access Control',
    summary: 'Organizations must implement appropriate access controls to protect critical assets.',
    legalReference: 'NIST CSF 2.0 - PR.AA',
    example: 'A financial institution implements multi-factor authentication for all critical systems.',
    checklist: [
      'Implement identity management',
      'Enforce access controls',
      'Monitor access activities',
      'Review access permissions'
    ],
    sector: ['All Sectors'],
    priority: 'Critical'
  },
  {
    id: 'pr-at-1',
    category: 'Protect',
    subCategory: 'Awareness and Training',
    title: 'Security Awareness and Training',
    summary: 'Organizations must provide security awareness and training to personnel.',
    legalReference: 'NIST CSF 2.0 - PR.AT',
    example: 'A healthcare provider conducts regular security awareness training for all staff.',
    checklist: [
      'Develop training program',
      'Conduct regular training',
      'Assess training effectiveness',
      'Update training materials'
    ],
    sector: ['All Sectors'],
    priority: 'High'
  },
  {
    id: 'pr-ds-1',
    category: 'Protect',
    subCategory: 'Data Security',
    title: 'Data Security',
    summary: 'Organizations must protect sensitive data through appropriate security measures.',
    legalReference: 'NIST CSF 2.0 - PR.DS',
    example: 'A healthcare provider encrypts all patient data and implements data loss prevention controls.',
    checklist: [
      'Classify sensitive data',
      'Implement data protection',
      'Monitor data access',
      'Maintain data security'
    ],
    sector: ['All Sectors'],
    priority: 'Critical'
  },
  {
    id: 'pr-ps-1',
    category: 'Protect',
    subCategory: 'Platform Security',
    title: 'Platform Security',
    summary: 'Organizations must secure their platforms and infrastructure.',
    legalReference: 'NIST CSF 2.0 - PR.PS',
    example: 'A cloud provider implements comprehensive platform security controls.',
    checklist: [
      'Secure platform infrastructure',
      'Implement security controls',
      'Monitor platform security',
      'Update security measures'
    ],
    sector: ['All Sectors'],
    priority: 'High'
  },
  {
    id: 'pr-ir-1',
    category: 'Protect',
    subCategory: 'Technology Infrastructure Resilience',
    title: 'Infrastructure Resilience',
    summary: 'Organizations must ensure the resilience of their technology infrastructure.',
    legalReference: 'NIST CSF 2.0 - PR.IR',
    example: 'A utility company implements redundant systems for critical infrastructure.',
    checklist: [
      'Implement redundancy',
      'Test system resilience',
      'Monitor system health',
      'Update infrastructure'
    ],
    sector: ['All Sectors'],
    priority: 'Critical'
  },

  // DETECT (DE)
  {
    id: 'de-cm-1',
    category: 'Detect',
    subCategory: 'Continuous Monitoring',
    title: 'Continuous Monitoring',
    summary: 'Organizations must continuously monitor their systems for security events.',
    legalReference: 'NIST CSF 2.0 - DE.CM',
    example: 'A technology company implements 24/7 security monitoring of its cloud infrastructure.',
    checklist: [
      'Implement monitoring tools',
      'Configure alert thresholds',
      'Monitor system activities',
      'Review monitoring logs'
    ],
    sector: ['All Sectors'],
    priority: 'Critical'
  },
  {
    id: 'de-ae-1',
    category: 'Detect',
    subCategory: 'Adverse Event Analysis',
    title: 'Event Analysis',
    summary: 'Organizations must analyze adverse events to detect security incidents.',
    legalReference: 'NIST CSF 2.0 - DE.AE',
    example: 'A financial institution analyzes security events to detect potential threats.',
    checklist: [
      'Analyze security events',
      'Investigate anomalies',
      'Document findings',
      'Update detection methods'
    ],
    sector: ['All Sectors'],
    priority: 'High'
  },

  // RESPOND (RS)
  {
    id: 'rs-ma-1',
    category: 'Respond',
    subCategory: 'Incident Management',
    title: 'Incident Management',
    summary: 'Organizations must have an incident management process.',
    legalReference: 'NIST CSF 2.0 - RS.MA',
    example: 'A healthcare provider maintains a comprehensive incident management process.',
    checklist: [
      'Develop incident procedures',
      'Train response team',
      'Test response process',
      'Update procedures'
    ],
    sector: ['All Sectors'],
    priority: 'Critical'
  },
  {
    id: 'rs-an-1',
    category: 'Respond',
    subCategory: 'Incident Analysis',
    title: 'Incident Analysis',
    summary: 'Organizations must analyze security incidents to improve their response.',
    legalReference: 'NIST CSF 2.0 - RS.AN',
    example: 'A technology company conducts thorough analysis of security incidents.',
    checklist: [
      'Analyze incident details',
      'Document lessons learned',
      'Implement improvements',
      'Share findings'
    ],
    sector: ['All Sectors'],
    priority: 'High'
  },
  {
    id: 'rs-co-1',
    category: 'Respond',
    subCategory: 'Incident Response Reporting and Communication',
    title: 'Incident Communication',
    summary: 'Organizations must establish incident response reporting and communication procedures.',
    legalReference: 'NIST CSF 2.0 - RS.CO',
    example: 'A financial institution maintains clear communication channels for incident response.',
    checklist: [
      'Establish communication channels',
      'Define reporting procedures',
      'Train communication team',
      'Test communication process'
    ],
    sector: ['All Sectors'],
    priority: 'Critical'
  },
  {
    id: 'rs-mi-1',
    category: 'Respond',
    subCategory: 'Incident Mitigation',
    title: 'Incident Mitigation',
    summary: 'Organizations must implement measures to mitigate security incidents.',
    legalReference: 'NIST CSF 2.0 - RS.MI',
    example: 'A utility company implements measures to mitigate the impact of security incidents.',
    checklist: [
      'Develop mitigation strategies',
      'Implement controls',
      'Test mitigation measures',
      'Update strategies'
    ],
    sector: ['All Sectors'],
    priority: 'High'
  },

  // RECOVER (RC)
  {
    id: 'rc-rp-1',
    category: 'Recover',
    subCategory: 'Incident Recovery Plan Execution',
    title: 'Recovery Planning',
    summary: 'Organizations must maintain recovery plans for critical systems and operations.',
    legalReference: 'NIST CSF 2.0 - RC.RP',
    example: 'A utility company maintains detailed recovery plans for its critical infrastructure.',
    checklist: [
      'Develop recovery plans',
      'Test recovery procedures',
      'Update recovery plans',
      'Train recovery team'
    ],
    sector: ['All Sectors'],
    priority: 'Critical'
  },
  {
    id: 'rc-co-1',
    category: 'Recover',
    subCategory: 'Incident Recovery Communication',
    title: 'Recovery Communication',
    summary: 'Organizations must establish communication procedures for recovery activities.',
    legalReference: 'NIST CSF 2.0 - RC.CO',
    example: 'A healthcare provider maintains clear communication channels during recovery.',
    checklist: [
      'Establish communication plan',
      'Define stakeholder roles',
      'Test communication process',
      'Update communication procedures'
    ],
    sector: ['All Sectors'],
    priority: 'High'
  }
]; 