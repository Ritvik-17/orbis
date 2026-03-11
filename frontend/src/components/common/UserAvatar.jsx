import React from 'react';

const UserAvatar = ({ user, className = 'w-10 h-10', onClick }) => {
  const username = user?.username || 'User';
  const avatarUrl = user?.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=EEF2FF&color=4F46E5&bold=true`;

  return (
    <img 
      src={avatarUrl} 
      alt={username} 
      className={`rounded-full border object-cover shrink-0 ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      onError={(e) => {
        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=EEF2FF&color=4F46E5&bold=true`;
      }}
    />
  );
};

export default UserAvatar;
