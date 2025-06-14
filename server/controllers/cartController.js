import User from "../models/User.js";

/**
 * Update User Cart Data
 * Route: POST /api/cart/update
 * Access: Private (requires authentication)
 */
export const updateCart = async (req, res) => {
    try {
        const { userId, cartItems } = req.body;

        // Validate required fields
        if (!userId) {
            return res.json({ 
                success: false, 
                message: "User ID is required" 
            });
        }

        // Update user's cart items
        const [updatedRowsCount] = await User.update(
            { cartItems },
            { 
                where: { id: userId },
                returning: true // This will return the updated record (PostgreSQL)
            }
        );

        // Check if user was found and updated
        if (updatedRowsCount === 0) {
            return res.json({ 
                success: false, 
                message: "User not found" 
            });
        }

        res.json({ 
            success: true, 
            message: "Cart updated successfully" 
        });

    } catch (error) {
        console.error("Cart update error:", error.message);
        res.json({ 
            success: false, 
            message: "Failed to update cart. Please try again." 
        });
    }
};