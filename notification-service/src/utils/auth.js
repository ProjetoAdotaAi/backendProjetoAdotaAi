import jwt from 'jsonwebtoken';
import { logger } from './logger.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso requerido',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Invalid token attempt:', { 
        service: 'notification-service',
        timestamp: new Date().toISOString(),
        token: token.substring(0, 20) + '...',
        error: err.message
      });
      return res.status(403).json({
        success: false,
        message: 'Token inválido',
      });
    }

    req.user = user;
    next();
  });
}

// Middleware para verificar se é admin (opcional)
export function requireAdmin(req, res, next) {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado - Admin requerido',
    });
  }
  next();
}
