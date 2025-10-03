import bcrypt from "bcryptjs";
import dbConnect from "../../lib/db/connect.js";
import User from "../../lib/db/models/User.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "Missing username or password" });
    }

    await dbConnect();
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const cookieValue = encodeURIComponent(user._id.toString());
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const isProd = process.env.NODE_ENV === "production";
    const cookie = `auth=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}` + (isProd ? "; Secure" : "");
    res.setHeader("Set-Cookie", cookie);

    return res.status(200).json({ message: "Login successful" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}