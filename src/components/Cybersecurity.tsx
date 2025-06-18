import React, { useState, useEffect } from 'react';
import { getUsernameFromEmail } from '../utils/emailHelpers';

interface Requirement {
  id: string;
  requirement: string;
}

const Cybersecurity: React.FC = () => {
  const [data, setData] = useState<Requirement[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});

  // Fetch existing comments on component mount
  useEffect(() => {
    console.log('Fetching comments...');
    fetch('http://localhost:3001/api/cyber-comments')
      .then(res => res.json())
      .then(data => {
        console.log('Received comments:', data);
        setComments(data);
      })
      .catch(err => console.error('Error fetching comments:', err));
  }, []);

  // Fetch requirements data on component mount
  useEffect(() => {
    console.log('Fetching requirements...');
    fetch('http://localhost:3001/api/requirements')
      .then(res => res.json())
      .then(data => {
        console.log('Received requirements:', data);
        setData(data);
      })
      .catch(err => console.error('Error fetching requirements:', err));
  }, []);

  const handleCommentChange = (id: string, comment: string) => {
    console.log('Saving comment:', { id, comment });
    setComments(prev => ({ ...prev, [id]: comment }));
    // Save comment to backend
    fetch('http://localhost:3001/api/cyber-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, comment }),
    })
    .then(res => res.json())
    .then(data => console.log('Comment saved successfully:', data))
    .catch(err => console.error('Error saving comment:', err));
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-700">Comments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item: Requirement) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.requirement}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="text"
                      className="w-full border rounded px-2 py-1"
                      value={comments[item.id] || ''}
                      onChange={(e) => handleCommentChange(item.id, e.target.value)}
                      placeholder="Add a comment..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Cybersecurity; 