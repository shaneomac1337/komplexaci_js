import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Komplexaci-HealthCheck/1.0'
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000)
    });
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      url,
      status: response.ok ? 'online' : 'offline',
      statusCode: response.status,
      responseTime,
      lastChecked: new Date().toISOString()
    });
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      url,
      status: 'offline',
      error: error.message,
      responseTime,
      lastChecked: new Date().toISOString()
    });
  }
}