

import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'product' },
    quantity: { type: Number, required: true }
  }],
  amount: { type: Number, required: true },
  address: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'address' },
  status: { 
    type: String, 
    default: 'Order Placed',
    enum: ['Order Placed', 'Shipped', 'Delivered', 'Cancelled']
  },
  paymentType: { type: String, required: true },
  isPaid: { type: Boolean, required: true, default: false },
  shippedAt: { type: Date },
  deliveredAt: { type: Date }
}, { timestamps: true });

const Order = mongoose.models.order || mongoose.model('order', orderSchema);
export default Order;