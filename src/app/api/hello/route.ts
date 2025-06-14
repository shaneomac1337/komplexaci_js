// This is your first API route (backend code)!
// When someone visits /api/hello, this function runs on the server

export async function GET() {
  return Response.json({ 
    message: "Hello from your Next.js backend!", 
    timestamp: new Date().toISOString(),
    tip: "This is running on the server, not in the browser!"
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  return Response.json({
    message: "You sent data to the backend!",
    receivedData: body,
    timestamp: new Date().toISOString()
  });
}
