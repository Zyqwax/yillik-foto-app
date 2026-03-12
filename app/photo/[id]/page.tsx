import PhotoDetailClient from './PhotoDetailClient';
import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Vote from '@/models/Vote';
import Comment from '@/models/Comment';
import '@/models/User'; // Ensure User model is registered for population

// In Next.js 15, params is a Promise
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PhotoPage({ params }: PageProps) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  await dbConnect();
  const { id } = await params;

  let formattedPhoto;
  try {
    const photo = await Photo.findById(id)
      .populate<{ userId: { name: string, username: string, _id: unknown } }>('userId', 'name username');

    if (!photo) {
      notFound();
    }

    const vote = await Vote.findOne({
      userId: session.userId,
      photoId: id
    });

    const comments = await Comment.find({ photoId: id })
      .populate<{ userId: { name: string, username: string, _id: unknown } }>('userId', 'name username')
      .sort({ createdAt: 1 });

    formattedPhoto = {
      id: (photo._id as string).toString(),
      url: photo.url,
      caption: photo.caption,
      voteCount: photo.voteCount,
      user: photo.isAnonymous 
        ? { name: 'Anonim Kullanıcı', username: 'anonim' }
        : { name: photo.userId.name, username: photo.userId.username },
      hasVoted: !!vote,
      isOwner: (photo.userId._id as string).toString() === session.userId,
      isAdmin: session.role === 'admin',
      currentUserId: session.userId,
      comments: comments.map((c) => ({
        id: (c._id as string).toString(),
        text: c.text,
        createdAt: c.createdAt.toISOString(),
        userId: (c.userId._id as string).toString(),
        user: {
          name: c.userId.name,
          username: c.userId.username
        }
      }))
    };
  } catch (error) {
    console.error('Error fetching photo:', error);
    notFound();
  }

  return (
    <main>
      <PhotoDetailClient initialPhoto={formattedPhoto} />
    </main>
  );
}
