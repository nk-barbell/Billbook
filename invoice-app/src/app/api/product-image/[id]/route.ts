import { getMe } from "@/lib/session";
import { productsCol } from "@/lib/types";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getMe();
  if (!me?.company) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const snap = await productsCol(me.company.id).doc(id).get();
  const image = snap.data()?.image as string | undefined;
  const m = image?.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
  if (!m) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(m[2], "base64"), {
    headers: { "Content-Type": m[1], "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
