export interface Translations {
  // ... existing interface properties ...
  requirementMapTitle: string;
  generateMapButton: string;
  requirementMapDisclaimer: string;
  requirementMapRecommendations: string[];
  requirementMapNote: string;
  
  // Credits
  creditsTitle: string;
  creditsDescription: string;
  secureCloudPlatform: string;
  secureCloudDescription: string;
  keyFeatures: string;
  strengths: string;
  contactSupport: string;
  contactDescription: string;
}

export const translations = {
  en: {
    // Navigation
    home: 'Home',
    dashboards: 'Dashboards',
    apiDashboard: 'API Dashboard',
    chatbot: 'Thinkbot',
    askMrC: 'Ask Mr. C',
    riskProgram: 'Risk Program',
    riskManagement: 'Risk Management',
    cybersecurityFramework: 'Cybersecurity Framework',
    processMapping: 'Process Mapping',
    requirementMap: 'Requirement Map',
    compliance: 'Compliance',
    requirements: 'Requirements',
    keyDocuments: 'Key Documents',
    cybersecurity: 'Cybersecurity',
    gapAnalysis: 'Gap Analysis',
    nistGapAnalysis: 'NIST Gap Analysis',
    docAnonymity: 'Doc Anonymity',
    collaboration: 'Collaboration',
    teamCollab: 'Team Collab',
    notifications: 'Notifications',
    aboutUs: 'About Us',
    aboutThinkbots: 'About Thinkbots',
    logout: 'Logout',
    switchToArabic: 'Switch to Arabic',
    switchToEnglish: 'Switch to English',
    // Section names
    dashboard: 'Dashboard',
    assessment: 'Assessment',
    assignments: 'Assignments',

    // Common UI Elements
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    search: 'Search',
    filter: 'Filter',
    refresh: 'Refresh',
    download: 'Download',
    upload: 'Upload',
    submit: 'Submit',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    open: 'Open',
    yes: 'Yes',
    no: 'No',
    confirm: 'Confirm',
    warning: 'Warning',
    info: 'Information',

    // Chatbot
    chatbotWelcome: 'Hello! I am Thinkbot, your AI assistant. How can I help you today?',
    chatbotPlaceholder: 'Type your message here...',
    chatbotSend: 'Send',
    chatbotClear: 'Clear Chat',
    chatbotThinking: 'Thinking...',
    chatbotError: 'Sorry, I encountered an error. Please try again.',

    // PDF Generation
    pdfTitle: 'Report',
    pdfGenerated: 'Generated on',
    pdfPage: 'Page',
    pdfOf: 'of',
    pdfConfidential: 'Confidential',
    pdfDisclaimer: 'This document is generated automatically and may be updated.',

    // NIST CSF 2.0
    nistFramework: 'NIST CSF 2.0 Framework',
    nistGovern: 'Govern',
    nistIdentify: 'Identify',
    nistProtect: 'Protect',
    nistDetect: 'Detect',
    nistRespond: 'Respond',
    nistRecover: 'Recover',
    nistCategories: 'Categories',
    nistSubcategories: 'Subcategories',
    nistControls: 'Controls',
    nistImplementation: 'Implementation',
    nistAssessment: 'Assessment',
    nistGap: 'Gap Analysis',
    nistRecommendations: 'Recommendations',

    // Risk Management
    riskAssessment: 'Risk Assessment',
    riskIdentification: 'Risk Identification',
    riskAnalysis: 'Risk Analysis',
    riskEvaluation: 'Risk Evaluation',
    riskTreatment: 'Risk Treatment',
    riskMonitoring: 'Risk Monitoring',
    riskReview: 'Risk Review',

    // API Dashboard
    apiStatus: 'API Status',
    apiEndpoints: 'Endpoints',
    apiDocumentation: 'Documentation',
    apiTesting: 'Testing',
    apiMonitoring: 'Monitoring',
    apiLogs: 'Logs',

    // Requirement Map
    requirementMapTitle: 'Requirement Map',
    generateMapButton: 'Generate Map',
    requirementMapDisclaimer: 'AI-Generated Process Flow Map Disclaimer: This process flow map has been generated using artificial intelligence. While we strive for accuracy, AI systems may occasionally produce errors or incomplete information. We recommend:',
    requirementMapRecommendations: [
      'Verifying all mapped processes and relationships',
      'Validating NIST CSF 2.0 control mappings',
      'Confirming departmental responsibilities',
      'Reviewing the complete flow for accuracy'
    ],
    requirementMapNote: 'This map should be used as a starting point for your analysis and not as a final, authoritative source.',

    // Document Management
    docUpload: 'Upload Document',
    docView: 'View Document',
    docEdit: 'Edit Document',
    docDelete: 'Delete Document',
    docShare: 'Share Document',
    docVersion: 'Version',
    docHistory: 'History',
    docPermissions: 'Permissions',

    // Credits
    creditsTitle: 'Thinkbots – Application Overview',
    creditsDescription: 'Thinkbots is a modern, AI-powered platform designed to help organizations understand, implement, and manage the NIST Cybersecurity Framework (CSF) 2.0. This application brings together advanced technology, user-friendly dashboards, and actionable insights to empower users in managing their cybersecurity posture.',
    secureCloudPlatform: 'Secure Cloud Platform',
    secureCloudDescription: 'Our application is hosted on a secure Google Cloud Platform, ensuring the highest standards of security and compliance for organizations. We maintain robust security controls and regular security assessments to protect your data.',
    keyFeatures: 'Key Features',
    strengths: 'Strengths',
    contactSupport: 'Contact & Support',
    contactDescription: 'For any questions, support, or to discuss your specific needs, please contact us at:'
  },
  ar: {
    // Navigation
    home: 'الرئيسية',
    dashboards: 'لوحات المعلومات',
    apiDashboard: 'لوحة تحكم API',
    chatbot: 'ثينكبوت',
    askMrC: 'اسأل السيد سي',
    riskProgram: 'برنامج المخاطر',
    riskManagement: 'إدارة المخاطر',
    cybersecurityFramework: 'إطار عمل الأمن السيبراني',
    processMapping: 'تخطيط العمليات',
    requirementMap: 'خريطة المتطلبات',
    compliance: 'الامتثال',
    requirements: 'المتطلبات',
    keyDocuments: 'المستندات الرئيسية',
    cybersecurity: 'الأمن السيبراني',
    gapAnalysis: 'تحليل الفجوات',
    nistGapAnalysis: 'تحليل فجوات NIST',
    docAnonymity: 'إخفاء هوية المستندات',
    collaboration: 'التعاون',
    teamCollab: 'تعاون الفريق',
    notifications: 'الإشعارات',
    aboutUs: 'من نحن',
    aboutThinkbots: 'عن ثينكبوتس',
    logout: 'تسجيل الخروج',
    switchToArabic: 'التبديل إلى العربية',
    switchToEnglish: 'التبديل إلى الإنجليزية',
    // Section names
    dashboard: 'لوحة المعلومات',
    assessment: 'التقييم',
    assignments: 'المهام',

    // Common UI Elements
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجاح',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    view: 'عرض',
    search: 'بحث',
    filter: 'تصفية',
    refresh: 'تحديث',
    download: 'تحميل',
    upload: 'رفع',
    submit: 'إرسال',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    close: 'إغلاق',
    open: 'فتح',
    yes: 'نعم',
    no: 'لا',
    confirm: 'تأكيد',
    warning: 'تحذير',
    info: 'معلومات',

    // Chatbot
    chatbotWelcome: 'مرحباً! أنا ثينكبوت، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟',
    chatbotPlaceholder: 'اكتب رسالتك هنا...',
    chatbotSend: 'إرسال',
    chatbotClear: 'مسح المحادثة',
    chatbotThinking: 'جاري التفكير...',
    chatbotError: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',

    // PDF Generation
    pdfTitle: 'التقرير',
    pdfGenerated: 'تم إنشاؤه في',
    pdfPage: 'صفحة',
    pdfOf: 'من',
    pdfConfidential: 'سري',
    pdfDisclaimer: 'تم إنشاء هذا المستند تلقائياً وقد يتم تحديثه.',

    // NIST CSF 2.0
    nistFramework: 'إطار عمل NIST CSF 2.0',
    nistGovern: 'الحوكمة',
    nistIdentify: 'التحديد',
    nistProtect: 'الحماية',
    nistDetect: 'الكشف',
    nistRespond: 'الاستجابة',
    nistRecover: 'الاسترداد',
    nistCategories: 'الفئات',
    nistSubcategories: 'الفئات الفرعية',
    nistControls: 'الضوابط',
    nistImplementation: 'التنفيذ',
    nistAssessment: 'التقييم',
    nistGap: 'تحليل الفجوات',
    nistRecommendations: 'التوصيات',

    // Risk Management
    riskAssessment: 'تقييم المخاطر',
    riskIdentification: 'تحديد المخاطر',
    riskAnalysis: 'تحليل المخاطر',
    riskEvaluation: 'تقييم المخاطر',
    riskTreatment: 'معالجة المخاطر',
    riskMonitoring: 'مراقبة المخاطر',
    riskReview: 'مراجعة المخاطر',

    // API Dashboard
    apiStatus: 'حالة API',
    apiEndpoints: 'نقاط النهاية',
    apiDocumentation: 'التوثيق',
    apiTesting: 'الاختبار',
    apiMonitoring: 'المراقبة',
    apiLogs: 'السجلات',

    // Requirement Map
    requirementMapTitle: 'خريطة المتطلبات',
    generateMapButton: 'إنشاء الخريطة',
    requirementMapDisclaimer: 'تنويه خريطة تدفق العمليات المُنشأة بواسطة الذكاء الاصطناعي: تم إنشاء خريطة تدفق العمليات هذه باستخدام الذكاء الاصطناعي. على الرغم من سعينا للدقة، قد تنتج أنظمة الذكاء الاصطناعي أحياناً أخطاء أو معلومات غير مكتملة. نوصي بـ:',
    requirementMapRecommendations: [
      'التحقق من جميع العمليات والعلاقات المعينة',
      'التحقق من صحة تعيينات ضوابط NIST CSF 2.0',
      'تأكيد المسؤوليات الإدارية',
      'مراجعة التدفق الكامل للدقة'
    ],
    requirementMapNote: 'يجب استخدام هذه الخريطة كنقطة بداية لتحليلك وليس كمصدر نهائي وموثوق.',

    // Document Management
    docUpload: 'رفع مستند',
    docView: 'عرض المستند',
    docEdit: 'تعديل المستند',
    docDelete: 'حذف المستند',
    docShare: 'مشاركة المستند',
    docVersion: 'الإصدار',
    docHistory: 'السجل',
    docPermissions: 'الصلاحيات',

    // Credits
    creditsTitle: 'ثينكبوتس – نظرة عامة على التطبيق',
    creditsDescription: 'ثينكبوتس هي منصة حديثة مدعومة بالذكاء الاصطناعي مصممة لمساعدة المؤسسات على فهم وتنفيذ وإدارة إطار عمل NIST للأمن السيبراني (CSF) 2.0. يجمع هذا التطبيق بين التكنولوجيا المتقدمة ولوحات المعلومات سهلة الاستخدام والرؤى القابلة للتنفيذ لتمكين المستخدمين من إدارة وضعهم الأمني السيبراني.',
    secureCloudPlatform: 'منصة سحابية آمنة',
    secureCloudDescription: 'يتم استضافة تطبيقنا على منصة Google Cloud Platform الآمنة، مما يضمن أعلى معايير الأمان والامتثال للمؤسسات. نحافظ على ضوابط أمنية قوية وتقييمات أمنية منتظمة لحماية بياناتك.',
    keyFeatures: 'الميزات الرئيسية',
    strengths: 'نقاط القوة',
    contactSupport: 'الاتصال والدعم',
    contactDescription: 'لأي أسئلة أو دعم أو لمناقشة احتياجاتك المحددة، يرجى الاتصال بنا على:',
  }
};

export {}; 