import Address from "../models/Address.js";

// Add Address : POST /api/address/add
export const addAddress = async (req, res) => {
  try {
    const { address } = req.body;
    const userId = req.userId;
    if (!address || !userId) {
      return res.json({ success: false, message: "Missing address or userId" });
    }
    await Address.create({ ...address, userId });
    return res.json({ success: true, message: "Address added successfully" });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};


// Get Address : GET /api/address/get
export const getAddress = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.json({ success: false, message: "Not authorized" });
    }
    const addresses = await Address.find({ userId });
    return res.json({ success: true, addresses });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};
