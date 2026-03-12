"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
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
  isOwner: boolean;
  createdAt?: string;
};

interface UserType {
  name: string;
  username: string;
  userId: string;
  role: string;
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
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [gridSize, setGridSize] = useState<'large' | 'small'>('large');
  const [sortBy, setSortBy] = useState<'popular' | 'newest'>('popular');

  const [allPhotos, setAllPhotos] = useState<PhotoType[]>(initialPhotos);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPhotos = async () => {
    setIsLoading(true);
    try {
      // API'den her zaman varsayılan sırayla tüm fotoğrafları çek
      const res = await fetch(`/api/photos?sort=popular`);
      if (res.ok) {
        const data = await res.json();
        // Gelen veriyi current sortBy'a göre sırala
        const sorted = sortPhotosLocal(data.photos, sortBy);
        setAllPhotos(sorted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const sortPhotosLocal = (photosList: PhotoType[], sortMode: 'popular' | 'newest') => {
    return [...photosList].sort((a, b) => {
      if (sortMode === 'popular') {
        return b.voteCount - a.voteCount;
      } else {
        // ID timestamp'ten veya varsa createdAt'ten sırala
        return b.id.localeCompare(a.id);
      }
    });
  };

  const visiblePhotos = allPhotos.slice(0, visibleCount);
  const hasMore = visibleCount < allPhotos.length;

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setVisibleCount(prev => prev + 12);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  useEffect(() => {
    // Initial load sort
    if (initialPhotos && initialPhotos.length > 0) {
      setAllPhotos(sortPhotosLocal(initialPhotos, sortBy));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const savedSize = localStorage.getItem('gridSize');
    if (savedSize === 'large' || savedSize === 'small') {
      // ESLint uyarısını önlemek için state güncellemesini asenkron yapıyoruz
      queueMicrotask(() => setGridSize(savedSize));
    }

    const savedSort = localStorage.getItem('sortBy') as 'popular' | 'newest';
    if (savedSort === 'popular' || savedSort === 'newest') {
      queueMicrotask(() => {
        handleSortChange(savedSort);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetGridSize = (size: 'large' | 'small') => {
    setGridSize(size);
    localStorage.setItem('gridSize', size);
  };

  const handleSortChange = (newSort: 'popular' | 'newest') => {
    if (newSort === sortBy) return;
    setSortBy(newSort);
    setVisibleCount(12);
    localStorage.setItem('sortBy', newSort);
    
    // Yalnızca lokale sıralama yap, API'ye tekrar istek atma
    setAllPhotos(prev => sortPhotosLocal(prev, newSort));
  };

  const handleUploadSuccess = (newPhotos?: UploadResponsePhoto[]) => {
    if (newPhotos && newPhotos.length > 0) {
      const formattedPhotos = newPhotos.map(newPhoto => ({
        id: newPhoto._id,
        url: newPhoto.url,
        caption: newPhoto.caption,
        voteCount: 0,
        user: { name: user.name, username: user.username },
        hasVoted: false,
        isOwner: true,
      }));
      const newAll = [...formattedPhotos, ...allPhotos];
      setAllPhotos(sortPhotosLocal(newAll, sortBy));
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
          <p className={styles.subtitle}>En İyiler Vitrini • {allPhotos.length} Fotoğraf</p>
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
        {allPhotos.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👻</div>
            <p>Sınıfta kimse fotoğraf yüklememiş. İlk sen ol!</p>
          </div>
        ) : (
          <>
            <div className={styles.controlsWrapper}>
              <div className={styles.sortControls}>
                <button 
                  className={`${styles.viewBtn} ${sortBy === 'newest' ? styles.activeViewBtn : ''}`}
                  onClick={() => handleSortChange('newest')}
                >
                  En Yeni
                </button>
                <button 
                  className={`${styles.viewBtn} ${sortBy === 'popular' ? styles.activeViewBtn : ''}`}
                  onClick={() => handleSortChange('popular')}
                >
                  En Beğenilen
                </button>
              </div>

              <div className={styles.viewControls}>
                <button 
                  className={`${styles.viewBtn} ${gridSize === 'large' ? styles.activeViewBtn : ''}`}
                  onClick={() => handleSetGridSize('large')}
                >
                  Büyük
                </button>
                <button 
                  className={`${styles.viewBtn} ${gridSize === 'small' ? styles.activeViewBtn : ''}`}
                  onClick={() => handleSetGridSize('small')}
                >
                  Küçük
                </button>
              </div>
            </div>
            
            <div className={`${styles.grid} ${gridSize === 'small' ? styles.gridSmall : ''}`}>
              {visiblePhotos.map((photo) => (
                <PhotoCard 
                  key={photo.id} 
                  photo={photo} 
                  isAdmin={user.role === 'admin'} 
                />
              ))}
            </div>
            
            {hasMore && (
              <div 
                ref={lastElementRef} 
                style={{ height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', color: '#888' }}
              >
                {isLoading && <span>Yükleniyor...</span>}
              </div>
            )}
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
