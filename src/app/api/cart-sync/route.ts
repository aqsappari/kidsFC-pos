import { NextResponse } from "next/server";

// Store carts for terminals 1 to 10
let terminalCarts: Record<
  number,
  {
    cart: any[];
    tableNumber: string;
    paymentMethod: string;
    isReadyForCheckout: boolean;
    updatedAt: number;
  }
> = {};

// Initialize terminals 1 to 10 by default
for (let i = 1; i <= 10; i++) {
  terminalCarts[i] = {
    cart: [],
    tableNumber: "Takeout / Walk-in",
    paymentMethod: "cash",
    isReadyForCheckout: false,
    updatedAt: Date.now(),
  };
}

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
            `data: ${JSON.stringify(terminalCarts)}\n\n`,
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

  return NextResponse.json(terminalCarts);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { terminalId, ...cartData } = body;

    // Ensure we map to the exact terminal ID (default to 1 if missing)
    const targetId = parseInt(terminalId || "1", 10);

    if (terminalCarts[targetId]) {
      terminalCarts[targetId] = {
        ...terminalCarts[targetId],
        ...cartData,
        updatedAt: Date.now(),
      };
    }

    const dataString = `data: ${JSON.stringify(terminalCarts)}\n\n`;
    clients.forEach((client) => {
      try {
        client.enqueue(new TextEncoder().encode(dataString));
      } catch (e) {
        // Disconnected client
      }
    });

    return NextResponse.json({ success: true, terminalCarts });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update cart" },
      { status: 500 },
    );
  }
}
