import { getDataset } from "@/lib/ckan";
import { respond } from "@/lib/http";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return respond(() => getDataset(id));
}
