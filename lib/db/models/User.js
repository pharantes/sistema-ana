import mongoose from "mongoose";
const { Schema } = mongoose;

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
