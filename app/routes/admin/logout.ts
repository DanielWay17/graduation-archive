import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { assertSameOrigin, logout } from "~/server/auth.server";

export async function action({ request }: Route.ActionArgs) {
  assertSameOrigin(request);
  return redirect("/", { headers: { "Set-Cookie": await logout(request) } });
}

export function loader() {
  return redirect("/");
}
