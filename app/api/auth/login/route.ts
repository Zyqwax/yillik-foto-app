import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { setSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Kullanıcı adı ve şifre gereklidir.' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { message: 'Geçersiz kullanıcı adı veya şifre.' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'Geçersiz kullanıcı adı veya şifre.' },
        { status: 401 }
      );
    }

    await setSession(user._id.toString(), user.username, user.name, user.role || 'user');

    return NextResponse.json({ 
      message: 'Giriş başarılı.', 
      user: { 
        id: user._id.toString(), 
        username: user.username, 
        name: user.name,
        role: user.role || 'user'
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Bir hata oluştu.' },
      { status: 500 }
    );
  }
}
