import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { getAllUsers, createUser, updateUser, deleteUser, getUserById } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = await createUser(name, email, passwordHash, role || 'staff');

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    if (error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }
    console.error('Users POST error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, name, email, password, role } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 12);
    }

    await updateUser(id, updateData);
    const updatedUser = await getUserById(id);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Users PUT error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (String(id) === String(session.user.id)) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Users DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
