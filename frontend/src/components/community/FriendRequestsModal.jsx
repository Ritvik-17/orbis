import React, { useState, useEffect } from 'react';
import { friendsAPI } from '../../api/api';
import { X, Check, UserX } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

const FriendRequestsModal = ({ onClose, onUpdate }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const data = await friendsAPI.getPendingRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId, action) => {
    try {
      await friendsAPI.respondToRequest(requestId, action);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      onUpdate(); // Refresh friends list in background
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold tracking-tight">Friend Requests</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <UserAvatar user={req.sender} className="w-10 h-10" />
                    <div>
                      <p className="font-bold text-sm tracking-tight">{req.sender?.username}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Connect Request</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleAction(req.id, 'ACCEPT')}
                      className="p-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition shadow-md"
                      title="Accept"
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'REJECT')}
                      className="p-2.5 bg-gray-100 text-gray-400 rounded-xl hover:bg-gray-200 transition"
                      title="Decline"
                    >
                      <UserX size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>No pending friend requests.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendRequestsModal;
