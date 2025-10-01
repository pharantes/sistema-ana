import { getServerSession } from "next-auth";
import { servidorController } from "@/lib/controllers/servidorController";

export const GET = servidorController.get;
export const POST = servidorController.post;
export const PATCH = servidorController.patch;
export const DELETE = servidorController.delete;