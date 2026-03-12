"use client";

import { useState } from 'react';
import styles from './PhotoCard.module.css';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';

interface PhotoCardProps {
  photo: {
    id: string;
    url: string;
    caption: string | null;
    voteCount: number;
    user: { name: string; username: string };
    hasVoted: boolean;
    isOwner: boolean;
  };
  isAdmin?: boolean;
}

export default function PhotoCard({ photo, isAdmin }: PhotoCardProps) {
  const [voteCount, setVoteCount] = useState(photo.voteCount);
  const [hasVoted, setHasVoted] = useState(photo.hasVoted);
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isVoting) return;
    setIsVoting(true);

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoId: photo.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setHasVoted(data.voted);
        setVoteCount((prev) => (data.voted ? prev + 1 : prev - 1));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Bu fotoğrafı silmek istediğine emin misin?')) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Silme işlemi başarısız oldu.');
      }
    } catch (error) {
      console.error(error);
      alert('Bir hata oluştu.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.card}>
      <Link href={`/photo/${photo.id}`} className={styles.imageLink}>
        <div className={styles.imageWrapper}>
          <CldImage 
            src={photo.url} 
            alt={photo.caption || "Fotoğraf"} 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={styles.image} 
            style={{ objectFit: 'cover' }}
            format="auto"
            quality="50"
          />
          {(photo.isOwner || isAdmin) && (
            <button 
              className={styles.deleteBtn}
              onClick={handleDelete}
              title="Fotoğrafı Sil"
              disabled={isDeleting}
            >
              <span className={styles.deleteIcon}>{isDeleting ? '⏳' : '🗑️'}</span>
            </button>
          )}
        </div>
      </Link>
      
      <div className={styles.content}>
        {photo.caption && <p className={styles.caption}>{photo.caption}</p>}
        
        <div className={styles.actions}>
          <div className={styles.uploaderInfo}>
            <div className={styles.avatar}>
               {photo.user.name === 'Anonim Kullanıcı' ? 'A' : photo.user.name.charAt(0).toUpperCase()}
            </div>
            <span className={styles.uploaderName} title={photo.user.name}>
              {photo.user.name === 'Anonim Kullanıcı' ? 'Anonim' : photo.user.name}
            </span>
          </div>

          <button 
            className={`${styles.voteBtn} ${hasVoted ? styles.voted : ''}`}
            onClick={toggleVote}
            disabled={isVoting}
          >
            <span className={styles.heartIcon}>
              {hasVoted ? '❤️' : '🤍'}
            </span>
            <span className={styles.voteCount}>{voteCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
