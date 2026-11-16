import { SetMetadata } from '@nestjs/common';

export const PUBLICO_KEY = 'publico';

// Marca una ruta (o controller) como accesible sin token
export const Publico = () => SetMetadata(PUBLICO_KEY, true);
