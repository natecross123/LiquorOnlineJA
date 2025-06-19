import Address from "../models/Address.js";

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

export const addAddress = async (req, res) => {
  try {
    const { address } = req.body;
    const userId = req.userId;

    if (!address || !userId) {
      return res.status(400).json({ success: false, message: "Address and auth required" });
    }

    // Basic validation
    const required = ['firstName', 'lastName', 'street', 'city', 'parish', 'country', 'phone'];
    for (const field of required) {
      if (!address[field]?.trim()) {
        return res.status(400).json({ success: false, message: `${field} required` });
      }
    }

    await Address.create({ ...address, userId });
    cache.delete(`addresses:${userId}`);

    return res.status(201).json({ success: true, message: "Address added" });
  } catch (error) {
    console.error("Add address error:", error);
    return res.status(500).json({ success: false, message: "Failed to add address" });
  }
};

export const getAddress = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Auth required" });
    }

    const cacheKey = `addresses:${userId}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() < cached.expires) {
      return res.json(cached.data);
    }

    const addresses = await Address.findAll({ 
      where: { userId },
      order: [['createdAt', 'DESC']],
      raw: true
    });

    const responseData = {
      success: true,
      addresses: addresses.map(addr => ({ ...addr, _id: addr.id }))
    };

    cache.set(cacheKey, { data: responseData, expires: Date.now() + CACHE_TTL });
    return res.json(responseData);
  } catch (error) {
    console.error("Get address error:", error);
    return res.status(500).json({ success: false, message: "Failed to get addresses" });
  }
};