import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { messagesAPI } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { formatDistanceToNow } from 'date-fns';
import UserAvatar from '../common/UserAvatar';

const ChatThread = ({ conversation, selectedUser, onMessageSent }) => {
  const { user } = useAuth();
  const { socket, joinConversation, leaveConversation } = useChat();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchMessages = async () => {
      if (conversation?.id) {
        try {
          const res = await messagesAPI.getConversation(conversation.id);
          if (mounted) setMessages(res);
        } catch (err) {
          console.error(err);
        }
      } else {
        setMessages([]);
      }
    };

    fetchMessages();

    if (conversation?.id && socket) {
      joinConversation(conversation.id);
      
      const handleReceive = (msg) => {
        setMessages(prev => [...prev, msg]);
      };
      
      socket.on('message:receive', handleReceive);
      
      return () => {
        mounted = false;
        socket.off('message:receive', handleReceive);
        leaveConversation(conversation.id);
      };
    }
    
    return () => { mounted = false; };
  }, [conversation?.id, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const sentMsg = await messagesAPI.sendMessage({
        conversationId: conversation?.id,
        receiverId: selectedUser?.id,
        content: newMessage
      });
      
      setMessages(prev => [...prev, sentMsg]);
      setNewMessage('');
      if (onMessageSent) onMessageSent();
    } catch (err) {
      console.error(err);
    }
  };

  const onEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const otherUser = selectedUser || conversation?.members?.find(m => m.user.auth0Id !== user?.auth0Id)?.user;

  if (!otherUser) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <MessageSquare size={48} className="text-gray-300 mb-4" />
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="border-b px-6 py-4 flex items-center bg-white z-10">
        <UserAvatar 
          user={otherUser} 
          className="w-10 h-10 mr-4"
        />
        <div>
          <h3 className="font-bold text-gray-900 tracking-tight">{otherUser.username}</h3>
          <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Active Now</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((msg, i) => {
          const isMe = msg.sender.auth0Id === user?.auth0Id;
          return (
            <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-2.5 rounded-2xl max-w-[75%] text-sm tracking-tight leading-relaxed shadow-sm ${isMe ? 'bg-black text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none text-gray-800'}`}>
                {msg.content}
              </div>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 px-1">
                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-4 bg-white relative">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className="text-gray-400 hover:text-black p-2 transition-colors"
            >
              <Smile size={20} />
            </button>
            {showEmoji && (
              <div className="absolute bottom-12 left-0 z-50 shadow-xl rounded-xl custom-emoji-picker">
                <EmojiPicker onEmojiClick={onEmojiClick} theme="light" />
              </div>
            )}
          </div>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-100/50 border border-transparent rounded-xl px-5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all tracking-tight"
          />
          
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-black hover:bg-gray-800 disabled:opacity-20 text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95"
          >
            <Send size={18} className="translate-x-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatThread;
