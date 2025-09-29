import dotenv from 'dotenv';
dotenv.config();

import mongoose from "mongoose";
import dbConnect from "./connect.js";
import Action from "./models/Action.js";

async function seedActions() {
  await dbConnect();

  const sampleStaff = [
    "alice - R$ 2100",
    "bob - R$ 1540",
    "carol - R$ 2200",
    "dave - R$ 1210",
    "erin - R$ 1380",
  ];

  const actions = [
    { name: "Website Audit", client: "Acme Corp", staff: [sampleStaff[0], sampleStaff[1]], createdBy: "admin" },
    { name: "SEO Optimization", client: "Globex", staff: [sampleStaff[2]], createdBy: "staff" },
    { name: "Campaign Setup", client: "Initech", staff: [sampleStaff[1], sampleStaff[3]], createdBy: "staff" },
    { name: "Content Plan", client: "Umbrella", staff: [sampleStaff[4]], createdBy: "admin" },
    { name: "Analytics Review", client: "Wayne Enterprises", staff: [sampleStaff[0]], createdBy: "staff" },
    { name: "Email Drip", client: "Stark Industries", staff: [sampleStaff[3], sampleStaff[2]], createdBy: "staff" },
    { name: "Landing Page", client: "Wonka", staff: [sampleStaff[1]], createdBy: "admin" },
    { name: "Lead Nurture", client: "Hooli", staff: [sampleStaff[4], sampleStaff[0]], createdBy: "staff" },
    { name: "Brand Refresh", client: "Soylent", staff: [sampleStaff[2]], createdBy: "admin" },
    { name: "PPC Tuning", client: "Tyrell", staff: [sampleStaff[3], sampleStaff[1]], createdBy: "staff" },
  ];

  for (const action of actions) {
    await Action.create(action);
    console.log(`Created action: ${action.name} for ${action.client}`);
  }

  await mongoose.connection.close();
}

seedActions().catch((err) => {
  console.error(err);
  mongoose.connection.close();
});
