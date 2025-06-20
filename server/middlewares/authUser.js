// middlewares/authUser.js - Essential optimization
import jwt from 'jsonwebtoken';

// Simple token verification cache to avoid repeated JWT verification
const tokenCache = new Map();
const TOKEN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const authUser = async (req, res, next) => {
  const { token } = req.cookies;
  
  if (!token) {
    return res.json({ success: false, message: 'Not Authorized' });
  }

  try {
    // Check cache first to avoid JWT verification overhead
    const cached = tokenCache.get(token);
    if (cached && Date.now() < cached.expires) {
      req.userId = cached.userId;
      return next();
    }

    // Verify token if not in cache
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    if (!tokenDecode.id) {
      return res.json({ success: false, message: 'Not Authorized' });
    }

    // Cache the verified token (simple size limit)
    if (tokenCache.size > 1000) {
      const firstKey = tokenCache.keys().next().value;
      tokenCache.delete(firstKey);
    }
    
    tokenCache.set(token, {
      userId: tokenDecode.id,
      expires: Date.now() + TOKEN_CACHE_TTL
    });

    req.userId = tokenDecode.id;
    next();
  } catch (error) {
    res.json({ success: false, message: error.message });   
  }
};

export default authUser;