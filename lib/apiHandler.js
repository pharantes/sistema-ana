import dbConnect from "@/lib/mongoose";

/**
 * Generic API handler wrapper.
 * Example usage:
 * export default apiHandler({ POST: createCampaign })
 */
export function apiHandler(handlers) {
  return async function handler(req, res) {
    const method = req.method?.toUpperCase();
    const fn = handlers[method];
    if (!fn) return res.status(405).json({ error: "Method not allowed" });

    try {
      await dbConnect();
      await fn(req, res);
    } catch (err) {
      console.error(err);
      res.status(err.status || 500).json({ error: err.message || "Server error" });
    }
  };
}
