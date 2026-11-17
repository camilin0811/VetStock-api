import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { DataSource, DeepPartial, EntityManager } from 'typeorm';
import { AppModule } from '../app.module';
import { Usuario } from '../auth/entities/usuario.entity';
import { Categoria } from '../categorias/entities/categoria.entity';
import { diasDesdeHoy, hoy } from '../common/fechas';
import { Dispensacion } from '../dispensaciones/entities/dispensacion.entity';
import type { LoteUsadoDto } from '../dispensaciones/dispensacion.dto';
import { Lote } from '../inventario/entities/lote.entity';
import {
  Movimiento,
  type TipoMovimiento,
} from '../inventario/entities/movimiento.entity';
import { Medicamento } from '../medicamentos/entities/medicamento.entity';
import { Proveedor } from '../proveedores/entities/proveedor.entity';
import {
  AJUSTES,
  CATEGORIAS,
  LOTES,
  MASCOTAS,
  MEDICAMENTOS,
  MOTIVOS_ANULACION,
  PROVEEDORES,
  USUARIOS_DEMO,
  VETERINARIOS,
} from './datos';

export const CLAVE_DEMO = 'VetStock123*';
const DIAS_HISTORIAL = 14;

// Generador pseudoaleatorio con semilla fija: cada corrida del seed produce los
// mismos datos relativos a la fecha de hoy
function crearAzar(semilla: number) {
  let estado = semilla;
  return () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Momento del dia para createdAt; nunca en el futuro
function momento(fecha: string, hora: number, minuto: number) {
  const candidato = Date.parse(
    `${fecha}T${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00.000Z`,
  );
  return new Date(Math.min(candidato, Date.now() - 60_000));
}

interface MovimientoPendiente {
  tipo: TipoMovimiento;
  cantidad: number;
  loteId: number;
  medicamentoId: number;
  usuarioId: number;
  detalle: string;
  creado: Date;
}

export interface ResumenSeed {
  usuarios: number;
  categorias: number;
  medicamentos: number;
  proveedores: number;
  lotes: number;
  dispensaciones: number;
  anuladas: number;
  ajustes: number;
  movimientos: number;
}

async function limpiar(dataSource: DataSource) {
  if (dataSource.options.type === 'postgres') {
    await dataSource.query(
      'TRUNCATE TABLE movimiento, dispensacion, lote, medicamento_categorias, medicamento, categoria, proveedor, usuario RESTART IDENTITY CASCADE',
    );
    return;
  }

  // sqlite (pruebas): sin TRUNCATE, se borra en orden y se reinician los ids
  for (const tabla of [
    'movimiento',
    'dispensacion',
    'lote',
    'medicamento_categorias',
    'medicamento',
    'categoria',
    'proveedor',
    'usuario',
  ]) {
    await dataSource.query(`DELETE FROM ${tabla}`);
  }
  await dataSource.query('DELETE FROM sqlite_sequence');
}

// Borra todos los datos y los vuelve a crear (idempotente)
export async function sembrar(dataSource: DataSource): Promise<ResumenSeed> {
  await limpiar(dataSource);

  return dataSource.transaction(async (manager) => {
    const azar = crearAzar(20260101);
    const elegir = <T>(lista: T[]) => lista[Math.floor(azar() * lista.length)];
    const entre = (min: number, max: number) =>
      min + Math.floor(azar() * (max - min + 1));

    const clave = await bcrypt.hash(CLAVE_DEMO, 10);
    const usuarios = await manager.save(
      Usuario,
      USUARIOS_DEMO.map((usuario) => ({ ...usuario, clave })),
    );
    const [admin, veterinario, farmaceutico] = usuarios;

    const categorias = await manager.save(Categoria, CATEGORIAS);
    const proveedores = await manager.save(Proveedor, PROVEEDORES);
    const medicamentos = await manager.save(
      Medicamento,
      MEDICAMENTOS.map(
        ({ categoria, peso: _peso, cantidad: _cantidad, ...campos }) => ({
          ...campos,
          categorias: [categorias[categoria]],
        }),
      ),
    );

    const lotes = await manager.save(
      Lote,
      LOTES.map(
        ([
          medicamento,
          proveedor,
          numeroLote,
          cantidad,
          ingreso,
          vencimiento,
        ]) => ({
          medicamento: { id: medicamentos[medicamento].id },
          proveedor: { id: proveedores[proveedor].id },
          numeroLote,
          cantidadInicial: cantidad,
          cantidad,
          fechaIngreso: diasDesdeHoy(ingreso),
          fechaVencimiento: diasDesdeHoy(vencimiento),
        }),
      ),
    );

    const movimientos: MovimientoPendiente[] = lotes.map((lote, i) => ({
      tipo: 'ENTRADA',
      cantidad: lote.cantidadInicial,
      loteId: lote.id,
      medicamentoId: lote.medicamentoId,
      usuarioId: farmaceutico.id,
      detalle: `Ingreso del lote ${lote.numeroLote} de ${proveedores[LOTES[i][1]].nombre}`,
      creado: momento(lote.fechaIngreso, 8, i % 60),
    }));

    // Se simula el historial dia por dia: FEFO sobre los lotes vigentes ese dia
    const pesos = MEDICAMENTOS.flatMap((m, i) => Array<number>(m.peso).fill(i));
    interface DispensacionPendiente {
      dispensacion: DeepPartial<Dispensacion>;
      usos: LoteUsadoDto[];
      medicamentoId: number;
      creado: Date;
    }
    const pendientes: DispensacionPendiente[] = [];
    let formula = 1000;

    for (let atras = DIAS_HISTORIAL - 1; atras >= 0; atras--) {
      const fecha = diasDesdeHoy(-atras);

      for (const [codigo, motivo, cantidad, dias, observacion] of AJUSTES) {
        const lote = lotes.find((l) => l.numeroLote === codigo)!;
        if (dias !== atras || lote.cantidad < cantidad) {
          continue;
        }
        lote.cantidad -= cantidad;
        movimientos.push({
          tipo: 'AJUSTE',
          cantidad,
          loteId: lote.id,
          medicamentoId: lote.medicamentoId,
          usuarioId: farmaceutico.id,
          detalle: observacion ? `${motivo}: ${observacion}` : motivo,
          creado: momento(fecha, 15, 30),
        });
      }

      // Mas movimiento entre semana; hoy siempre hay varias para el dashboard
      const total = atras === 0 ? 5 : entre(3, 4);
      for (let n = 0; n < total; n++) {
        const indice = elegir(pesos);
        const medicamento = medicamentos[indice];
        const datos = MEDICAMENTOS[indice];
        const cantidad = entre(datos.cantidad[0], datos.cantidad[1]);

        const vigentes = lotes
          .filter(
            (l) =>
              l.medicamentoId === medicamento.id &&
              l.cantidad > 0 &&
              l.fechaIngreso <= fecha &&
              l.fechaVencimiento > fecha,
          )
          .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento));
        if (vigentes.reduce((suma, l) => suma + l.cantidad, 0) < cantidad) {
          continue;
        }

        const usos: LoteUsadoDto[] = [];
        let pendiente = cantidad;
        for (const lote of vigentes) {
          if (pendiente === 0) {
            break;
          }
          const usado = Math.min(lote.cantidad, pendiente);
          lote.cantidad -= usado;
          pendiente -= usado;
          usos.push({
            loteId: lote.id,
            numeroLote: lote.numeroLote,
            cantidad: usado,
            fechaVencimiento: lote.fechaVencimiento,
          });
        }

        const usuario = elegir([veterinario, veterinario, farmaceutico, admin]);
        pendientes.push({
          medicamentoId: medicamento.id,
          usos,
          creado: momento(fecha, entre(8, 17), entre(0, 59)),
          dispensacion: {
            medicamento: { id: medicamento.id },
            usuario: { id: usuario.id },
            cantidad,
            mascota: elegir(MASCOTAS),
            veterinario: elegir(VETERINARIOS),
            formula: medicamento.requiereFormula ? `F-${formula++}` : null,
            fecha,
            total: medicamento.precio * cantidad,
            estado: 'ACTIVA',
            lotesUsados: usos,
          },
        });
      }
    }

    // Una dispensacion anulada por cada motivo: devuelve el stock a sus lotes
    const anulables = pendientes
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.dispensacion.fecha !== hoy());
    const anuladas = [
      anulables[Math.floor(anulables.length / 3)],
      anulables[Math.floor((anulables.length * 5) / 6)],
    ];
    anuladas.forEach(({ p }, i) => {
      p.dispensacion.estado = 'ANULADA';
      p.dispensacion.motivoAnulacion = MOTIVOS_ANULACION[i];
      for (const uso of p.usos) {
        lotes.find((l) => l.id === uso.loteId)!.cantidad += uso.cantidad;
      }
    });

    const dispensaciones = await manager.save(
      Dispensacion,
      pendientes.map(({ dispensacion, creado }) => ({
        ...dispensacion,
        createdAt: creado,
      })),
    );

    dispensaciones.forEach((dispensacion, i) => {
      const { usos, creado } = pendientes[i];
      for (const uso of usos) {
        movimientos.push({
          tipo: 'SALIDA',
          cantidad: uso.cantidad,
          loteId: uso.loteId,
          medicamentoId: dispensacion.medicamento.id,
          usuarioId: dispensacion.usuario!.id,
          detalle: `Dispensacion ${dispensacion.id} - ${dispensacion.mascota}`,
          creado,
        });
        if (dispensacion.estado === 'ANULADA') {
          movimientos.push({
            tipo: 'ANULACION',
            cantidad: uso.cantidad,
            loteId: uso.loteId,
            medicamentoId: dispensacion.medicamento.id,
            usuarioId: farmaceutico.id,
            detalle: `Anulacion de la dispensacion ${dispensacion.id}: ${dispensacion.motivoAnulacion}`,
            creado: new Date(
              Math.min(creado.getTime() + 3_600_000, Date.now() - 60_000),
            ),
          });
        }
      }
    });

    await manager.save(Lote, lotes);
    await guardarMovimientos(manager, movimientos);

    return {
      usuarios: usuarios.length,
      categorias: categorias.length,
      medicamentos: medicamentos.length,
      proveedores: proveedores.length,
      lotes: lotes.length,
      dispensaciones: dispensaciones.length,
      anuladas: anuladas.length,
      ajustes: movimientos.filter((m) => m.tipo === 'AJUSTE').length,
      movimientos: movimientos.length,
    };
  });
}

