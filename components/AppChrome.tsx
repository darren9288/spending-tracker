"use client";
import { usePathname } from "next/navigation";
import Nav from "./Nav";

const AUTH_ROUTES = ["/login", "/signup"];

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isAuth = AUTH_ROUTES.includes(path);

  if (isAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">{children}</div>
      </main>
    );
  }

  return (
    <>
      <Nav />
      <main className="md:ml-56 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-6">{children}</div>
      </main>
    </>
  );
}
