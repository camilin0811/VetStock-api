import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

export interface CuerpoError {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

interface ErrorTraducido {
  statusCode: number;
  message: string | string[];
  error?: string;
}

const NOMBRES_ESTADO: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Payload Too Large',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
};

// Codigos de violacion de restricciones: Postgres (SQLSTATE) y sqlite (tests)
const UNICO = [
  '23505',
  'SQLITE_CONSTRAINT_UNIQUE',
  'SQLITE_CONSTRAINT_PRIMARYKEY',
];
const LLAVE_FORANEA = ['23503', 'SQLITE_CONSTRAINT_FOREIGNKEY'];
const NO_NULO = ['23502', 'SQLITE_CONSTRAINT_NOTNULL'];

// Respuesta de error uniforme para toda la API. Traduce los errores de TypeORM
// a codigos HTTP y nunca devuelve SQL, nombres de tablas ni valores de la BD.
@Catch()
export class ExcepcionesFiltro implements ExceptionFilter {
  private readonly logger = new Logger(ExcepcionesFiltro.name);

  catch(excepcion: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const respuesta = http.getResponse<Response>();
    const peticion = http.getRequest<Request>();

    const { statusCode, message, error } = this.traducir(excepcion);
    if (statusCode >= 500) {
      this.logger.error(
        excepcion instanceof Error ? excepcion.message : String(excepcion),
        excepcion instanceof Error ? excepcion.stack : undefined,
      );
    }

    const cuerpo: CuerpoError = {
      statusCode,
      message,
      error: error ?? NOMBRES_ESTADO[statusCode] ?? 'Error',
      path: (peticion.originalUrl ?? peticion.url ?? '').split('?')[0],
      timestamp: new Date().toISOString(),
    };
    respuesta.status(statusCode).json(cuerpo);
  }

  private traducir(excepcion: unknown): ErrorTraducido {
    if (excepcion instanceof HttpException) {
      const estado = excepcion.getStatus();
      const contenido = excepcion.getResponse();
      if (typeof contenido === 'string') {
        return { statusCode: estado, message: contenido };
      }
      const { message, error } = contenido as {
        message?: string | string[];
        error?: string;
      };
      return {
        statusCode: estado,
        message: message ?? excepcion.message,
        error,
      };
    }

    if (excepcion instanceof EntityNotFoundError) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Registro no encontrado',
      };
    }

    if (excepcion instanceof QueryFailedError) {
      return this.traducirConsulta(excepcion);
    }

    // Errores de Express (JSON mal formado, cuerpo muy grande, ...): 4xx con mensaje seguro
    const estado = (excepcion as { status?: unknown } | null)?.status;
    if (typeof estado === 'number' && estado >= 400 && estado < 500) {
      const mensaje =
        estado === 413
          ? 'El cuerpo de la peticion es demasiado grande'
          : 'La peticion no es valida';
      return { statusCode: estado, message: mensaje };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
    };
  }

  private traducirConsulta(excepcion: QueryFailedError): ErrorTraducido {
    const origen = (
      excepcion as { driverError?: { code?: unknown; detail?: unknown } }
    ).driverError;
    const codigo = String(
      origen?.code ?? (excepcion as { code?: unknown }).code ?? '',
    );

    if (UNICO.includes(codigo)) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Ya existe un registro con esos datos unicos',
      };
    }

    if (LLAVE_FORANEA.includes(codigo)) {
      // Postgres distingue borrar un registro en uso de apuntar a uno inexistente
      const detalle = String(origen?.detail ?? '');
      return {
        statusCode: HttpStatus.CONFLICT,
        message: detalle.includes('is not present')
          ? 'El registro relacionado no existe'
          : 'No se puede completar la operacion: hay registros relacionados',
      };
    }

    if (NO_NULO.includes(codigo)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Falta un dato obligatorio',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
    };
  }
}
