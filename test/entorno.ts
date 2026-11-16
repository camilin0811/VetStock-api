// Variables de entorno para jest (unit y e2e); no dependen del .env local
process.env.JWT_SECRET = 'secreto-de-acceso-de-prueba';
process.env.JWT_REFRESH_SECRET = 'secreto-de-refresh-de-prueba';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
