"use client";
import { useSession } from "next-auth/react";
import ColaboradoresClient from "./Client";

export default function ColaboradoresPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "staff";

  return <ColaboradoresClient initialColaboradores={[]} isAdmin={isAdmin} />;
}
