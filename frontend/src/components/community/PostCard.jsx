import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Share2, MoreHorizontal, CornerDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactionBar from './ReactionBar';
import { useAuth } from '../../contexts/AuthContext';
import { postsAPI } from '../../api/api';
import UserAvatar from '../common/UserAvatar';

const CommentItem = ({ comment, isReply = false }) => (
  <div className={`flex space-x-3 ${isReply ? 'ml-10 mt-4 pb-1' : 'mb-6'}`}>
    <Link to={`/profile/${comment.user?.id}`}>
      <UserAvatar 
        user={comment.user}
        className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'}`}
      />
    </Link>
    <div className="flex-1">
      <div className="bg-gray-50 rounded-2xl px-4 py-2.5 relative">
        <div className="flex justify-between items-center mb-0.5">
          <Link to={`/profile/${comment.user?.id}`} className="font-semibold text-sm text-gray-900 hover:underline tracking-tight">
            {comment.user?.username}
          </Link>
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
      </div>
    </div>
  </div>
);

const PostCard = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const data = await postsAPI.getComments(post.id);
      setComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (showComments && post.id) {
      fetchComments();
    }
  }, [showComments, post.id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await postsAPI.addComment(post.id, { content: commentText });
      setCommentText('');
      fetchComments(); // Refresh comments list
      onUpdate();     // Refresh post stats (comment count)
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.author?.id}`}>
            <UserAvatar 
              user={post.author} 
              className="w-10 h-10 hover:opacity-80 transition"
            />
          </Link>
          <div>
            <Link to={`/profile/${post.author?.id}`} className="font-bold text-gray-900 hover:underline tracking-tight">
              {post.author?.username}
            </Link>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest block mt-0.5">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <p className="text-gray-800 whitespace-pre-wrap mb-4 font-medium text-[15px]">
        {post.content}
      </p>

      {post.images && post.images.length > 0 && (
        <div className="my-4 grid grid-cols-2 gap-2">
          {post.images.map((img, i) => (
            <img key={i} src={img.url} alt="Post attachment" className="rounded-lg object-cover w-full h-48 border" />
          ))}
        </div>
      )}

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map(t => (
            <span key={t.tag.id} className="bg-gray-100 text-gray-600 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              #{t.tag.name}
            </span>
          ))}
        </div>
      )}

      {post.event && (
        <div className="my-4 border rounded-xl overflow-hidden bg-gray-50">
          <div className="p-5">
            <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] mb-2 block">Event Invite</span>
            <h5 className="font-bold text-lg mb-1 tracking-tight text-gray-900">{post.event.name}</h5>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">{post.event.tagline}</p>
            <Link to={`/events/${post.event.id}`} className="inline-block text-xs font-bold uppercase tracking-widest text-black hover:underline">
              View Event &rarr;
            </Link>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-3 mt-4">
        <ReactionBar post={post} onReact={onUpdate} />
        
        <div className="flex space-x-4">
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-widest transition ${showComments ? 'text-black' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <MessageCircle size={16} />
            <span>{post._count?.comments || 0} Comments</span>
          </button>
          
          <button className="flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition">
            <Share2 size={16} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t">
          {user ? (
            <form onSubmit={handleCommentSubmit} className="flex space-x-2 mb-6">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-grow bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition tracking-tight"
              />
              <button 
                type="submit" 
                disabled={!commentText.trim()}
                className="bg-black text-white rounded-xl px-6 text-xs font-bold uppercase tracking-widest disabled:opacity-20 hover:bg-gray-800 transition shrink-0"
              >
                Post
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500 text-center mb-6">Log in to comment.</p>
          )}

          <div className="space-y-4">
            {loadingComments ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : comments.length > 0 ? (
              comments.map(comment => (
                <div key={comment.id}>
                  <CommentItem comment={comment} />
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="border-l-2 ml-4">
                      {comment.replies.map(reply => (
                        <CommentItem key={reply.id} comment={reply} isReply={true} />
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-gray-400 py-4 italic">No comments yet. Start the conversation!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
