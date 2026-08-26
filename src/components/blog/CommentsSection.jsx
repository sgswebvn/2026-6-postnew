import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { useBlog } from '../../context/BlogContext';
import { MessageSquare, ThumbsUp, Send } from 'lucide-react';

export const CommentsSection = ({ postId }) => {
  const { showToast } = useBlog();
  const [comments, setComments] = useState([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (postId) {
      setComments(storageService.getComments(postId));
    }
  }, [postId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const newComm = storageService.addComment(postId, {
      authorName: name.trim() || 'Verified Reader',
      authorRole: role.trim() || 'Executive Subscriber',
      content: content.trim()
    });

    setComments(prev => [newComm, ...prev]);
    setContent('');
    showToast('Your perspective has been submitted to the newsroom forum!');
  };

  const handleLike = (id) => {
    storageService.likeComment(id);
    setComments(prev => prev.map(c => c.id === id ? { ...c, likes: (c.likes || 0) + 1 } : c));
  };

  return (
    <section className="my-12 pt-10 border-t border-neutral-200 dark:border-neutral-800 space-y-8 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl font-bold text-neutral-950 dark:text-neutral-50 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Reader Discussion ({comments.length})</span>
        </h3>
        <span className="text-xs font-mono text-neutral-400">Moderated Newsroom Forum</span>
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-[#111622] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
          Join the Executive Discourse
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Your Full Name (e.g. David Reynolds)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Your Title / Organization (e.g. Wealth Lead)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <textarea
          rows="3"
          placeholder="Share your analytical perspective, strategic critique, or field observations..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500"
          required
        ></textarea>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <span>Post Insight</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map(c => {
          const formatted = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }).format(new Date(c.createdAt || Date.now()));

          return (
            <div key={c.id} className="p-5 bg-white dark:bg-[#111622] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={c.avatar} 
                    alt={c.authorName}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-700" 
                  />
                  <div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block">
                      {c.authorName}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {c.authorRole} • {formatted}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleLike(c.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-xs text-neutral-600 dark:text-neutral-300 hover:text-blue-500 transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{c.likes || 1}</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed pl-11">
                {c.content}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
