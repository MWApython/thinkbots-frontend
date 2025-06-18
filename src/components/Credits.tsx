import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Credits: React.FC = () => {
  const { language, t } = useLanguage();

  const keyFeaturesList = language === 'ar' ? [
    'تنفيذ NIST CSF 2.0: إرشادات وأدوات شاملة لتنفيذ أحدث إطار عمل NIST للأمن السيبراني 2.0.',
    'روبوت محادثة مدعوم بالذكاء الاصطناعي: احصل على إجابات فورية ودقيقة لأسئلتك حول NIST CSF 2.0 مع مساعدنا الذكي المتقدم.',
    'لوحة تحكم API: الاتصال بالأنظمة الخارجية وأتمتة جمع البيانات والتكامل مع خدمات الطرف الثالث. يدعم التكوين المتقدم وأنواع المصادقة المتعددة وتحديثات البيانات في الوقت الفعلي.',
    'إدارة المتطلبات: تتبع وتصفية واستكشاف متطلبات وضوابط NIST CSF 2.0 عبر جميع الوظائف الست: الحوكمة والتحديد والحماية والكشف والاستجابة والاسترداد.',
    'إدارة المستندات: إضافة وتعديل وحذف روابط المستندات الحرجة، مما يضمن أن الموارد المهمة متاحة دائماً ومحدثة.',
    'الشروحات المدعومة بالذكاء الاصطناعي: احصل على شروحات فورية مُنشأة بالذكاء الاصطناعي لضوابط NIST CSF 2.0 والمراجع ومستندات الإرشاد في كل وحدة.',
    'تصدير PDF: قم بتحميل إرشادات وملخصات NIST CSF 2.0 المُنشأة بالذكاء الاصطناعي كمستندات PDF منسقة جيداً للإبلاغ وحفظ السجلات.',
    'واجهة مستخدم حديثة ومتجاوبة: مبنية بـ React و TypeScript و Tailwind CSS لتجربة مستخدم سريعة وبديهية وجذابة بصرياً على أي جهاز.',
    'هندسة قابلة للتوسع: تدعم التحسينات المستقبلية مثل قواعد البيانات المستمرة والمصادقة على المستخدمين والتحليلات المتقدمة والمزيد.',
    'إدارة المخاطر: أدوات شاملة لإدارة المخاطر محاذاة مع NIST CSF 2.0 لتحديد وتقييم وتخفيف المخاطر عبر مؤسستك.',
    'تخطيط الإطار: أدوات متقدمة مدعومة بالذكاء الاصطناعي لتخطيط وإدارة متطلبات وضوابط NIST CSF 2.0.',
    'بنية تحتية سحابية آمنة: ضوابط أمنية على مستوى المؤسسة وشهادات الامتثال.',
    'المراقبة الآلية: مراقبة في الوقت الفعلي وتنبيهات لتغييرات الحالة الأمنية والمخاطر الناشئة.',
    'تحليلات متقدمة: أدوات قوية لتصور البيانات والتقارير لمقاييس NIST CSF 2.0 وتقييمات المخاطر.'
  ] : [
    'NIST CSF 2.0 Implementation: Comprehensive guidance and tools for implementing the latest NIST Cybersecurity Framework 2.0.',
    'AI-Powered Chatbot: Get instant, accurate answers to your NIST CSF 2.0 questions with our advanced AI assistant.',
    'API Dashboard: Connect to external systems, automate data collection, and integrate with third-party services. Supports advanced configuration, multiple authentication types, and real-time data updates.',
    'Requirements Management: Track, filter, and explore NIST CSF 2.0 requirements and controls across all six functions: Govern, Identify, Protect, Detect, Respond, and Recover.',
    'Document Management: Add, edit, and delete links to critical documents, ensuring important resources are always accessible and up to date.',
    'AI-Powered Explanations: Get instant, AI-generated explanations for NIST CSF 2.0 controls, references, and guidance documents in every module.',
    'PDF Export: Download AI-generated NIST CSF 2.0 guidance and summaries as well-formatted PDF documents for reporting and record-keeping.',
    'Modern, Responsive UI: Built with React, TypeScript, and Tailwind CSS for a fast, intuitive, and visually appealing user experience on any device.',
    'Extensible Architecture: Supports future enhancements such as persistent databases, user authentication, advanced analytics, and more.',
    'Risk Management: Comprehensive risk management tools aligned with NIST CSF 2.0 to identify, assess, and mitigate risks across your organization.',
    'Framework Mapping: Advanced AI-driven tools for mapping and managing NIST CSF 2.0 requirements and controls.',
    'Secure Cloud Infrastructure: Enterprise-grade security controls and compliance certifications.',
    'Automated Monitoring: Real-time monitoring and alerts for security status changes and emerging risks.',
    'Advanced Analytics: Powerful data visualization and reporting tools for NIST CSF 2.0 metrics and risk assessments.'
  ];

  const strengthsList = language === 'ar' ? [
    'دعم شامل لتنفيذ NIST CSF 2.0',
    'شروحات وإرشادات مدعومة بالذكاء الاصطناعي وواعية بالسياق',
    'تكامل API جاهز للمؤسسات وأتمتة',
    'واجهة مستخدم جميلة وحديثة وقابلة للوصول',
    'مصممة للتوسع والنشر في العالم الحقيقي',
    'بنية تحتية سحابية آمنة مع أمان على مستوى المؤسسة',
    'تسجيل تدقيق شامل وتتبع أمني',
    'هندسة قابلة للتوسع لنشر المؤسسات',
    'تحديثات أمنية منتظمة ومراقبة الامتثال',
    'دعم خبير وتدريب متاح'
  ] : [
    'Comprehensive NIST CSF 2.0 implementation support',
    'AI-powered, context-aware explanations and guidance',
    'Enterprise-ready API integration and automation',
    'Beautiful, modern, and accessible UI/UX',
    'Designed for extensibility and real-world deployment',
    'Secure cloud infrastructure with enterprise-grade security',
    'Comprehensive audit logging and security tracking',
    'Scalable architecture for enterprise deployments',
    'Regular security updates and compliance monitoring',
    'Expert support and training available'
  ];

  return (
    <div className={`min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-4 text-blue-900">{t('creditsTitle')}</h1>
        <p className="mb-4 text-lg">{t('creditsDescription')}</p>
        
        <h2 className="text-xl font-semibold mt-6 mb-2 text-blue-800">{t('secureCloudPlatform')}</h2>
        <p className="mb-4">{t('secureCloudDescription')}</p>
        
        <h2 className="text-xl font-semibold mt-6 mb-2 text-blue-800">{t('keyFeatures')}</h2>
        <ul className={`list-disc ${language === 'ar' ? 'pr-6' : 'pl-6'} mb-4 space-y-1`}>
          {keyFeaturesList.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-2 text-blue-800">{t('strengths')}</h2>
        <ul className={`list-disc ${language === 'ar' ? 'pr-6' : 'pl-6'} mb-4 space-y-1`}>
          {strengthsList.map((strength, index) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-2 text-blue-800">{t('contactSupport')}</h2>
        <p className="mb-2">{t('contactDescription')}</p>
        <p className="font-semibold">info@thinkbots.ai<br />www.thinkbots.ai/ar</p>
      </div>
    </div>
  );
};

export default Credits;