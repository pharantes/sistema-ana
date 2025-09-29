import mongoose from "mongoose";
const { Schema } = mongoose;

const staffEntrySchema = new Schema(
  {
    name: { type: String, required: true },
    value: { type: Number, required: true },
    pix: { type: String },
    bank: { type: String },
  },
  { _id: false }
);

const actionSchema = new Schema(
  {
    name: { type: String }, // event/title
    event: { type: String }, // optional alias
    client: { type: String },
    date: { type: Date },
    paymentMethod: { type: String },
    dueDate: { type: Date },
    staff: { type: [staffEntrySchema], required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

const Action = mongoose.models.Action || mongoose.model("Action", actionSchema);

export default Action;
