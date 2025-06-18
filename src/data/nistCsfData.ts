export interface NistCategory {
  id: string;
  name: string;
  description: string;
  subcategories: NistSubcategory[];
}

export interface NistSubcategory {
  id: string;
  name: string;
  description: string;
  outcomes: string[];
  references: string[];
}

export const nistCsfData: NistCategory[] = [
  {
    id: "GV",
    name: "GOVERN",
    description: "The organization's cybersecurity risk management strategy, expectations, and policy are established, communicated, and monitored.",
    subcategories: [
      {
        id: "GV.OC",
        name: "Organizational Context",
        description: "The circumstances—mission, stakeholder expectations, dependencies, and legal, regulatory, and contractual requirements—surrounding the organization's cybersecurity risk management decisions are understood.",
        outcomes: [
          "Organizational mission and objectives are understood",
          "Legal, regulatory, and contractual requirements regarding cybersecurity are understood",
          "Critical dependencies and supply chain relationships are identified"
        ],
        references: ["NIST CSF 2.0"]
      },
      {
        id: "GV.RM",
        name: "Risk Management Strategy",
        description: "The organization's priorities, constraints, risk tolerances, and assumptions are established and used to support operational risk decisions.",
        outcomes: [
          "Risk management processes are established",
          "Risk tolerance is determined and clearly expressed",
          "Risk management strategy is established"
        ],
        references: ["NIST CSF 2.0"]
      }
    ]
  },
  {
    id: "ID",
    name: "IDENTIFY",
    description: "The organization's current cybersecurity risk to systems, people, assets, data, and capabilities is understood.",
    subcategories: [
      {
        id: "ID.AM",
        name: "Asset Management",
        description: "The data, personnel, devices, systems, and facilities that enable the organization to achieve business purposes are identified and managed.",
        outcomes: [
          "Physical devices and systems within the organization are inventoried",
          "Software platforms and applications within the organization are inventoried",
          "Organizational communication and data flows are mapped"
        ],
        references: ["NIST CSF 2.0"]
      },
      {
        id: "ID.BE",
        name: "Business Environment",
        description: "The organization's mission, objectives, stakeholders, and activities are understood and prioritized.",
        outcomes: [
          "The organization's role in the supply chain is identified",
          "Priorities for organizational mission, objectives, and activities are established",
          "Dependencies and critical functions for delivery of critical services are established"
        ],
        references: ["NIST CSF 2.0"]
      }
    ]
  },
  {
    id: "PR",
    name: "PROTECT",
    description: "Safeguards to manage the organization's cybersecurity risk are used.",
    subcategories: [
      {
        id: "PR.AC",
        name: "Identity Management, Authentication, and Access Control",
        description: "Access to physical and logical assets and associated facilities is limited to authorized users, processes, and devices.",
        outcomes: [
          "Identities and credentials are issued, managed, verified, revoked, and audited",
          "Physical access to assets is managed and protected",
          "Remote access is managed"
        ],
        references: ["NIST CSF 2.0"]
      },
      {
        id: "PR.DS",
        name: "Data Security",
        description: "Information and records (data) are managed consistent with the organization's risk strategy to protect the confidentiality, integrity, and availability of information.",
        outcomes: [
          "Data-at-rest is protected",
          "Data-in-transit is protected",
          "Assets are formally managed throughout lifecycle"
        ],
        references: ["NIST CSF 2.0"]
      }
    ]
  },
  {
    id: "DE",
    name: "DETECT",
    description: "Activities to identify the occurrence of a cybersecurity event.",
    subcategories: [
      {
        id: "DE.CM",
        name: "Security Continuous Monitoring",
        description: "The information system and assets are monitored at discrete intervals to identify cybersecurity events and verify the effectiveness of protective measures.",
        outcomes: [
          "The network is monitored to detect potential cybersecurity events",
          "The physical environment is monitored to detect potential cybersecurity events",
          "Personnel activity is monitored to detect potential cybersecurity events"
        ],
        references: ["NIST CSF 2.0"]
      },
      {
        id: "DE.DP",
        name: "Detection Process",
        description: "Detection processes and procedures are maintained and tested to ensure awareness of anomalous events.",
        outcomes: [
          "Roles and responsibilities for detection are well defined",
          "Detection activities comply with all applicable requirements",
          "Detection process is tested"
        ],
        references: ["NIST CSF 2.0"]
      }
    ]
  },
  {
    id: "RS",
    name: "RESPOND",
    description: "Activities to take action regarding a detected cybersecurity incident.",
    subcategories: [
      {
        id: "RS.RP",
        name: "Response Planning",
        description: "Response processes and procedures are executed and maintained, to ensure response to detected cybersecurity incidents.",
        outcomes: [
          "Response plan is executed during or after an incident",
          "Response strategies are updated",
          "Response plans incorporate lessons learned"
        ],
        references: ["NIST CSF 2.0"]
      },
      {
        id: "RS.CO",
        name: "Communications",
        description: "Response activities are coordinated with internal and external stakeholders.",
        outcomes: [
          "Personnel know their roles and order of operations when a response is needed",
          "Incidents are reported consistent with established criteria",
          "Information is shared consistent with response plans"
        ],
        references: ["NIST CSF 2.0"]
      }
    ]
  },
  {
    id: "RC",
    name: "RECOVER",
    description: "Activities to maintain resilience and to restore any capabilities or services that were impaired due to a cybersecurity incident.",
    subcategories: [
      {
        id: "RC.RP",
        name: "Recovery Planning",
        description: "Recovery processes and procedures are executed and maintained to ensure restoration of systems or assets affected by cybersecurity incidents.",
        outcomes: [
          "Recovery plan is executed during or after an incident",
          "Recovery strategies are updated",
          "Recovery plans incorporate lessons learned"
        ],
        references: ["NIST CSF 2.0"]
      },
      {
        id: "RC.IM",
        name: "Improvements",
        description: "Organizational improvements are made by incorporating lessons learned from current and previous detection/response activities.",
        outcomes: [
          "Recovery planning and processes are improved",
          "Response strategies are updated",
          "Lessons learned are incorporated into response and recovery procedures"
        ],
        references: ["NIST CSF 2.0"]
      }
    ]
  }
]; 