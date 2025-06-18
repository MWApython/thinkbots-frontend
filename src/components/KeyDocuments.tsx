import React, { useState, useEffect } from 'react';
import { keyDocuments, KeyDocument } from '../data/keyDocumentsData';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { generatePDF } from '../utils/pdfGenerator';

const KeyDocuments: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Required' | 'Supporting'>('All');
  const [documentLinks, setDocumentLinks] = useState<Record<string, string>>({});
  const [customDocuments, setCustomDocuments] = useState<KeyDocument[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDocument, setNewDocument] = useState<KeyDocument>({
    id: '',
    document: '',
    purpose: '',
    reference: '',
    requiredFor: '',
    category: 'Required',
    documentLink: '',
  });
  
  // Add state for AI explanations
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [openExplanationIds, setOpenExplanationIds] = useState<string[]>([]);
  const [showExplanationModal, setShowExplanationModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add function to toggle explanation visibility
  const toggleExplanation = (id: string) => {
    setOpenExplanationIds(prev =>
      prev.includes(id) ? prev.filter(openId => openId !== id) : [...prev, id]
    );
  };

  // Add function to fetch AI explanation
  const fetchAIExplanation = async (doc: KeyDocument) => {
    if (aiExplanations[doc.id] || aiLoading[doc.id] || doc.reference === 'Best Practice') return;
    setAiLoading(prev => ({ ...prev, [doc.id]: true }));
    try {
      const res = await fetch('http://localhost:3001/api/ai-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: doc.id,
          requirement: doc.document,
          category: doc.category,
          reference: doc.reference,
          purpose: doc.purpose,
          requiredFor: doc.requiredFor,
        }),
      });
      const data = await res.json();
      setAiExplanations(prev => ({ ...prev, [doc.id]: data.solution || 'No explanation available.' }));
    } catch (e) {
      setAiExplanations(prev => ({ ...prev, [doc.id]: 'Error generating explanation.' }));
    } finally {
      setAiLoading(prev => ({ ...prev, [doc.id]: false }));
    }
  };

  // Fetch AI explanations for all documents on mount
  useEffect(() => {
    const allDocs = [...keyDocuments, ...customDocuments];
    allDocs.forEach(doc => {
      if (!aiExplanations[doc.id] && !aiLoading[doc.id] && doc.reference !== 'Best Practice') {
        fetchAIExplanation(doc);
      }
    });
  }, [keyDocuments, customDocuments]);

  // Fetch document links and custom documents
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch('http://localhost:3001/document-links').then(res => {
        if (!res.ok) throw new Error('Failed to fetch document links');
        return res.json();
      }),
      fetch('http://localhost:3001/documents').then(res => {
        if (!res.ok) throw new Error('Failed to fetch custom documents');
        return res.json();
      })
    ]).then(([links, customDocs]) => {
      setDocumentLinks(links);
      setCustomDocuments(customDocs);
      setLoading(false);
    }).catch(() => {
      setError('Failed to load key documents. Please try again.');
      setLoading(false);
    });
  }, []);

  const handleSaveLink = async (id: string, link: string) => {
    console.log('Attempting to save document link:', { id, link });
    try {
      const response = await fetch('http://localhost:3001/document-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id, link: link }),
      });
  
      if (!response.ok) {
        console.error('Failed to save document link. Status:', response.status);
        throw new Error(`Failed to save document link: ${response.status}`);
      }
      console.log('Document link saved successfully.');
      alert('Link saved successfully!'); // Add success message
  
    } catch (err: any) {
      console.error('Error saving document link:', err);
      alert('Failed to save link. Please try again.'); // Add error message
    }
  };

  const handleDeleteLink = async (id: string) => {
    console.log('Attempting to delete document link with ID:', id);
    try {
      const response = await fetch(`http://localhost:3001/document-links/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Failed to delete document link. Status:', response.status);
        throw new Error(`Failed to delete document link: ${response.status}`);
      }
      console.log('Document link deleted successfully.');
      setDocumentLinks(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });

    } catch (err: any) {
      console.error('Error deleting document link:', err);
    }
  };

  const allDocuments = [...keyDocuments, ...customDocuments];

  const filteredDocuments = allDocuments.filter(doc => 
    filter === 'All' ? true : doc.category === filter
  );

  const handleAddDocument = async () => {
    console.log('Attempting to add new document:', newDocument);
    try {
      const response = await fetch('http://localhost:3001/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDocument),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to add new document. Status:', response.status, 'Error:', errorData.message);
        throw new Error(`Failed to add new document: ${errorData.message || response.status}`);
      }
      const addedDocument: KeyDocument = await response.json();
      console.log('New document added successfully:', addedDocument);

      setCustomDocuments(prev => [...prev, addedDocument]);
      setShowAddModal(false);
      setNewDocument({
        id: '',
        document: '',
        purpose: '',
        reference: '',
        requiredFor: '',
        category: 'Required',
        documentLink: '',
      });
    } catch (err: any) {
      console.error('Error adding new document:', err);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    console.log('Attempting to delete document with ID:', id);
    try {
      const response = await fetch(`http://localhost:3001/documents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Failed to delete document. Status:', response.status);
        throw new Error(`Failed to delete document: ${response.status}`);
      }
      console.log('Document deleted successfully.');
      setCustomDocuments(prev => prev.filter(doc => doc.id !== id));

      setDocumentLinks(prev => {
         const newState = { ...prev };
         delete newState[id];
         return newState;
      });

    } catch (err: any) {
      console.error('Error deleting document:', err);
    }
  };

  // Add function to handle PDF download
  const handleDownloadPDF = async (docId: string) => {
    try {
      const doc = allDocuments.find(d => d.id === docId);
      if (!doc) return;
      
      const content = [
        {
          title: doc.document,
          content: `Purpose: ${doc.purpose}\nReference: ${doc.reference || 'N/A'}\nRequired For: ${doc.requiredFor}\nCategory: ${doc.category}`
        }
      ];
      
      // Add AI explanation if available
      if (showExplanationModal === docId && aiExplanations[docId]) {
        content.push({
          title: 'AI Explanation',
          content: aiExplanations[docId]
        });
      }
      
      const metadata = {
        title: doc.document,
        category: doc.category,
        date: new Date().toLocaleDateString(),
        user: 'System User'
      };
      
      await generatePDF({
        content,
        type: 'key-documents',
        language: 'en', // KeyDocuments doesn't have language toggle yet
        metadata
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        <span className="ml-4 text-lg text-blue-700 font-medium">Loading key documents...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg text-red-600 font-medium">{error}</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Key Documents Required under the SOCI Act</h1>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
  <p className="text-sm text-blue-800">
    <span className="font-semibold">📝 How to manage document links:</span>
    <ul className="list-disc list-inside mt-1 space-y-1">
      <li>Paste your document link in the input field</li>
      <li>Click "Save" to store the link</li>
      <li>Click "Delete" to remove the link</li>
    </ul>
  </p>
</div>
      
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('All')}
            className={`px-4 py-2 rounded ${
              filter === 'All' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } ripple-button keydocs-ripple-button`}
          >
            All Documents
          </button>
          <button
            onClick={() => setFilter('Required')}
            className={`px-4 py-2 rounded ${
              filter === 'Required' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } ripple-button keydocs-ripple-button`}
          >
            Required Documents
          </button>
          <button
            onClick={() => setFilter('Supporting')}
            className={`px-4 py-2 rounded ${
              filter === 'Supporting' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } ripple-button keydocs-ripple-button`}
          >
            Supporting Documents
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className={`px-4 py-2 rounded text-white ripple-button keydocs-green-ripple ${showAddModal ? 'bg-primary-600' : 'bg-green-600 hover:bg-green-700'} ${showAddModal ? 'selected' : ''}`}
            disabled={showAddModal}
          >
            Add Document
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Document</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="new-document-document" className="block text-sm font-medium text-gray-700">Document</label>
                <input
                  id="new-document-document"
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newDocument.document}
                  onChange={e => setNewDocument({...newDocument, document: e.target.value})}
                  placeholder="e.g., New Security Policy"
                />
              </div>
              <div>
                <label htmlFor="new-document-purpose" className="block text-sm font-medium text-gray-700">Purpose</label>
                <input
                  id="new-document-purpose"
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newDocument.purpose}
                  onChange={e => setNewDocument({...newDocument, purpose: e.target.value})}
                  placeholder="e.g., To enhance data protection"
                />
              </div>
              <div>
                <label htmlFor="new-document-reference" className="block text-sm font-medium text-gray-700">Reference (Optional)</label>
                <input
                  id="new-document-reference"
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newDocument.reference || ''}
                  onChange={e => setNewDocument({...newDocument, reference: e.target.value})}
                  placeholder="e.g., Section 4.1"
                />
              </div>
              <div>
                <label htmlFor="new-document-requiredFor" className="block text-sm font-medium text-gray-700">Required For</label>
                <input
                  id="new-document-requiredFor"
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newDocument.requiredFor}
                  onChange={e => setNewDocument({...newDocument, requiredFor: e.target.value})}
                  placeholder="e.g., All Employees"
                />
              </div>
              <div>
                <label htmlFor="new-document-category" className="block text-sm font-medium text-gray-700">Category</label>
                 <select
                  id="new-document-category"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newDocument.category}
                  onChange={e => setNewDocument({...newDocument, category: e.target.value as 'Required' | 'Supporting'})}
                >
                  <option value="Required">Required</option>
                  <option value="Supporting">Supporting</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 ripple-button"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 ripple-button"
                onClick={handleAddDocument}
              >
                Add Document
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded">
          <thead>
            <tr>
              <th className="px-4 py-2 border bg-gray-50">Document</th>
              <th className="px-4 py-2 border bg-gray-50">Purpose</th>
              <th className="px-4 py-2 border bg-gray-50">Reference</th>
              <th className="px-4 py-2 border bg-gray-50">Required For</th>
              <th className="px-4 py-2 border bg-gray-50">Document Link</th>
              <th className="px-4 py-2 border bg-gray-50">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.map((doc) => (
              <tr key={doc.id} className={doc.category === 'Supporting' ? 'bg-gray-50' : ''}>
                <td className="px-4 py-2 border font-medium">{doc.document}</td>
                <td className="px-4 py-2 border">{doc.purpose}</td>
                <td className="px-4 py-2 border">
                  <div className="space-y-2">
                    <div className="font-mono">{doc.reference}</div>
                    {doc.reference !== 'Best Practice' && (
                      <button
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center ripple-button"
                        onClick={() => setShowExplanationModal(doc.id)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700">
                          i
                        </span>
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 border">{doc.requiredFor}</td>
                <td className="px-4 py-2 border">
                  {documentLinks[doc.id] ? (
                    <a
                      href={documentLinks[doc.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-2 py-1 border rounded text-sm flex-grow text-blue-600 hover:underline cursor-pointer"
                    >
                      {documentLinks[doc.id]}
                    </a>
                  ) : (
                    <input
                      type="text"
                      className="w-full px-2 py-1 border rounded text-sm flex-grow"
                      placeholder="Paste document link here..."
                      value={documentLinks[doc.id] || ''}
                      onChange={(e) => {
                        setDocumentLinks(prevLinks => ({
                          ...prevLinks,
                          [doc.id]: e.target.value
                        }));
                      }}
                      aria-label={`Document link for ${doc.document}`}
                    />
                  )}
                </td>
                <td className="px-4 py-2 border">
                  <div className="flex items-center space-x-2">
                    {documentLinks[doc.id] && (
                      <button
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-semibold shadow ripple-button"
                        onClick={() => handleSaveLink(doc.id, documentLinks[doc.id] || '')}
                        aria-label={`Save link for ${doc.document}`}
                      >
                        Save
                      </button>
                    )}
                    {documentLinks[doc.id] && (
                      <button
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-semibold shadow ripple-button"
                        onClick={() => handleDeleteLink(doc.id)}
                        aria-label={`Delete link for ${doc.document}`}
                      >
                        Delete
                      </button>
                    )}
                    {!documentLinks[doc.id] && customDocuments.some(customDoc => customDoc.id === doc.id) && (
                      <button
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-semibold shadow ripple-button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        aria-label={`Delete document ${doc.document}`}
                      >
                        Delete Document
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Explanation Modal */}
      {showExplanationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start p-6 border-b">
              <h2 className="text-xl font-bold">Document Reference Explanation</h2>
              <button
                className="text-gray-500 hover:text-gray-700 ripple-button"
                onClick={() => setShowExplanationModal(null)}
                aria-label="Close explanation modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const doc = allDocuments.find(d => d.id === showExplanationModal);
                if (!doc) return null;
                
                return (
                  <div id={`explanation-content-${doc.id}`}>
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg">{doc.document}</h3>
                      <p className="text-gray-600 text-sm">Reference: {doc.reference}</p>
                    </div>
                    <div className="prose max-w-none">
                      {aiLoading[doc.id] ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Generating explanation...</p>
                        </div>
                      ) : aiExplanations[doc.id] === 'Error generating explanation.' ? (
                        <div className="text-red-500 text-center py-4">
                          <p>Error generating explanation.</p>
                          <button
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            onClick={() => fetchAIExplanation(doc)}
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <ReactMarkdown>{aiExplanations[doc.id] || ''}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="p-6 border-t bg-gray-50">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center ripple-button"
                onClick={() => handleDownloadPDF(showExplanationModal)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyDocuments; 