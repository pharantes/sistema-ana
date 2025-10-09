import { apiHandler } from "@/lib/apiHandler";
import { requireRole } from "@/lib/auth/requireRole";
import { validateCampaign } from "@/lib/validators/campaign";
import Campaign from "@/models/Campaign"; // adjust path

async function createCampaign(req, res) {
  const user = await requireRole(req, res, "manager");
  const data = validateCampaign(req.body);
  const newCampaign = await Campaign.create({ ...data, createdBy: user.email });
  res.status(201).json(newCampaign);
}

async function listCampaigns(req, res) {
  const user = await requireRole(req, res, "user");
  const campaigns = await Campaign.find().limit(50).lean();
  res.status(200).json(campaigns);
}

export default apiHandler({
  POST: createCampaign,
  GET: listCampaigns,
});
