import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Github,
  ExternalLink,
  Plus,
  X,
  Send,
  Trash2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const GridBackground = () => (
  <div className="fixed inset-0 pointer-events-none">
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    />
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.07) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.07) 1px, transparent 1px)
        `,
        backgroundSize: "200px 200px",
      }}
    />
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, transparent 0%, rgba(255,255,255,0.7) 100%)",
      }}
    />
  </div>
);

const AddProjectModal = ({ onClose, onAdd, getAccessToken, clubId }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    githubUrl: "",
    demoUrl: "",
    contributors: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/clubs/${clubId}/projects`,
        {
          title: form.title.trim(),
          description: form.description.trim(),
          githubUrl: form.githubUrl.trim() || null,
          demoUrl: form.demoUrl.trim() || null,
          contributors: form.contributors
            ? form.contributors
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
            : [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        },
      );
      onAdd(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add project.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      label: "Project Name",
      key: "title",
      placeholder: "e.g. Smart Grid Monitor",
      required: true,
      type: "input",
    },
    {
      label: "Description",
      key: "description",
      placeholder: "What does this project do?",
      required: true,
      type: "textarea",
    },
    {
      label: "Contributors",
      key: "contributors",
      placeholder: "Alice, Bob, Charlie (comma separated)",
      type: "input",
    },
    {
      label: "GitHub URL",
      key: "githubUrl",
      placeholder: "https://github.com/...",
      type: "input",
    },
    {
      label: "Demo URL",
      key: "demoUrl",
      placeholder: "https://...",
      type: "input",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative border border-gray-100/80">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-300 hover:text-gray-900 transition"
        >
          <X size={18} />
        </button>

        <h2 className="text-2xl font-light text-gray-900 mb-1">
          Add New Project
        </h2>
        <p className="text-sm font-light text-gray-400 mb-6">
          Share what your club has been building.
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 text-red-500 text-sm font-light px-4 py-2 rounded-2xl">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-light text-gray-400 uppercase tracking-wider mb-1.5">
                {field.label}
                {field.required && " *"}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  value={form[field.key]}
                  onChange={(e) =>
                    setForm({ ...form, [field.key]: e.target.value })
                  }
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-100 rounded-2xl text-sm font-light focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none bg-gray-50/50"
                />
              ) : (
                <input
                  type="text"
                  value={form[field.key]}
                  onChange={(e) =>
                    setForm({ ...form, [field.key]: e.target.value })
                  }
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 border border-gray-100 rounded-2xl text-sm font-light focus:outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50/50"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-light text-gray-400 hover:text-gray-900 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 text-sm font-light text-white bg-black hover:bg-gray-800 rounded-2xl transition disabled:opacity-40"
          >
            {loading ? "Adding..." : "Add Project"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CommentItem = ({
  comment,
  currentUserId,
  onDelete,
  onReply,
  depth = 0,
}) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(true);

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText.trim());
    setReplyText("");
    setShowReplyBox(false);
  };

  return (
    <div
      className={depth > 0 ? "ml-4 sm:ml-8 border-l border-gray-100 pl-4" : ""}
    >
      <div className="py-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-light">
                {comment.user?.username?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
            <span className="text-sm font-light text-gray-900">
              {comment.user?.username}
            </span>
            <span className="text-xs font-light text-gray-300">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          {currentUserId === comment.user?.id && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-gray-200 hover:text-red-400 transition"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        <p className="text-sm font-light text-gray-600 ml-8 leading-relaxed">
          {comment.content}
        </p>

        <div className="ml-8 mt-2 flex items-center gap-4">
          {currentUserId && (
            <button
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="text-xs font-light text-gray-300 hover:text-gray-700 transition"
            >
              reply
            </button>
          )}
          {comment.replies?.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-xs font-light text-gray-300 hover:text-gray-700 transition"
            >
              {showReplies ? (
                <ChevronUp size={11} />
              ) : (
                <ChevronDown size={11} />
              )}
              {comment.replies.length}{" "}
              {comment.replies.length === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>

        {showReplyBox && (
          <div className="ml-8 mt-3 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReply()}
              placeholder="Write a reply..."
              className="flex-1 px-3 py-1.5 border border-gray-100 rounded-2xl text-sm font-light focus:outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50/50"
            />
            <button
              onClick={handleReply}
              className="px-3 py-1.5 bg-black text-white rounded-2xl hover:bg-gray-800 transition"
            >
              <Send size={12} />
            </button>
          </div>
        )}
      </div>

      {showReplies && comment.replies?.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentsSection = ({
  projectId,
  getAccessToken,
  currentUserId,
  isAuthenticated,
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/clubs/${projectId}/comments`)
      .then((res) => setComments(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handlePost = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const token = await getAccessToken();
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/clubs/${projectId}/comments`,
        { content: newComment.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        },
      );
      setComments((prev) => [res.data, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (parentId, content) => {
    try {
      const token = await getAccessToken();
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/clubs/${projectId}/comments`,
        { content, parentId },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        },
      );
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...(c.replies || []), res.data] }
            : c,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      const token = await getAccessToken();
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/clubs/comments/${commentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        },
      );
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={13} className="text-gray-300" />
        <h4 className="text-xs font-light text-gray-400 uppercase tracking-widest">
          Discussion ({comments.length})
        </h4>
      </div>

      {isAuthenticated ? (
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePost()}
            placeholder="Share your thoughts..."
            className="flex-1 px-4 py-2 border border-gray-100 rounded-2xl text-sm font-light focus:outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50/50"
          />
          <button
            onClick={handlePost}
            disabled={posting}
            className="px-4 py-2 bg-black text-white rounded-2xl hover:bg-gray-800 transition disabled:opacity-40"
          >
            <Send size={13} />
          </button>
        </div>
      ) : (
        <p className="text-xs font-light text-gray-300 mb-4 pb-4 border-b border-gray-100">
          Log in to join the discussion.
        </p>
      )}

      <div
        className="flex-1 overflow-y-auto min-h-0 pr-2 no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-5 w-5 border-t border-b border-gray-200" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm font-light text-gray-300 text-center py-8">
            No comments yet. Be the first!
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onDelete={handleDelete}
                onReply={handleReply}
                depth={0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CommentsModal = ({
  onClose,
  project,
  getAccessToken,
  currentUserId,
  isAuthenticated,
}) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative border border-gray-100/80 overflow-hidden">
        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-xl font-light text-gray-900 mb-1">
              Project Discussion
            </h2>
            <p className="text-sm font-light text-gray-400 line-clamp-1">
              {project.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-900 transition mt-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 sm:p-8 flex-1 overflow-hidden flex flex-col min-h-0">
          <CommentsSection
            projectId={project.id}
            getAccessToken={getAccessToken}
            currentUserId={currentUserId}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
    </div>
  );
};

const ProjectCard = ({
  project,
  getAccessToken,
  currentUserId,
  isAuthenticated,
}) => {
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  return (
    <>
      <div className="relative group bg-white rounded-3xl p-6 sm:p-8 border border-gray-100/80 shadow-lg ">
        {/* Animated sweep line — same as DataCard */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] overflow-hidden rounded-b-3xl">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-gray-300 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </div>

        {/* Contributors */}
        {project.contributors?.length > 0 && (
          <div
            className="flex gap-1.5 mb-5 overflow-x-auto no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
            {project.contributors.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-500 text-xs font-light px-3 py-1 rounded-full border border-gray-100 whitespace-nowrap flex-shrink-0"
              >
                <span className="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[9px] flex-shrink-0">
                  {c[0]}
                </span>
                {c}
              </span>
            ))}
          </div>
        )}

        <h3 className="text-xl font-light text-gray-900 mb-3">
          {project.title}
        </h3>
        <p className="text-sm font-light text-gray-600 leading-relaxed line-clamp-3">
          {project.description}
        </p>

        {/* Links */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white text-sm font-light px-4 py-2 rounded-2xl transition-colors duration-200"
            >
              <Github size={13} />
              GitHub
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-light px-4 py-2 rounded-2xl border border-gray-100 transition-colors duration-200"
            >
              <ExternalLink size={13} />
              Live Demo
            </a>
          )}
          <button
            onClick={() => setShowCommentsModal(true)}
            className="flex items-center gap-1.5 text-sm font-light text-gray-400 hover:text-gray-900 transition ml-auto"
          >
            <MessageCircle size={13} />
            discussion
          </button>
        </div>
      </div>

      {showCommentsModal && (
        <CommentsModal
          onClose={() => setShowCommentsModal(false)}
          project={project}
          getAccessToken={getAccessToken}
          currentUserId={currentUserId}
          isAuthenticated={isAuthenticated}
        />
      )}
    </>
  );
};

const ClubProjects = () => {
  const { id: clubId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, getAccessToken, user } = useAuth();

  const [club, setClub] = useState(state?.club || null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const isConvener = isAuthenticated && club?.convener?.id === currentUserId;

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/clubs/${clubId}`)
      .then((res) => {
        setClub(res.data);
        setProjects(res.data.projects || []);
      })
      .catch((err) => console.error("Error fetching club:", err))
      .finally(() => setLoading(false));
  }, [clubId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUser = async () => {
      try {
        const token = await getAccessToken();
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          },
        );
        setCurrentUserId(res.data?.id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <GridBackground />

      {/* Header */}
      <div className="relative z-10 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center flex-shrink-0">
                <span className="text-white font-light text-2xl">
                  {club?.name?.[0] || "?"}
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-4xl font-light text-gray-900 truncate">
                  {club?.name || "Club"}
                </h1>
                <p className="text-gray-400 text-sm font-light mt-1">
                  {club?.description}
                </p>
              </div>
            </div>

            {isConvener && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white text-sm font-light px-5 py-2.5 rounded-2xl transition flex-shrink-0"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Add Project</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t border-b border-gray-300" />
          </div>
        ) : projects.length ? (
          <>
            <p className="text-xs font-light text-gray-400 uppercase tracking-widest mb-8">
              {projects.length} Project{projects.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  getAccessToken={getAccessToken}
                  currentUserId={currentUserId}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
              <Github size={22} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-light text-gray-500 mb-2">
              No projects yet
            </h3>
            <p className="text-sm font-light text-gray-300">
              {isConvener
                ? "Add your first project using the button above."
                : "This club hasn't shared any projects yet."}
            </p>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddProjectModal
          onClose={() => setShowAddModal(false)}
          onAdd={(p) => setProjects((prev) => [p, ...prev])}
          getAccessToken={getAccessToken}
          clubId={clubId}
        />
      )}
    </div>
  );
};

export default ClubProjects;
