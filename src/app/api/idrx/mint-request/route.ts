import { NextRequest, NextResponse } from "next/server";
import { idrxService } from "@/lib/idrx-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { amount, walletAddress, campaignAddress, token } =
      await request.json();
    const destinationAddress = walletAddress || campaignAddress;
    const normalizedToken =
      typeof token === "string" ? token.toLowerCase() : "idrx";
    const requestType = normalizedToken === "usdc" ? "usdt" : "idrx";
    const productDetails =
      normalizedToken === "usdc" ? "Minting USDC" : "Minting IDRX";

    if (!amount || !destinationAddress) {
      return NextResponse.json(
        { error: "Amount and destination address are required" },
        { status: 400 },
      );
    }

    const mintResponse = await idrxService.createMintRequest(
      amount,
      destinationAddress,
      24,
      requestType,
      productDetails,
    );

    return NextResponse.json({
      success: true,
      paymentUrl: mintResponse.data.paymentUrl,
      reference: mintResponse.data.reference,
      amount: mintResponse.data.amount,
    });
  } catch (error) {
    console.error("IDRX Mint Request Error:", error);
    return NextResponse.json(
      { error: "Failed to create payment request" },
      { status: 500 },
    );
  }
}
