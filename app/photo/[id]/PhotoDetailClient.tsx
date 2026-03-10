"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './PhotoDetailClient.module.css';

type PhotoType = {
  id: string;
  url: string;
  caption: string | null;
  voteCount: number;
  user: { name: string; username: string };
  hasVoted: boolean;
  isOwner: boolean;
  currentUserId: string;
  comments: { id: string; text: string; createdAt: string; userId: string; user: { name: string; username: string } }[];
};

export default function PhotoDetailClient({ initialPhoto }: { initialPhoto: PhotoType }) {
  const [photo, setPhoto] = useState(initialPhoto);
  const [isVoting, setIsVoting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const toggleVote = async () => {
    if (isVoting) return;
    setIsVoting(true);

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setPhoto(prev => ({
          ...prev,
          hasVoted: data.voted,
          voteCount: data.voted ? prev.voteCount + 1 : prev.voteCount - 1
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsVoting(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isCommenting) return;
    setIsCommenting(true);

    try {
      const res = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id, text: newComment }),
      });

      if (res.ok) {
        const data = await res.json();
        setPhoto(prev => ({
          ...prev,
          comments: [...prev.comments, data.comment]
        }));
        setNewComment("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsCommenting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!window.confirm('Bu yorumu silmek istediğine emin misin?')) return;
    
    try {
      const res = await fetch(`/api/comment/${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPhoto(prev => ({
          ...prev,
          comments: prev.comments.filter(c => c.id !== commentId)
        }));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const deletePhoto = async () => {
    if (!window.confirm('Bu fotoğrafı silmek istediğine emin misin?')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error(error);
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Vitrine Dön
        </button>
      </header>

      <div className={styles.contentWrapper}>
        <div className={styles.imageColumn}>
          <div className={styles.imageBox}>
            <Image 
              src={photo.url} 
              alt={photo.caption || 'Fotoğraf'} 
              fill 
              sizes="(max-width: 1024px) 100vw, 65vw"
              className={styles.image} 
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>

        <div className={styles.detailsColumn}>
          <div className={styles.userInfoBox}>
            <div className={styles.avatarBig}>{photo.user.name.charAt(0)}</div>
            <div>
              <h2 className={styles.userName}>{photo.user.name}</h2>
              <p className={styles.userNameHandle}>@{photo.user.username}</p>
            </div>
          </div>
          
          {photo.caption && (
            <div className={styles.captionBox}>
              <p>{photo.caption}</p>
            </div>
          )}

          <div className={styles.actionBox}>
            <button 
              className={`${styles.voteBtnBig} ${photo.hasVoted ? styles.voted : ''}`}
              onClick={toggleVote}
              disabled={isVoting}
            >
              <span className={styles.heartIconBig}>
                {photo.hasVoted ? '❤️' : '🤍'}
              </span>
              <span className={styles.voteText}>
                {photo.voteCount} Beğeni
              </span>
            </button>
            {photo.isOwner && (
              <button
                className={styles.deleteBtnBig}
                onClick={deletePhoto}
                disabled={isDeleting}
              >
                {isDeleting ? 'Siliniyor...' : '🗑️ Fotoğrafı Sil'}
              </button>
            )}
          </div>

          <div className={styles.commentsSection}>
            <h3 className={styles.commentsTitle}>Yorumlar ({photo.comments.length})</h3>
            
            <div className={styles.commentsList}>
              {photo.comments.map(comment => (
                <div key={comment.id} className={styles.commentItem}>
                  <div className={styles.commentAvatar}>{comment.user.name.charAt(0)}</div>
                  <div className={styles.commentContent}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentName}>{comment.user.name}</span>
                      <div className={styles.commentMeta}>
                        <span className={styles.commentTime}>
                          {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                        {comment.userId === photo.currentUserId && (
                          <button 
                            className={styles.commentDeleteBtn}
                            onClick={() => deleteComment(comment.id)}
                          >
                            Sil
                          </button>
                        )}
                      </div>
                    </div>
                    <p className={styles.commentText}>{comment.text}</p>
                  </div>
                </div>
              ))}
              {photo.comments.length === 0 && (
                <p className={styles.noCommentsText}>İlk yorumu sen yap!</p>
              )}
            </div>

            <form onSubmit={submitComment} className={styles.commentForm}>
              <input
                type="text"
                placeholder="Bir yorum yaz..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className={styles.commentInput}
                maxLength={200}
              />
              <button 
                type="submit" 
                className={styles.commentSubmitBtn}
                disabled={isCommenting || !newComment.trim()}
              >
                Gönder
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
