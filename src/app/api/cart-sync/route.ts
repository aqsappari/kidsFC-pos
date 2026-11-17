import { NextResponse } from "next/server";

let sharedCartState = {
  cart: [] as any[],
  tableNumber: "Takeout / Walk-in",
  paymentMethod: "cash",
  isReadyForCheckout: false,
  updatedAt: Date.now(),
};

let clients: ReadableStreamDefaultController[] = [];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");

  if (type === "stream") {
    const stream = new ReadableStream({
      start(controller) {
        clients.push(controller);
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify(sharedCartState)}\n\n`,
          ),
        );
      },
      cancel() {
        clients = clients.filter((c) => c !== controller);
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

  return NextResponse.json(sharedCartState);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    sharedCartState = {
      ...sharedCartState,
      ...body,
      updatedAt: Date.now(),
    };

    const dataString = `data: ${JSON.stringify(sharedCartState)}\n\n`;
    clients.forEach((client) => {
      try {
        client.enqueue(new TextEncoder().encode(dataString));
      } catch (e) {
        // Disconnected client
      }
    });

    return NextResponse.json({ success: true, sharedCartState });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update cart" },
      { status: 500 },
    );
  }
}
