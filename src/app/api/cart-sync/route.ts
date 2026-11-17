import { NextResponse } from "next/server";

// In-memory shared cart storage for real-time synchronization
let sharedCart = {
  cart: [] as any[],
  tableNumber: "Takeout / Walk-in",
  paymentMethod: "cash",
  updatedAt: Date.now(),
};

// Store active SSE clients
let clients: ReadableStreamDefaultController[] = [];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");

  // If requesting SSE stream for real-time updates
  if (type === "stream") {
    const stream = new ReadableStream({
      start(controller) {
        clients.push(controller);
        // Send initial state
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify(sharedCart)}\n\n`),
        );
      },
      cancel() {
        clients = clients.filter((c) => c !== clients.find((x) => x === c));
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Standard GET for current cart
  return NextResponse.json(sharedCart);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    sharedCart = {
      ...sharedCart,
      ...body,
      updatedAt: Date.now(),
    };

    // Broadcast update to all connected SSE clients (real-time sync)
    const dataString = `data: ${JSON.stringify(sharedCart)}\n\n`;
    clients.forEach((client) => {
      try {
        client.enqueue(new TextEncoder().encode(dataString));
      } catch (e) {
        // Client disconnected
      }
    });

    return NextResponse.json({ success: true, sharedCart });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update cart" },
      { status: 500 },
    );
  }
}
