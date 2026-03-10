import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Vote from '@/models/Vote';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const photos = await Photo.find({})
      .populate<{ userId: { name: string, username: string } }>('userId', 'name username')
      .sort({ voteCount: -1 });

    const formattedPhotos = await Promise.all(photos.map(async (photo) => {
      const vote = await Vote.findOne({
        userId: session.userId,
        photoId: photo._id
      });

      return {
        id: (photo._id as string).toString(),
        url: photo.url,
        caption: photo.caption,
        voteCount: photo.voteCount,
        user: photo.isAnonymous 
          ? { name: 'Anonim Kullanıcı', username: 'anonim' } 
          : { name: photo.userId.name, username: photo.userId.username },
        hasVoted: !!vote
      };
    }));

    return NextResponse.json({ photos: formattedPhotos });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ message: 'Fotoğraflar yüklenemedi' }, { status: 500 });
  }
}
