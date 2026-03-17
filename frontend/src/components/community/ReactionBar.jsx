import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2, Award, ThumbsUp } from 'lucide-react';
import { postsAPI } from '../../api/api';

const ReactionBar = ({ post, onReact }) => {
  const { user } = useAuth();
  
  const handleReact = async (type) => {
    try {
      await postsAPI.reactToPost(post.id, type);
      onReact();
    } catch (err) {
      console.error(err);
    }
  };

  const getReactionCount = (type) => {
    return post.reactions?.filter(r => r.type === type).length || 0;
  };

  const hasReacted = (type) => {
    return post.reactions?.some(r => r.type === type && r.user?.auth0Id === user?.auth0Id);
  };

  return (
    <div className="flex items-center space-x-4 border-t pt-3 mt-3">
      <button 
        onClick={() => handleReact('LIKE')}
        className={`flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-widest transition ${hasReacted('LIKE') ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
      >
        <Heart size={16} fill={hasReacted('LIKE') ? 'currentColor' : 'none'} />
        <span>{getReactionCount('LIKE') > 0 && getReactionCount('LIKE')}</span>
      </button>

      <button 
        onClick={() => handleReact('SUPPORT')}
        className={`flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-widest transition ${hasReacted('SUPPORT') ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}
      >
        <ThumbsUp size={16} fill={hasReacted('SUPPORT') ? 'currentColor' : 'none'} />
        <span>{getReactionCount('SUPPORT') > 0 && getReactionCount('SUPPORT')}</span>
      </button>

      <button 
        onClick={() => handleReact('CELEBRATE')}
        className={`flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-widest transition ${hasReacted('CELEBRATE') ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
      >
        <Award size={16} fill={hasReacted('CELEBRATE') ? 'currentColor' : 'none'} />
        <span>{getReactionCount('CELEBRATE') > 0 && getReactionCount('CELEBRATE')}</span>
      </button>
    </div>
  );
};

export default ReactionBar;
