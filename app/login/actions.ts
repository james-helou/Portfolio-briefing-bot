"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cookieOptions, verifyPassword } from "@/lib/auth";
import { COOKIE_NAME, COOKIE_VALUE } from "@/lib/auth-constants";

export async function loginAction(formData: FormData) {
  const submitted = String(formData.get("password") ?? "");
  if (!verifyPassword(submitted)) {
    redirect("/login?error=1");
  }
  const store = await cookies();
  store.set(COOKIE_NAME, COOKIE_VALUE, cookieOptions());
  redirect("/");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
  redirect("/login");
}
