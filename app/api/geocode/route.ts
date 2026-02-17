
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', Strasbourg')}&limit=5&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'fr',
          'User-Agent': 'HoplaApp/1.0 (NextJS)'
        },
      }
    );

    if (!response.ok) {
       return NextResponse.json({ error: 'Search service busy' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Geocode Proxy Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
