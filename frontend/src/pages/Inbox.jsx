import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { messagesAPI, friendsAPI } from '../api/api';
import ChatThread from '../components/chat/ChatThread';
import { useAuth } from '../contexts/AuthContext';
import { Search } from 'lucide-react';
import UserAvatar from '../components/common/UserAvatar';

const Inbox = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const fetchData = async () => {
    try {
      const [inboxRes, friendsRes] = await Promise.all([
        messagesAPI.getInbox(),
        friendsAPI.getFriends()
      ]);
      setConversations(inboxRes);
      setFriends(friendsRes);

      // Handle user query param
      const userId = searchParams.get('user');
      if (userId) {
        // Check if conversation exists
        const existing = inboxRes.find(c => 
          c.members.find(m => m.user.id === userId)
        );
        if (existing) {
          setActiveConv({ type: 'conversation', data: existing });
        } else {
          // If not in inbox, fetch the user info to start new chat
          try {
            const userData = await postsAPI.getUserProfile(userId);
            setActiveConv({ type: 'user', data: userData });
          } catch (err) {
            console.error('Failed to fetch user for deep link:', err);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  const handleSearchChange = async (e) => {
    const q = e.target.value;
    setSearch(q);
    if (q.length > 2) {
      try {
        const results = await friendsAPI.searchUsers(q);
        setSearchResults(results.filter(u => u.id !== user?.id));
      } catch (err) {
        console.error(err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const getOtherMember = (conv) => {
    return conv.members.find(m => m.user.auth0Id !== user?.auth0Id)?.user;
  };

  const handleSelectUser = (selectedUser) => {
    // Check if conversation exists
    const existing = conversations.find(c => 
      c.members.find(m => m.user.id === selectedUser.id)
    );
    if (existing) {
      setActiveConv({ type: 'conversation', data: existing });
    } else {
      setActiveConv({ type: 'user', data: selectedUser });
    }
    setSearch('');
    setSearchResults([]);
  };

  return (
    <div className="container mx-auto px-4 pt-32 pb-12 h-[80vh] min-h-[600px]">
      <div className="bg-white rounded-2xl shadow-sm border h-full flex overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-1/3 border-r h-full flex flex-col bg-gray-50/50">
          <div className="p-5 border-b bg-white">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>
            
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Search people..."
                value={search}
                onChange={handleSearchChange}
                className="w-full bg-gray-100/50 border border-transparent rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all tracking-tight"
              />
            </div>
            
            {(search || searchResults.length > 0) && (
              <div className="absolute mt-1 w-[calc(33.33%-20px)] bg-white border shadow-xl rounded-xl z-20 max-h-80 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map(u => (
                    <button 
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className="w-full flex items-center p-3 text-left hover:bg-gray-50 border-b last:border-0 transition"
                    >
                      <UserAvatar user={u} className="w-8 h-8 mr-3 shadow-sm" />
                      <div>
                        <span className="font-bold text-sm block tracking-tight">{u.username}</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Start Conversation</span>
                      </div>
                    </button>
                  ))
                ) : search.length > 2 ? (
                  <div className="p-4 text-center text-xs text-gray-500 italic">No users found for "{search}"</div>
                ) : null}
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length > 0 ? (
              <ul className="divide-y">
                {conversations.map(conv => {
                  const other = getOtherMember(conv);
                  const lastMsg = conv.messages?.[0];
                  const isActive = activeConv?.data?.id === conv.id;
                  
                  return (
                    <li key={conv.id}>
                      <button 
                        onClick={() => setActiveConv({ type: 'conversation', data: conv })}
                        className={`w-full flex items-start p-5 text-left transition ${isActive ? 'bg-white shadow-sm border-l-2 border-black' : 'hover:bg-white/50'}`}
                      >
                        <UserAvatar 
                          user={other} 
                          className="w-12 h-12 border-white shadow-sm mt-0.5 mr-3" 
                        />
                        <div className="overflow-hidden w-full">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h4 className="font-bold text-gray-900 truncate tracking-tight">{other?.username}</h4>
                            {lastMsg && (
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest shrink-0 ml-2">
                                {new Date(lastMsg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs truncate tracking-tight ${lastMsg?.isRead === false && lastMsg?.senderId !== user?.id ? 'font-bold text-black' : 'text-gray-400 font-medium'}`}>
                            {lastMsg ? lastMsg.content : 'No messages yet'}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No conversations yet.</p>
                <p className="text-sm mt-1">Search for a friend above to start chatting.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-2/3 h-full bg-white relative">
          {activeConv ? (
            <ChatThread 
              conversation={activeConv.type === 'conversation' ? activeConv.data : null}
              selectedUser={activeConv.type === 'user' ? activeConv.data : null}
              onMessageSent={fetchData} 
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
               <div className="w-24 h-24 mb-6 rounded-full bg-gray-50 border-4 border-gray-100 flex items-center justify-center">
                 <svg className="w-10 h-10 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
               </div>
               <p className="text-lg font-medium text-gray-500">Your Messages</p>
               <p className="text-sm mt-1">Select a chat or start a new conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
