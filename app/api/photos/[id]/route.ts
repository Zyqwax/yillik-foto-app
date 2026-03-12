import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Vote from '@/models/Vote';
import Comment from '@/models/Comment';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id } = await params;

    const photo = await Photo.findById(id);

    if (!photo) {
      return NextResponse.json({ message: 'Fotoğraf bulunamadı' }, { status: 404 });
    }

    if (photo.userId.toString() !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ message: 'Bu fotoğrafı silme yetkiniz yok' }, { status: 403 });
    }

    // Delete from Cloudinary (extract public_id from URL)
    try {
      const urlParts = photo.url.split('/');
      const folderAndFile = urlParts.slice(-2).join('/');           // "yillik-foto/filename"
      const publicId = folderAndFile.replace(/\.[^/.]+$/, '');     // Remove extension
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary delete error (non-fatal):', error);
      // Devam et — DB kaydı silinmeli
    }

    // Delete from DB (manual cascade)
    await Vote.deleteMany({ photoId: id });
    await Comment.deleteMany({ photoId: id });
    await Photo.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Fotoğraf silindi' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ message: 'Silme işlemi sırasında hata oluştu' }, { status: 500 });
  }
}
