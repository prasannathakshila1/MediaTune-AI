const jwt = require('jsonwebtoken');

/**
 * auth middleware
 * ───────────────
 * Verifies Bearer JWT on every protected route.
 * Attaches decoded payload to req.user = { id, iat, exp }
 */
module.exports = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token — authorization denied' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;   // { id: userId, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
};