import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { postsAPI } from '../../api/api';
import { Image, Tag, Hash, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import UserAvatar from '../common/UserAvatar';

const CreatePostModal = ({ onClose, onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await postsAPI.createPost({
        content,
        tags
      });
      onPostCreated();
      onClose();
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const handleTagAdd = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const onEmojiClick = (emojiObject) => {
    setContent(prevInput => prevInput + emojiObject.emoji);
    setShowEmoji(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold tracking-tight">Create Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <UserAvatar user={user} className="w-10 h-10" />
              <span className="font-bold text-sm tracking-tight">{user?.username || 'User'}</span>
            </div>
            
            <textarea
              className="w-full text-lg focus:outline-none resize-none min-h-[120px]"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map(tag => (
                  <span key={tag} className="bg-gray-50 border border-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 hover:text-black">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center mt-2 border-t pt-4 relative">
              <button 
                type="button"
                onClick={() => setShowEmoji(!showEmoji)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
                title="Add Emoji"
              >
                😀
              </button>
              
              <button type="button" className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition" title="Add Image">
                <Image size={20} />
              </button>

              <div className="ml-auto flex items-center bg-gray-50 border border-transparent rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-black focus-within:bg-white transition-all">
                <Hash size={14} className="text-gray-400 mr-2" />
                <input 
                  type="text" 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTagAdd(e)}
                  placeholder="Add tags..."
                  className="bg-transparent focus:outline-none text-[11px] font-bold uppercase tracking-widest w-24"
                />
              </div>

              {showEmoji && (
                <div className="absolute top-12 left-0 z-10 shadow-xl rounded-xl custom-emoji-picker">
                   <EmojiPicker onEmojiClick={onEmojiClick} theme="light" />
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 flex justify-end">
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="bg-black text-white px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-20 hover:bg-gray-800 transition shadow-lg shadow-gray-200"
            >
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
