"use client";

import { useState } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import styles from './CommentSection.module.scss';
import { v4 as uuidv4 } from 'uuid';

interface Comment {
  id: string;
  user: string;
  content: string;
  timestamp: string;
}

// Mock Data
const MOCK_COMMENTS: Comment[] = [
  { id: '1', user: 'HanniPham', content: 'NewJeans Fighting! 🐰', timestamp: '10 mins ago' },
  { id: '2', user: 'Fearless', content: 'LE SSERAFIM is the best!', timestamp: '1 hour ago' },
  { id: '3', user: 'Bunnies', content: 'Vote every day!', timestamp: '2 hours ago' },
  { id: '4', user: 'Carat17', content: 'Seventeen to the moon 🚀', timestamp: '5 hours ago' },
  { id: '5', user: 'MyDay', content: 'Day6 music is healing.', timestamp: '1 day ago' }
];

export default function CommentSection() {
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [user, setUser] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.trim() || !content.trim()) return;

    const newComment: Comment = {
      id: uuidv4(),
      user: user,
      content: content,
      timestamp: 'Just now'
    };

    setComments([newComment, ...comments]);
    setContent('');
    // User name might be kept or cleared depending on UX, clearing for now as per "form reset" pattern usually
    // But usually user name is sticky. Let's keep user name.
  };

  const handleDelete = (id: string) => {
    setComments(comments.filter(c => c.id !== id));
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        <MessageSquare size={20} />
        Fan Comments
      </h3>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Nickname" 
          className={styles.input}
          value={user}
          onChange={(e) => setUser(e.target.value)}
          maxLength={20}
        />
        <textarea 
          placeholder="Cheer for your favorite company! (Max 200 chars)" 
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={200}
        />
        <button 
          type="submit" 
          className={styles.submitBtn}
          disabled={!user.trim() || !content.trim()}
        >
          Post Comment
        </button>
      </form>

      <div className={styles.commentList}>
        {comments.map((comment) => (
          <div key={comment.id} className={styles.commentItem}>
            <div className={styles.header}>
              <span className={styles.user}>{comment.user}</span>
              <span className={styles.time}>{comment.timestamp}</span>
            </div>
            <p className={styles.content}>{comment.content}</p>
            <button className={styles.deleteBtn} onClick={() => handleDelete(comment.id)} aria-label="Delete comment">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
