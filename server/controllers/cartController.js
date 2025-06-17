import User from "../models/User.js";

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

export const updateCart = async (req, res) => {
  try {
    const { cartItems } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Auth required" });
    }

    // Simple validation
    const sanitized = {};
    if (cartItems && typeof cartItems === 'object') {
      for (const [productId, quantity] of Object.entries(cartItems)) {
        const id = parseInt(productId);
        const qty = parseInt(quantity);
        if (!isNaN(id) && !isNaN(qty) && qty > 0 && qty <= 50) {
          sanitized[id] = qty;
        }
      }
    }

    const [updatedRowsCount] = await User.update(
      { cartItems: sanitized },
      { where: { id: userId }, fields: ['cartItems'] }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    cache.set(`cart:${userId}`, { data: sanitized, expires: Date.now() + CACHE_TTL });

    return res.json({ success: true, message: "Cart updated" });
  } catch (error) {
    console.error("Cart update error:", error);
    return res.status(500).json({ success: false, message: "Failed to update cart" });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Auth required" });
    }

    const cacheKey = `cart:${userId}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() < cached.expires) {
      return res.json({ success: true, cartItems: cached.data });
    }

    const user = await User.findOne({
      where: { id: userId },
      attributes: ['cartItems'],
      raw: true
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const cartItems = user.cartItems || {};
    cache.set(cacheKey, { data: cartItems, expires: Date.now() + CACHE_TTL });

    return res.json({ success: true, cartItems });
  } catch (error) {
    console.error("Get cart error:", error);
    return res.status(500).json({ success: false, message: "Failed to get cart" });
  }
};