import React from 'react';

const ReadMe: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Thinkbots – Application Overview</h1>
      <p className="mb-6 text-gray-700">
        <strong>Thinkbots</strong> is a modern, AI-powered platform designed to help organizations understand, implement, and manage the NIST Cybersecurity Framework (CSF) 2.0. This application brings together advanced technology, user-friendly dashboards, and actionable insights to empower users in managing their cybersecurity posture.
      </p>

      <h2 className="text-2xl font-bold mb-4">Secure Cloud Platform</h2>
    <p className="mb-6 text-gray-700">
        Our application is hosted on a secure Google Cloud Platform, ensuring the highest standards of security and compliance for organizations. We maintain robust security controls and regular security assessments to protect your data.
      </p>

      <h2 className="text-2xl font-bold mb-4">Key Features</h2>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
        <li>NIST CSF 2.0 Implementation: Comprehensive guidance and tools for implementing the latest NIST Cybersecurity Framework 2.0.</li>
        <li>AI-Powered Chatbot: Get instant, accurate answers to your NIST CSF 2.0 questions with our advanced AI assistant.</li>
        <li>API Dashboard: Connect to external systems, automate data collection, and integrate with third-party services. Supports advanced configuration, multiple authentication types, and real-time data updates.</li>
        <li>Requirements Management: Track, filter, and explore NIST CSF 2.0 requirements and controls across all six functions: Govern, Identify, Protect, Detect, Respond, and Recover.</li>
        <li>Document Management: Add, edit, and delete links to critical documents, ensuring important resources are always accessible and up to date.</li>
        <li>AI-Powered Explanations: Get instant, AI-generated explanations for NIST CSF 2.0 controls, references, and guidance documents in every module.</li>
        <li>PDF Export: Download AI-generated NIST CSF 2.0 guidance and summaries as well-formatted PDF documents for reporting and record-keeping.</li>
        <li>Modern, Responsive UI: Built with React, TypeScript, and Tailwind CSS for a fast, intuitive, and visually appealing user experience on any device.</li>
        <li>Extensible Architecture: Supports future enhancements such as persistent databases, user authentication, advanced analytics, and more.</li>
        <li>Risk Management: Comprehensive risk management tools aligned with NIST CSF 2.0 to identify, assess, and mitigate risks across your organization.</li>
        <li>Framework Mapping: Advanced AI-driven tools for mapping and managing NIST CSF 2.0 requirements and controls.</li>
        <li>Secure Cloud Infrastructure: Enterprise-grade security controls and compliance certifications.</li>
        <li>Automated Monitoring: Real-time monitoring and alerts for security status changes and emerging risks.</li>
        <li>Advanced Analytics: Powerful data visualization and reporting tools for NIST CSF 2.0 metrics and risk assessments.</li>
    </ul>

      <h2 className="text-2xl font-bold mb-4">Strengths</h2>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
        <li>Comprehensive NIST CSF 2.0 implementation support</li>
      <li>AI-powered, context-aware explanations and guidance</li>
      <li>Enterprise-ready API integration and automation</li>
      <li>Beautiful, modern, and accessible UI/UX</li>
      <li>Designed for extensibility and real-world deployment</li>
        <li>Secure cloud infrastructure with enterprise-grade security</li>
        <li>Comprehensive audit logging and security tracking</li>
      <li>Scalable architecture for enterprise deployments</li>
      <li>Regular security updates and compliance monitoring</li>
      <li>Expert support and training available</li>
    </ul>

      <h2 className="text-2xl font-bold mb-4">Contact & Support</h2>
      <p className="text-gray-700 mb-2">For any questions, support, or to discuss your specific needs, please contact us at:</p>
      <ul className="list-none space-y-2">
        <li>
          <a href="mailto:info@thinkbots.ai" className="text-blue-600 hover:text-blue-800">
            info@thinkbots.ai
          </a>
        </li>
        <li>
          <a href="https://www.thinkbots.ai/ar" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
            www.thinkbots.ai/ar
          </a>
        </li>
      </ul>
  </div>
);
};

export default ReadMe; 