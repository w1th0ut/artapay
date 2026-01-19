import { NextRequest, NextResponse } from "next/server";
import { idrxService } from "@/lib/idrx-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const transactionType = searchParams.get("transactionType") as
      | "MINT"
      | "BURN"
      | "BRIDGE"
      | "DEPOSIT_REDEEM";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const take = parseInt(searchParams.get("take") || "10", 10);
    const walletAddress =
      searchParams.get("walletAddress") || searchParams.get("campaignAddress");
    const reference = searchParams.get("reference");
    const requestType = searchParams.get("requestType") || undefined;
    const normalizedRequestType = requestType?.toLowerCase();

    if (!transactionType) {
      return NextResponse.json(
        { error: "transactionType is required" },
        { status: 400 },
      );
    }

    let result;

    if (reference) {
      result = await idrxService.getTransactionByReference(reference);
    } else if (walletAddress) {
      result = await idrxService.getCampaignTransactions(
        walletAddress,
        page,
        take,
        requestType,
      );
    } else {
      result = await idrxService.getTransactionHistory({
        transactionType,
        page,
        take,
        orderByDate: "DESC",
        ...(requestType ? { requestType } : {}),
      });
    }

    const filterRecords = (records: any[]) => {
      if (!normalizedRequestType) return records;
      const target = normalizedRequestType === "usdc" ? "usdt" : normalizedRequestType;

      return records.filter((record) => {
        const recordType = String(record?.requestType || "").toLowerCase();
        const productDetails = String(record?.productDetails || "").toLowerCase();
        if (target === "usdt") {
          return (
            recordType === "usdt" ||
            recordType === "usdc" ||
            productDetails.includes("usdc")
          );
        }
        if (target === "idrx") {
          return (
            recordType === "idrx" ||
            productDetails.includes("idrx") ||
            (!recordType && !productDetails)
          );
        }
        return recordType === target;
      });
    };

    const resultAny = result as any;
    let filteredResult = resultAny;
    if (Array.isArray(resultAny)) {
      filteredResult = filterRecords(resultAny);
    } else if (resultAny && Array.isArray(resultAny.records)) {
      const filteredRecords = filterRecords(resultAny.records);
      filteredResult = {
        ...resultAny,
        records: filteredRecords,
        metadata: {
          ...resultAny.metadata,
          totalCount: filteredRecords.length,
        },
      };
    } else if (resultAny && normalizedRequestType) {
      const single = resultAny as any;
      const singleType = String(single?.requestType || "").toLowerCase();
      if (normalizedRequestType === "usdc" && singleType !== "usdt") {
        filteredResult = null;
      } else if (normalizedRequestType !== "usdc" && singleType !== normalizedRequestType) {
        filteredResult = null;
      }
    }

    return NextResponse.json({
      success: true,
      data: filteredResult,
    });
  } catch (error) {
    console.error("Transaction History API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction history" },
      { status: 500 },
    );
  }
}
