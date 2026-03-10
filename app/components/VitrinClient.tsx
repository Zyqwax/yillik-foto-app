"use client";

import { useState } from 'react';
import styles from './VitrinClient.module.css';
import PhotoCard from './PhotoCard';
import UploadModal from './UploadModal';

type PhotoType = {
  id: string;
  url: string;
  caption: string | null;
  voteCount: number;
  user: { name: string; username: string };
  hasVoted: boolean;
};

interface UserType {
  name: string;
  username: string;
  userId: string;
}

interface UploadResponsePhoto {
  _id: string;
  url: string;
  caption: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function VitrinClient({ initialPhotos, user }: { initialPhotos: PhotoType[], user: UserType }) {
  const [photos, setPhotos] = useState<PhotoType[]>(initialPhotos);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [gridSize, setGridSize] = useState<'large' | 'small'>('large');

  const fetchPhotos = async () => {
    try {
      const res = await fetch('/api/photos');
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadSuccess = (newPhoto?: UploadResponsePhoto) => {
    if (newPhoto) {
      // API'den gelen veriyi client modeline uygun hale getirelim
      const formattedPhoto: PhotoType = {
        id: newPhoto._id,
        url: newPhoto.url,
        caption: newPhoto.caption,
        voteCount: 0,
        user: { name: user.name, username: user.username },
        hasVoted: false,
      };
      setPhotos(prev => [formattedPhoto, ...prev]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      fetchPhotos();
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoInfo}>
          <div className={styles.logo}>📸 Şamata</div>
          <p className={styles.subtitle}>En İyiler Vitrini • {photos.length} Fotoğraf</p>
        </div>
        
        <div className={styles.actions}>
          <span className={styles.greeting}>Merhaba, <strong>{user.name}</strong></span>
          <button onClick={() => setIsUploadOpen(true)} className={styles.uploadBtn}>
            + Fotoğraf Yükle
          </button>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Çıkış
          </button>
        </div>
      </header>

      <main>
        {photos.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👻</div>
            <p>Sınıfta kimse fotoğraf yüklememiş. İlk sen ol!</p>
          </div>
        ) : (
          <>
            <div className={styles.viewControls}>
              <button 
                className={`${styles.viewBtn} ${gridSize === 'large' ? styles.activeViewBtn : ''}`}
                onClick={() => setGridSize('large')}
              >
                Büyük
              </button>
              <button 
                className={`${styles.viewBtn} ${gridSize === 'small' ? styles.activeViewBtn : ''}`}
                onClick={() => setGridSize('small')}
              >
                Küçük
              </button>
            </div>
            
            <div className={`${styles.grid} ${gridSize === 'small' ? styles.gridSmall : ''}`}>
              {photos.map((photo) => (
                <PhotoCard key={photo.id} photo={photo} />
              ))}
            </div>
          </>
        )}
      </main>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUploadSuccess={handleUploadSuccess} 
      />
    </div>
  );
}