// El kardex se inserta en orden cronologico para que los ids sigan el tiempo
async function guardarMovimientos(
  manager: EntityManager,
  movimientos: MovimientoPendiente[],
) {
  const ordenados = [...movimientos].sort(
    (a, b) => a.creado.getTime() - b.creado.getTime(),
  );
  await manager.save(
    Movimiento,
    ordenados.map((m) => ({
      tipo: m.tipo,
      cantidad: m.cantidad,
      lote: { id: m.loteId },
      medicamento: { id: m.medicamentoId },
      usuario: { id: m.usuarioId },
      detalle: m.detalle,
      createdAt: m.creado,
    })),
    { chunk: 100 },
  );
}

async function main() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.SEED_FORCE !== 'true'
  ) {
    throw new Error(
      'El seed borra todos los datos. Con NODE_ENV=production se exige SEED_FORCE=true',
    );
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const dataSource = app.get(DataSource);
    const { host, port, database } = dataSource.options as unknown as Record<
      string,
      string
    >;
    console.log(
      `Sembrando ${database} en ${host}:${port} (se borran los datos actuales)...`,
    );

    const resumen = await sembrar(dataSource);
    console.log('Seed listo:', resumen);
    console.log(`Usuarios demo (clave ${CLAVE_DEMO}):`);
    for (const usuario of USUARIOS_DEMO) {
      console.log(`  ${usuario.correo} (${usuario.rol})`);
    }
  } finally {
    await app.close();
  }
}

// Solo se ejecuta al llamarlo con node (no al importarlo desde las pruebas)
if (typeof require !== 'undefined' && require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
