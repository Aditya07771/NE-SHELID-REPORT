import { NextResponse } from 'next/server';
import { getImageKitAuthParams } from '@/services/imagekit.service';

export async function POST() {
  try {
    const authParams = getImageKitAuthParams();
    return NextResponse.json({
      success: true,
      data: authParams,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate ImageKit auth params' },
      { status: 500 }
    );
  }
}
