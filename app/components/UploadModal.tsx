"use client";

import { useState } from 'react';
import styles from './UploadModal.module.css';

interface UploadResponsePhoto {
  _id: string;
  url: string;
  caption: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function UploadModal({ isOpen, onClose, onUploadSuccess }: { isOpen: boolean, onClose: () => void, onUploadSuccess: (photos?: UploadResponsePhoto[]) => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      alert('Lütfen en az bir fotoğraf seçin.');
      return;
    }

    setIsUploading(true);

    const uploadedPhotos: UploadResponsePhoto[] = [];
    let hasError = false;

    // Fotoğrafları sırayla (ardışık) yükle ki yükleme sırasında sıkışma veya timeout olmasın
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', caption);
      formData.append('isAnonymous', String(isAnonymous));

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          uploadedPhotos.push(data.photo);
        } else {
          const data = await res.json();
          alert(`${file.name} yüklenirken hata: ` + (data.message || 'Başarısız!'));
          hasError = true;
          // Hata olsa da diğerlerine devam edilebilir veya durdurulabilir. Biz devam edelim.
        }
      } catch (error) {
        console.error(error);
        alert(`${file.name} yüklenirken ağ hatası oluştu.`);
        hasError = true;
      }
    }

    setIsUploading(false);

    if (uploadedPhotos.length > 0) {
      setFiles([]);
      setCaption('');
      onUploadSuccess(uploadedPhotos);
      onClose();
    } else if (!hasError) {
      // Eğer hiç fotoğraf yüklenmediyse ve hata da yoksa (ki bu garip bir durum)
      alert("Yüklenecek dosya bulunamadı.");
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Fotoğraf Yükle</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.dropzone}>
            <label htmlFor="fileUpload" className={styles.fileLabel}>
              {files.length > 0 ? `${files.length} fotoğraf seçildi` : '📸 Fotoğraf(lar) seç veya sürükle'}
            </label>
            <input
              id="fileUpload"
              type="file"
              accept="image/*"
              multiple
              className={styles.fileInput}
              onChange={(e) => {
                if (e.target.files) {
                  setFiles(Array.from(e.target.files));
                } else {
                  setFiles([]);
                }
              }}
            />
          </div>
          
          <input
            type="text"
            placeholder="Kısa bir açıklama (Opsiyonel)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className={styles.textInput}
            maxLength={100}
          />
          
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className={styles.checkboxInput}
            />
            <span>Anonim olarak yükle (Kimliğin gizli kalır)</span>
          </label>
          
          <button type="submit" className={styles.submitBtn} disabled={isUploading || files.length === 0}>
            {isUploading ? 'Yükleniyor...' : 'Şamataya Katıl!'}
          </button>
        </form>
      </div>
    </div>
  );
}
