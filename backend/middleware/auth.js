export const requireAuth = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "You must be logged in" });
  }

  return next();
};

export const requireRole = (allowedRoles) => (req, res, next) => {
  const role = req.session?.user?.role;
  if (!role || !allowedRoles.includes(role)) {
    return res.status(403).json({ message: "You do not have access to this action" });
  }

  return next();
};
