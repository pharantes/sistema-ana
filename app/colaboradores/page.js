"use client";
import ColaboradoresClient from "./Client";

export default function ColaboradoresPage() {
  // Client component - all data fetching happens in ColaboradoresClient
  return <ColaboradoresClient initialColaboradores={[]} isAdmin={false} />;
}
