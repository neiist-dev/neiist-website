import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { User, UserRole } from '@/types/user';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const accessToken = (await cookies()).get('accessToken')?.value;
    const userData: User = JSON.parse((await cookies()).get('userData')?.value || 'null');

    if (!accessToken || !userData) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { userId } = await params;

    const isOwnPhoto = userData.istid === userId;
    const isAdmin = userData.roles.includes(UserRole.ADMIN);

    if (!isOwnPhoto && !isAdmin) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Fetch person data from Fenix API to get the photo
    const fenixResponse = await fetch(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/person?access_token=${accessToken}`, {
      headers: {
        'User-Agent': 'NEIIST-NextJS-App',
        'Accept': 'application/json',
      },
    });

    if (!fenixResponse.ok) {
      console.log('Fenix person API response status:', fenixResponse.status);
      return new NextResponse('Photo not found', { status: 404 });
    }

    const personData = await fenixResponse.json();

    // Check if photo exists in the response
    if (!personData.photo || !personData.photo.data) {
      console.log('No photo data in Fenix response');
      return new NextResponse('Photo not found', { status: 404 });
    }

    // Convert base64 to buffer
    const base64Data = personData.photo.data;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Get content type from Fenix response or default to png
    const contentType = personData.photo.type || 'image/png';

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
        'Content-Length': imageBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error in photo API:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}