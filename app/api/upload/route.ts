import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    await dbConnect();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string;
    const isAnonymous = formData.get('isAnonymous') === 'true';

    if (!file) {
      return NextResponse.json({ message: 'Dosya seçilmedi' }, { status: 400 });
    }

    // Convert File to base64 data URI for Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${base64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'yillik-foto',
      public_id: `${Date.now()}-${session.userId}`,
      overwrite: false,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },   // Otomatik kalite optimizasyonu
        { fetch_format: 'auto' },   // WebP/AVIF dönüşümü (daha hızlı yükleme)
      ],
    });

    const photoUrl = result.secure_url;

    const newPhoto = await Photo.create({
      url: photoUrl,
      caption: caption || null,
      userId: session.userId,
      isAnonymous,
    });

    return NextResponse.json({ message: 'Yükleme başarılı', photo: newPhoto });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ message: 'Dosya yüklenirken hata oluştu' }, { status: 500 });
  }
}
