import jwt from 'jsonwebtoken';

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

// Login Seller : POST /api/seller/login
export const sellerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    if (password === process.env.SELLER_PASSWORD && email === process.env.SELLER_EMAIL) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '7d' });
      
      res.cookie('sellerToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      cache.set(token, { email, expires: Date.now() + CACHE_TTL });

      return res.json({ success: true, message: "Logged in" });
    } else {
      return res.status(401).json({ success: false, message: "Invalid Credentials" });
    }
  } catch (error) {
    console.error('Seller login error:', error.message);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// Seller Auth: GET /api/seller/is-auth
export const isSellerAuth = async (req, res) => {
  try {
    const token = req.cookies.sellerToken;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const cached = cache.get(token);
    if (cached && Date.now() < cached.expires) {
      return res.json({ success: true });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET);
      cache.set(token, { expires: Date.now() + CACHE_TTL });
      return res.json({ success: true });
    } catch (tokenError) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Seller auth error:', error.message);
    return res.status(500).json({ success: false, message: 'Auth check failed' });
  }
};


// Logout Seller: GET /api/seller/logout
export const sellerLogout = async (req, res) => {
  try {
    const token = req.cookies.sellerToken;
    if (token) cache.delete(token);

    res.clearCookie('sellerToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });

    return res.json({ success: true, message: "Logged Out" });
  } catch (error) {
    console.error('Seller logout error:', error.message);
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
};
