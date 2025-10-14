/**
 * User Model - Authentication and authorization for system access
 */
import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * User schema - Stores user credentials and role information
 */
const userSchema = new Schema(
  {

    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 30,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 128
    },
    role: {
      type: String,
      enum: ["admin", "staff"],
      required: true
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
