import { jest } from '@jest/globals';
import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { ExcepcionesFiltro } from './excepciones.filtro';

function ejecutar(excepcion: unknown) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ originalUrl: '/categorias/1?x=2' }),
    }),
  } as unknown as ArgumentsHost;
  new ExcepcionesFiltro().catch(excepcion, host);
  return { codigo: status.mock.calls[0][0], cuerpo: json.mock.calls[0][0] };
}

const errorBd = (codigo: string, detail?: string) =>
  new QueryFailedError(
    'INSERT INTO categoria (nombre) VALUES ($1)',
    ['secreto'],
    Object.assign(new Error('duplicate key value violates "uq_categoria"'), {
      code: codigo,
      detail,
    }),
  );

describe('ExcepcionesFiltro', () => {
  it('mantiene el mensaje de las excepciones de Nest con el cuerpo uniforme', () => {
    const { codigo, cuerpo } = ejecutar(new NotFoundException('No existe'));
    expect(codigo).toBe(404);
    expect(cuerpo).toMatchObject({
      statusCode: 404,
      message: 'No existe',
      error: 'Not Found',
      path: '/categorias/1',
    });
    expect(new Date(cuerpo.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('conserva la lista de mensajes de validacion', () => {
    const { codigo, cuerpo } = ejecutar(
      new BadRequestException(['nombre no debe estar vacio']),
    );
    expect(codigo).toBe(400);
    expect(cuerpo.message).toEqual(['nombre no debe estar vacio']);
  });

  it.each(['23505', 'SQLITE_CONSTRAINT_UNIQUE'])(
    'traduce la violacion de unicidad %s a 409 sin filtrar SQL',
    (codigo) => {
      const resultado = ejecutar(
        errorBd(codigo, 'Key (nombre)=(x) already exists.'),
      );
      expect(resultado.codigo).toBe(409);
      expect(resultado.cuerpo.message).toBe(
        'Ya existe un registro con esos datos unicos',
      );
      expect(JSON.stringify(resultado.cuerpo)).not.toMatch(
        /INSERT|secreto|uq_/,
      );
    },
  );

  it('traduce la llave foranea al borrar un registro en uso a 409', () => {
    const { codigo, cuerpo } = ejecutar(
      errorBd('23503', 'Key (id)=(1) is still referenced from table "lote".'),
    );
    expect(codigo).toBe(409);
    expect(cuerpo.message).toContain('registros relacionados');
  });

  it('traduce la llave foranea hacia un registro inexistente a 409', () => {
    const { codigo, cuerpo } = ejecutar(
      errorBd(
        '23503',
        'Key (proveedor_id)=(9) is not present in table "proveedor".',
      ),
    );
    expect(codigo).toBe(409);
    expect(cuerpo.message).toBe('El registro relacionado no existe');
  });

  it('traduce SQLITE_CONSTRAINT_FOREIGNKEY a 409', () => {
    expect(ejecutar(errorBd('SQLITE_CONSTRAINT_FOREIGNKEY')).codigo).toBe(409);
  });

  it('traduce not null a 400', () => {
    expect(ejecutar(errorBd('23502')).codigo).toBe(400);
  });

  it.each(['22003', '22P02'])('traduce el valor invalido %s a 400', (c) => {
    expect(ejecutar(errorBd(c)).codigo).toBe(400);
  });

  it('traduce EntityNotFoundError a 404', () => {
    const { codigo, cuerpo } = ejecutar(new EntityNotFoundError('Lote', {}));
    expect(codigo).toBe(404);
    expect(cuerpo.message).toBe('Registro no encontrado');
  });

  it('responde 500 generico ante un error de BD desconocido', () => {
    const { codigo, cuerpo } = ejecutar(errorBd('XX000'));
    expect(codigo).toBe(500);
    expect(cuerpo.message).toBe('Error interno del servidor');
    expect(JSON.stringify(cuerpo)).not.toMatch(/INSERT/);
  });

  it('responde 500 generico ante errores no controlados', () => {
    const { codigo, cuerpo } = ejecutar(
      new Error('fallo con detalles internos'),
    );
    expect(codigo).toBe(500);
    expect(cuerpo.message).toBe('Error interno del servidor');
  });

  it('respeta los 4xx de Express (JSON mal formado)', () => {
    const { codigo, cuerpo } = ejecutar(
      Object.assign(new SyntaxError('Unexpected token }'), { status: 400 }),
    );
    expect(codigo).toBe(400);
    expect(cuerpo.message).toBe('La peticion no es valida');
  });

  it('ConflictException conserva su 409', () => {
    expect(ejecutar(new ConflictException('x')).codigo).toBe(409);
  });
});
