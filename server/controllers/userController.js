import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from "../models/User.js";

// Simple cache for user data
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const getCache = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key, data, ttl = CACHE_TTL) => {
  if (cache.size > 1000) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { data, expires: Date.now() + ttl });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing details' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    const existingUser = await User.findOne({ 
      where: { email: normalizedEmail },
      attributes: ['id']
    });
    
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    // Reduced from 12 to 10 rounds for better performance
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: hashedPassword });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    const userData = { id: user.id, email: user.email, name: user.name };
    setCache(user.id.toString(), userData);

    return res.status(201).json({ success: true, user: { email: user.email, name: user.name } });
  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ 
      where: { email: email.toLowerCase().trim() },
      attributes: ['id', 'email', 'name', 'password']
    });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    const userData = { id: user.id, email: user.email, name: user.name };
    setCache(user.id.toString(), userData);

    return res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const isAuth = async (req, res) => {
  try {
    const userId = req.userId.toString();
    
    // Check cache first to avoid DB call
    const cached = getCache(userId);
    if (cached) {
      return res.json({ success: true, user: cached });
    }

    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'email', 'name']
    });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const userData = { id: user.id, email: user.email, name: user.name };
    setCache(userId, userData);

    return res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Auth check error:', error.message);
    return res.status(500).json({ success: false, message: 'Auth check failed' });
  }
};

export const logout = async (req, res) => {
  try {
    if (req.userId) {
      cache.delete(req.userId.toString());
    }
    
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });
    
    return res.json({ success: true, message: "Logged out" });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
};