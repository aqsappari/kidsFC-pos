import { NextResponse } from "next/server";

// Define terminals with their secure tokens (salt/secret)
const TERMINAL_CONFIGS: Record<
  string,
  { tableNumber: string; secretToken: string }
> = {
  "table-1": { tableNumber: "Table 1", secretToken: "t1_sec_9x8w7v" },
  "table-2": { tableNumber: "Table 2", secretToken: "t2_sec_5k4j3h" },
  "table-3": { tableNumber: "Table 3", secretToken: "t3_sec_2m1n0b" },
  "table-4": { tableNumber: "Table 4", secretToken: "t4_sec_8p7q6r" },
  "table-5": { tableNumber: "Table 5", secretToken: "t5_sec_4y3z2x" },
  "table-6": { tableNumber: "Table 6", secretToken: "t6_sec_1w2e3r" },
  "table-7": { tableNumber: "Table 7", secretToken: "t7_sec_7u8i9o" },
  "table-8": { tableNumber: "Table 8", secretToken: "t8_sec_3a4s5d" },
  "table-9": { tableNumber: "Table 9", secretToken: "t9_sec_9g8f7d" },
  "table-10": { tableNumber: "Table 10", secretToken: "t10_sec_6h5j4k" },
  "waiter-1": {
    tableNumber: "Takeout / Walk-in",
    secretToken: "waiter_sec_pass99",
  },
};

let terminalCarts: Record<
  string,
  {
    cart: any[];
    tableNumber: string;
    paymentMethod: string;
    isReadyForCheckout: boolean;
    updatedAt: number;
    secretToken: string;
  }
> = {};

// Initialize carts with their security tokens
for (const [tId, config] of Object.entries(TERMINAL_CONFIGS)) {
  terminalCarts[tId] = {
    cart: [],
    tableNumber: "",
    paymentMethod: "cash",
    isReadyForCheckout: false,
    updatedAt: Date.now(),
    secretToken: config.secretToken,
  };
}

let clients: ReadableStreamDefaultController[] = [];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");

  if (type === "stream") {
    let currentController: ReadableStreamDefaultController;

    const stream = new ReadableStream({
      start(controller) {
        currentController = controller;
        clients.push(controller);
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify(terminalCarts)}\n\n`,
          ),
        );
      },
      cancel() {
        clients = clients.filter((c) => c !== currentController);
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
    const { terminalId, token, resetTerminal, ...cartData } = body;
    const targetId = String(terminalId || "table-1");

    // Security Check: Verify secret token if terminal exists
    if (terminalCarts[targetId]) {
      if (token && token !== terminalCarts[targetId].secretToken) {
        return NextResponse.json(
          { success: false, error: "Unauthorized terminal access token." },
          { status: 403 },
        );
      }
    }

    if (!terminalCarts[targetId]) {
      terminalCarts[targetId] = {
        cart: [],
        tableNumber: "",
        paymentMethod: "cash",
        isReadyForCheckout: false,
        updatedAt: Date.now(),
        secretToken:
          "dynamic_token_" + Math.random().toString(36).substring(2, 8),
      };
    }

    if (resetTerminal) {
      terminalCarts[targetId] = {
        ...terminalCarts[targetId],
        cart: [],
        tableNumber: "",
        paymentMethod: "cash",
        isReadyForCheckout: false,
        updatedAt: Date.now(),
      };
    } else {
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
