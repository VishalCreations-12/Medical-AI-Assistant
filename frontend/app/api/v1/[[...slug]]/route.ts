import { dispatchV1 } from "@/lib/server/v1-handler";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await ctx.params;
  return dispatchV1("GET", slug ?? [], req);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await ctx.params;
  return dispatchV1("POST", slug ?? [], req);
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await ctx.params;
  return dispatchV1("PUT", slug ?? [], req);
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await ctx.params;
  return dispatchV1("DELETE", slug ?? [], req);
}
