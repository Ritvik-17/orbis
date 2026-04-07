import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { postsAPI, friendsAPI } from "../api/api";
import PostCard from "../components/community/PostCard";
import CreatePostModal from "../components/community/CreatePostModal";
import FriendRequestsModal from "../components/community/FriendRequestsModal";
import { Plus, Bell, Search, UserPlus, Send  } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import UserAvatar from "../components/common/UserAvatar";

const Community = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCommunityData = async () => {
    try {
      const [postsRes, friendsRes, requestsRes] = await Promise.all([
        postsAPI.getPosts(),
        friendsAPI.getFriends(),
        friendsAPI.getPendingRequests(),
      ]);
      setPosts(postsRes);
      setFriends(friendsRes);
      setPendingCount(requestsRes.length);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, []);

  return (
    <div className="container mx-auto px-4 pt-32 pb-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Community</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {/* Feed */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Loading feed...
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onUpdate={fetchCommunityData}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
              <p className="text-gray-500 mb-4">
                No posts yet. Be the first to share something!
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-indigo-600 font-medium hover:underline"
              >
                Write a post &rarr;
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 hidden lg:block">
          {/* Sidebar */}
          <div className="bg-white rounded-xl shadow-sm border p-5 sticky top-32">
            <Link
              to="/inbox"
              className="w-full bg-white border border-gray-100 hover:bg-gray-50 text-gray-900 px-5 py-3 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center transition mb-4 shadow-sm"
            >
              <Send size={18} className="mr-2" />
              Messages
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center transition mb-4 shadow-lg shadow-gray-200"
            >
              <Plus size={18} className="mr-2" />
              Create Post
            </button>
            <button
              onClick={() => setIsRequestsModalOpen(true)}
              className="w-full bg-white border border-gray-100 hover:bg-gray-50 text-gray-900 px-5 py-3 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center transition mb-8 shadow-sm relative overflow-hidden group"
            >
              <Bell size={18} className="mr-2 group-hover:animate-swing" />
              Requests
              {pendingCount > 0 && (
                <span className="absolute top-3 right-5 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-lg font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">
              Your Friends
            </h2>
            {friends.length > 0 ? (
              <ul className="space-y-4">
                {friends.map((friend) => (
                  <li
                    key={friend.id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <Link to={`/profile/${friend.id}`}>
                        <UserAvatar
                          user={friend}
                          className="w-10 h-10 hover:opacity-80 transition"
                        />
                      </Link>
                      <div>
                        <Link
                          to={`/profile/${friend.id}`}
                          className="font-bold text-sm text-gray-900 block hover:underline tracking-tight"
                        >
                          {friend.username}
                        </Link>
                        <Link
                          to={`/inbox?user=${friend.id}`}
                          className="text-[9px] text-gray-400 font-bold uppercase tracking-widest hover:text-black transition-colors"
                        >
                          Message
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                You don't have any friends yet.
              </p>
            )}

            <div className="mt-8 pt-6 border-t px-1">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                <Search size={12} className="mr-2 text-black" />
                Discover
              </h3>
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search by username..."
                  onChange={async (e) => {
                    const q = e.target.value;
                    if (q.length > 2) {
                      const results = await friendsAPI.searchUsers(q);
                      setSearchResults(results.filter((u) => u.id !== user.id));
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  className="w-full text-[11px] bg-gray-50 border border-transparent rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all tracking-tight"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3 bg-gray-50/50 p-2 rounded-xl border border-gray-100 mb-4 max-h-48 overflow-y-auto">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between"
                    >
                      <Link
                        to={`/profile/${u.id}`}
                        className="flex items-center space-x-2 flex-1"
                      >
                        <UserAvatar user={u} className="w-6 h-6" />
                        <span className="text-xs font-medium truncate w-24">
                          {u.username}
                        </span>
                      </Link>
                      <button
                        onClick={async () => {
                          try {
                            await friendsAPI.sendRequest(u.id);
                            alert("Request sent!");
                            setSearchResults((prev) =>
                              prev.filter((r) => r.id !== u.id),
                            );
                          } catch (err) {
                            alert(err.response?.data?.error || "Failed");
                          }
                        }}
                        className="text-black hover:text-gray-500 transition p-1"
                        title="Add Friend"
                      >
                        <UserPlus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-gray-400 italic">
                Search for event enthusiasts and organizers to expand your
                network.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CreatePostModal
          onClose={() => setIsModalOpen(false)}
          onPostCreated={fetchCommunityData}
        />
      )}

      {isRequestsModalOpen && (
        <FriendRequestsModal
          onClose={() => setIsRequestsModalOpen(false)}
          onUpdate={fetchCommunityData}
        />
      )}
    </div>
  );
};

export default Community;
