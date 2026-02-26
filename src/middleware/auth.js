import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../config/index.js';

export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};

export const hashToken = async (token) => {
  return await bcrypt.hash(token, 10);
};

export const compareToken = async (token, hash) => {
  return await bcrypt.compare(token, hash);
};

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: '无效或过期的令牌' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '认证失败' });
  }
};

export const requireReauth = async (req, res, next) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: '请提供密码进行确认' });
    }

    const isValid = password === config.admin.password;
    if (!isValid) {
      return res.status(401).json({ error: '密码错误' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: '认证失败' });
  }
};

export const checkIpWhitelist = (req, res, next) => {
  if (config.admin.ips.length === 0) {
    return next();
  }

  const clientIp = req.ip || req.connection.remoteAddress;
  
  if (!config.admin.ips.includes(clientIp)) {
    return res.status(403).json({ error: 'IP 地址不在白名单中' });
  }

  next();
};
