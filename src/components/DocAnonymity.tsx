import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { apiUpload } from '../utils/api';
import API_CONFIG from '../config/api';

const DocAnonymity: React.FC = () => {
  const { language, t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [maskList, setMaskList] = useState('');
  const [maskedFileUrl, setMaskedFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMaskedFileUrl(null);
      setError(null);
    }
  };

  const handleAnonymize = async () => {
    if (!file || !maskList.trim()) {
      setError(t('pleaseUploadDocument'));
      return;
    }
    setLoading(true);
    setError(null);
    setMaskedFileUrl(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('maskList', maskList);
      const { downloadUrl } = await apiUpload('/api/doc-anonymity', formData);
      setMaskedFileUrl(downloadUrl);
    } catch (err: any) {
      setError(err.message || t('anErrorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm flex items-start">
        <svg className="w-6 h-6 text-blue-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <div className="text-sm text-blue-900">
          <span className="font-semibold">{language === 'ar' ? 'معلومات:' : 'Information:'}</span> {t('docAnonymityInfo')}
        </div>
      </div>
      <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded-lg p-4 shadow-sm flex items-start">
        <svg className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 17a5 5 0 100-10 5 5 0 000 10z" />
        </svg>
        <div className="text-sm text-yellow-900">
          <span className="font-semibold">{language === 'ar' ? 'تحذير:' : 'Warning:'}</span> {t('docAnonymityWarning')}
        </div>
      </div>
      <div className="p-8 bg-white rounded-xl shadow-lg flex flex-col gap-6">
        <h1 className="text-2xl font-bold mb-2 text-primary-700">
          {t('docAnonymityTitle')} 
          <span className="text-base font-normal text-gray-500">({t('docAnonymitySubtitle')})</span>
        </h1>
        <p className="text-gray-700 mb-4">
          {t('docAnonymityDescription')}
        </p>
        <div>
          <label className="block font-semibold mb-2">{t('uploadDocument')}</label>
          <input type="file" accept=".txt,.doc,.docx,.pdf" onChange={handleFileChange} className="w-full px-4 py-2 border rounded bg-gray-50" title={t('uploadDocumentTitle')} placeholder={t('uploadDocumentPlaceholder')} />
        </div>
        <div>
          <label className="block font-semibold mb-2">{t('wordsToMask')}</label>
          <textarea
            className="w-full px-4 py-2 border rounded bg-gray-50"
            rows={4}
            value={maskList}
            onChange={e => setMaskList(e.target.value)}
            placeholder={t('wordsToMaskPlaceholder')}
          />
        </div>
        <button
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#5c6bc0] to-[#3949ab] text-white font-semibold shadow transition-all duration-200 w-full"
          onClick={handleAnonymize}
          disabled={loading || !file || !maskList.trim()}
        >
          {loading ? t('processing') : t('performAnonymity')}
        </button>
        {error && <div className="text-red-600 font-semibold">{error}</div>}
        {maskedFileUrl && (
          <div className="mt-4">
            <a
              href={`${API_CONFIG.BASE_URL}${maskedFileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition"
            >
              {t('downloadMaskedDocument')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocAnonymity;
