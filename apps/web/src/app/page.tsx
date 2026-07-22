import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  if (!cookieStore.has("bb_refresh")) redirect("/login");
  redirect(cookieStore.get("bb_last_workspace")?.value ? `/${cookieStore.get("bb_last_workspace")?.value}` : "/acme");
}
