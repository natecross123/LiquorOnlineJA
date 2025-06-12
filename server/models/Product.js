import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {type: String, required: true },
    description: {type: Array, required: true},
    price: {type: Number, required: false},
    offerPrice: {type: Number, required: false },
    image: {type: Array, required: true },
    category: {type: String, required: true },
    inStock: {type: Boolean, default: true },
}, { timestamps: true})

const Product = mongoose.models.product || mongoose.model('product', productSchema)

export default Product 

