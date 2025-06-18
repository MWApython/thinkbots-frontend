import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const RequirementMap: React.FC = () => {
  const { language } = useLanguage();
  
  const title = language === 'ar' ? 'خريطة المتطلبات' : 'Requirement Map';
  const generateButton = language === 'ar' ? 'إنشاء الخريطة' : 'Generate Map';
  const disclaimer = language === 'ar' 
    ? 'تنويه خريطة تدفق العمليات المُنشأة بواسطة الذكاء الاصطناعي: تم إنشاء خريطة تدفق العمليات هذه باستخدام الذكاء الاصطناعي. على الرغم من سعينا للدقة، قد تنتج أنظمة الذكاء الاصطناعي أحياناً أخطاء أو معلومات غير مكتملة. نوصي بـ:'
    : 'AI-Generated Process Flow Map Disclaimer: This process flow map has been generated using artificial intelligence. While we strive for accuracy, AI systems may occasionally produce errors or incomplete information. We recommend:';
  
  const recommendations = language === 'ar' 
    ? [
        'التحقق من جميع العمليات والعلاقات المعينة',
        'التحقق من صحة تعيينات ضوابط NIST CSF 2.0',
        'تأكيد المسؤوليات الإدارية',
        'مراجعة التدفق الكامل للدقة'
      ]
    : [
        'Verifying all mapped processes and relationships',
        'Validating NIST CSF 2.0 control mappings',
        'Confirming departmental responsibilities',
        'Reviewing the complete flow for accuracy'
      ];

  const note = language === 'ar'
    ? 'يجب استخدام هذه الخريطة كنقطة بداية لتحليلك وليس كمصدر نهائي وموثوق.'
    : 'This map should be used as a starting point for your analysis and not as a final, authoritative source.';

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">{disclaimer}</h2>
        <ul className="list-disc pl-6 mb-4">
          {recommendations.map((item, index) => (
            <li key={index} className="mb-2">{item}</li>
          ))}
        </ul>
        <p className="text-sm text-gray-600">{note}</p>
      </div>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        onClick={() => {/* handle map generation */}}
      >
        {generateButton}
      </button>
    </div>
  );
};

export default RequirementMap; 