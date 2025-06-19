import User from "../models/User.js";

/**
 * Update User Cart Data
 * Route: POST /api/cart/update
 * Access: Private (requires authentication)
 */
export const updateCart = async (req, res) => {
    try {
        const { cartItems } = req.body;
        const userId = req.userId; // Get from middleware

        console.log('Update cart request:', { userId, cartItems });

        // Validate required fields
        if (!userId) {
            return res.json({ 
                success: false, 
                message: "User ID is required" 
            });
        }

        // Validate cartItems format
        if (cartItems !== null && typeof cartItems !== 'object') {
            return res.json({ 
                success: false, 
                message: "Invalid cart data format" 
            });
        }

        // Update user's cart items
        const [updatedRowsCount] = await User.update(
            { cartItems: cartItems || {} },
            { 
                where: { id: userId }
            }
        );

        // Check if user was found and updated
        if (updatedRowsCount === 0) {
            return res.json({ 
                success: false, 
                message: "User not found" 
            });
        }

        console.log('Cart updated successfully for user:', userId);

        res.json({ 
            success: true, 
            message: "Cart updated successfully" 
        });

    } catch (error) {
        console.error("Cart update error:", error);
        res.json({ 
            success: false, 
            message: "Failed to update cart. Please try again." 
        });
    }
};

/**
 * Get User Cart Data
 * Route: GET /api/cart/get
 * Access: Private (requires authentication)
 */
export const getCart = async (req, res) => {
    try {
        const userId = req.userId; // Get from middleware

        console.log('Get cart request for user:', userId);

        // Validate required fields
        if (!userId) {
            return res.json({ 
                success: false, 
                message: "User ID is required" 
            });
        }

        // Find user and get cart items
        const user = await User.findOne({
            where: { id: userId },
            attributes: ['id', 'cartItems']
        });

        // Check if user was found
        if (!user) {
            return res.json({ 
                success: false, 
                message: "User not found" 
            });
        }

        console.log('Cart retrieved for user:', userId, 'Cart items:', user.cartItems);

        res.json({ 
            success: true, 
            cartItems: user.cartItems || {}
        });

    } catch (error) {
        console.error("Get cart error:", error);
        res.json({ 
            success: false, 
            message: "Failed to get cart data. Please try again." 
        });
    }
};
