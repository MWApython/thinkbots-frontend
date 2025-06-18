import React from 'react';

const CybersecurityFramework: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary-700">Cybersecurity Framework</h1>
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-semibold mb-4 text-primary-600">Our Expertise</h2>
        <p className="text-lg text-gray-700 mb-4">
          At Thinkbots, we combine the power of Generative AI with Human Consultancy to provide tailored cybersecurity solutions. Our experts are here to guide you through the complexities of implementing robust cybersecurity frameworks.
        </p>
        <h3 className="text-xl font-semibold mb-2 text-primary-600">Frameworks We Support</h3>
        <ul className="list-disc pl-5 mb-4">
          <li className="text-lg text-gray-700">Essential Eight</li>
          <li className="text-lg text-gray-700">NIST CSF 2.0</li>
          <li className="text-lg text-gray-700">AESCSF</li>
          <li className="text-lg text-gray-700">ISO 27001:2022</li>
        </ul>
        <h3 className="text-xl font-semibold mb-2 text-primary-600">Customisation</h3>
        <p className="text-lg text-gray-700 mb-4">
          We understand that every client has unique needs. That's why we offer customisation options to tailor Thinkbots to your specific requirements. Our team works closely with you to ensure that our solutions align perfectly with your business goals.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          Our hybrid model ensures that you receive the best of both worlds: cutting-edge AI-driven insights and personalized human expertise. Whether you're looking to design, implement, or analyze your cybersecurity framework, our team is ready to assist you.
        </p>
        <p className="text-lg text-gray-700">
          Reach out to your Thinkbots Account Manager for more details and confidential discussions.
        </p>
      </div>
    </div>
  );
};

export default CybersecurityFramework; 