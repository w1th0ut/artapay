const API_URL =
  process.env.NEXT_PUBLIC_SIGNER_API_URL || "http://localhost:3001";

export interface SwapQuoteResponse {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  fee: string;
  totalUserPays: string;
}

export async function fetchSwapQuote(params: {
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
}): Promise<SwapQuoteResponse> {
  const url = `${API_URL}/swap/quote?tokenIn=${params.tokenIn}&tokenOut=${
    params.tokenOut
  }&amountIn=${params.amountIn.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "quote failed" }));
    throw new Error(err.message || "quote failed");
  }
  return (await res.json()) as SwapQuoteResponse;
}

export async function buildSwapCalldata(params: {
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  minAmountOut: bigint;
}): Promise<{ to: string; data: string; value: string }> {
  const res = await fetch(`${API_URL}/swap/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      amountIn: params.amountIn.toString(),
      minAmountOut: params.minAmountOut.toString(),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "build failed" }));
    throw new Error(err.message || "build failed");
  }

  const data = await res.json();
  return { to: data.to, data: data.data, value: data.value };
}
