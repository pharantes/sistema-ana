import dotenv from 'dotenv';
dotenv.config();

import mongoose from "mongoose";
import dbConnect from "./connect.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

async function seedUsers() {
  await dbConnect();

  const users = [
    {
      username: "admin",
      password: await bcrypt.hash("adminpassword", 10),
      role: "admin"
    },
    {
      username: "staff",
      password: await bcrypt.hash("staffpassword", 10),
      role: "staff"
    }
  ];

  for (const user of users) {
    const exists = await User.findOne({ username: user.username });
    if (!exists) {
      await User.create(user);
      console.log(`Created user: ${user.username}`);
    } else {
      console.log(`User already exists: ${user.username}`);
    }
  }

  await mongoose.connection.close();
}

seedUsers().catch((err) => {
  console.error(err);
  mongoose.connection.close();
});
