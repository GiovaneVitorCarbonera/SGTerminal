const PERMISSIONS = {
  CREATE_USER: 'CREATE_USER',
  GET_USERS: 'GET_USERS',
  GET_USER: 'GET_USER',
  DELETE_USER: 'DELETE_USER',
  EDIT_USER: 'EDIT_USER',
  CREATE_VEHICLE_MOVEMENT: 'CREATE_VEHICLE_MOVEMENT',
  GET_ALL_VEHICLE_MOVEMENT: 'GET_ALL_VEHICLE_MOVEMENT',
  GET_VEHICLE_MOVEMENT: 'GET_VEHICLE_MOVEMENT',
  DELETE_VEHICLE_MOVEMENT: 'DELETE_VEHICLE_MOVEMENT',
  EDIT_VEHICLE_MOVEMENT: 'EDIT_VEHICLE_MOVEMENT'
};

const requirePermission = (allowedPermissions = []) => {
  return (req, res, next) => {
    const permissions = req.auth?.permissions;

    if (!req.auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!Array.isArray(permissions)) {
      return res.status(403).json({ error: 'Permissões inválidas' });
    }

    const hasPermission = allowedPermissions.some(p =>
      permissions.includes(p)
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    next();
  };
};

module.exports = { requirePermission, PERMISSIONS };