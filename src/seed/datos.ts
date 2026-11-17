import { Rol } from '../auth/rol.enum';

// Datos de ejemplo del seed (clinica veterinaria en Narino)
export const USUARIOS_DEMO = [
  {
    nombre: 'Administrador VetStock',
    correo: 'admin@vetstock.com',
    rol: Rol.Admin,
  },
  {
    nombre: 'Dra. Paola Rosero',
    correo: 'vet@vetstock.com',
    rol: Rol.Veterinario,
  },
  {
    nombre: 'Camila Benavides',
    correo: 'farmacia@vetstock.com',
    rol: Rol.Farmaceutico,
  },
];

export const CATEGORIAS = [
  {
    nombre: 'Antibioticos',
    descripcion: 'Tratamiento de infecciones bacterianas',
  },
  {
    nombre: 'Antiparasitarios',
    descripcion: 'Control de parasitos internos y externos',
  },
  { nombre: 'Vacunas', descripcion: 'Prevencion y esquemas de vacunacion' },
  { nombre: 'Analgesicos', descripcion: 'Control del dolor y la inflamacion' },
  { nombre: 'Insumos', descripcion: 'Material de consumo de la clinica' },
];

export const PROVEEDORES = [
  {
    nombre: 'Distribuidora Agrovet Narino',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Pasto',
    correo: 'ventas@agrovetnarino.com',
  },
  {
    nombre: 'Laboratorios Pet Salud',
    nit: '800987654-2',
    telefono: '3109876543',
    ciudad: 'Cali',
    correo: 'pedidos@petsalud.com',
  },
  {
    nombre: 'Vet Insumos del Sur',
    nit: '901555444-3',
    telefono: '3205554444',
    ciudad: 'Ipiales',
    correo: null,
  },
  {
    nombre: 'Drogueria Veterinaria Andina',
    nit: '830246810-4',
    telefono: '3124680246',
    ciudad: 'Bogota',
    correo: 'andina@drogueriavet.co',
  },
];

export interface MedicamentoSeed {
  nombre: string;
  imagen: string; // ruta base de la foto referencial, sin tamano ni extension
  presentacion: string;
  especie: string;
  precio: number;
  stockMinimo: number;
  requiereFormula: boolean;
  categoria: number; // indice en CATEGORIAS
  peso: number; // popularidad al dispensar (0 = no se dispensa)
  cantidad: [number, number]; // unidades por dispensacion
}

export const MEDICAMENTOS: MedicamentoSeed[] = [
  {
    nombre: 'Amoxicilina 250 mg',
    imagen: '/img/medicamentos/tabletas',
    presentacion: 'Tabletas x 10',
    especie: 'canino',
    precio: 18000,
    stockMinimo: 20,
    requiereFormula: true,
    categoria: 0,
    peso: 4,
    cantidad: [2, 8],
  },
  {
    nombre: 'Amoxicilina + Acido Clavulanico 500 mg',
    imagen: '/img/medicamentos/tabletas',
    presentacion: 'Tabletas x 10',
    especie: 'canino',
    precio: 42000,
    stockMinimo: 22,
    requiereFormula: true,
    categoria: 0,
    peso: 4,
    cantidad: [2, 4],
  },
  {
    nombre: 'Enrofloxacina 10%',
    imagen: '/img/medicamentos/inyectables',
    presentacion: 'Frasco inyectable 50 ml',
    especie: 'general',
    precio: 36000,
    stockMinimo: 8,
    requiereFormula: true,
    categoria: 0,
    peso: 2,
    cantidad: [1, 2],
  },
  {
    nombre: 'Oxitetraciclina LA',
    imagen: '/img/medicamentos/inyectables',
    presentacion: 'Frasco 100 ml',
    especie: 'bovino',
    precio: 58000,
    stockMinimo: 6,
    requiereFormula: true,
    categoria: 0,
    peso: 1,
    cantidad: [1, 2],
  },
  {
    nombre: 'Ivermectina 1%',
    imagen: '/img/medicamentos/inyectables',
    presentacion: 'Frasco 50 ml',
    especie: 'bovino',
    precio: 38000,
    stockMinimo: 8,
    requiereFormula: false,
    categoria: 1,
    peso: 2,
    cantidad: [1, 3],
  },
  {
    nombre: 'Desparasitante Albendazol',
    imagen: '/img/medicamentos/suspension',
    presentacion: 'Suspension 100 ml',
    especie: 'bovino',
    precio: 45000,
    stockMinimo: 8,
    requiereFormula: false,
    categoria: 1,
    peso: 2,
    cantidad: [1, 3],
  },
  {
    nombre: 'Praziquantel + Pirantel',
    imagen: '/img/medicamentos/tabletas-plato',
    presentacion: 'Tabletas x 4',
    especie: 'canino',
    precio: 22000,
    stockMinimo: 12,
    requiereFormula: false,
    categoria: 1,
    peso: 4,
    cantidad: [1, 4],
  },
  {
    nombre: 'Pipeta antipulgas',
    imagen: '/img/medicamentos/pipeta',
    presentacion: 'Pipeta 1 ml',
    especie: 'felino',
    precio: 29000,
    stockMinimo: 10,
    requiereFormula: false,
    categoria: 1,
    peso: 5,
    cantidad: [1, 3],
  },
  {
    nombre: 'Vacuna antirrabica',
    imagen: '/img/medicamentos/vacunas',
    presentacion: 'Frasco 1 ml',
    especie: 'general',
    precio: 25000,
    stockMinimo: 10,
    requiereFormula: false,
    categoria: 2,
    peso: 5,
    cantidad: [1, 4],
  },
  {
    nombre: 'Vacuna triple felina',
    imagen: '/img/medicamentos/vacunas',
    presentacion: 'Dosis 1 ml',
    especie: 'felino',
    precio: 48000,
    stockMinimo: 8,
    requiereFormula: false,
    categoria: 2,
    peso: 3,
    cantidad: [1, 2],
  },
  {
    nombre: 'Vacuna quintuple canina',
    imagen: '/img/medicamentos/vacunas',
    presentacion: 'Dosis 1 ml',
    especie: 'canino',
    precio: 52000,
    stockMinimo: 10,
    requiereFormula: false,
    categoria: 2,
    peso: 4,
    cantidad: [1, 3],
  },
  {
    nombre: 'Meloxicam 1.5 mg/ml',
    imagen: '/img/medicamentos/suspension',
    presentacion: 'Suspension oral 10 ml',
    especie: 'felino',
    precio: 32000,
    stockMinimo: 14,
    requiereFormula: true,
    categoria: 3,
    peso: 3,
    cantidad: [1, 2],
  },
  {
    nombre: 'Tramadol 50 mg',
    imagen: '/img/medicamentos/tabletas-plato',
    presentacion: 'Tabletas x 10',
    especie: 'canino',
    precio: 27000,
    stockMinimo: 35,
    requiereFormula: true,
    categoria: 3,
    peso: 2,
    cantidad: [1, 3],
  },
  {
    nombre: 'Jeringas 5 ml',
    imagen: '/img/medicamentos/jeringas',
    presentacion: 'Caja x 100',
    especie: 'general',
    precio: 35000,
    stockMinimo: 4,
    requiereFormula: false,
    categoria: 4,
    peso: 2,
    cantidad: [1, 2],
  },
  {
    nombre: 'Guantes de nitrilo',
    imagen: '/img/medicamentos/guantes',
    presentacion: 'Caja x 100',
    especie: 'general',
    precio: 28000,
    stockMinimo: 6,
    requiereFormula: false,
    categoria: 4,
    peso: 2,
    cantidad: [1, 2],
  },
  {
    nombre: 'Fenilbutazona 20%',
    imagen: '/img/medicamentos/inyectables',
    presentacion: 'Frasco 50 ml',
    especie: 'equino',
    precio: 41000,
    stockMinimo: 5,
    requiereFormula: true,
    categoria: 3,
    peso: 0,
    cantidad: [1, 1],
  },
];

// [medicamento, proveedor, numeroLote, cantidadInicial, dias de ingreso, dias al vencimiento]
// Los dias de vencimiento negativos son lotes ya vencidos. Hay lotes por vencer,
// vencidos con unidades y medicamentos con stock bajo o sin stock para que los
// alertas y los reportes tengan datos.
export type LoteSeed = [number, number, string, number, number, number];
export const LOTES: LoteSeed[] = [
  [0, 0, 'AMX-250-A', 60, -90, 210],
  [0, 0, 'AMX-250-B', 40, -20, 390],
  [1, 1, 'AMC-500-A', 24, -60, 25],
  [2, 1, 'ENR-10-A', 20, -70, 14],
  [2, 1, 'ENR-10-B', 15, -15, 365],
  [3, 0, 'OXI-100-A', 12, -80, 18],
  [3, 0, 'OXI-100-B', 10, -12, 300],
  [4, 0, 'IVE-1-A', 25, -100, -12],
  [4, 0, 'IVE-1-B', 30, -30, 280],
  [5, 0, 'ALB-100-A', 30, -45, 330],
  [5, 3, 'ALB-100-B', 20, -5, 500],
  [6, 1, 'PRZ-A', 40, -50, 60],
  [6, 1, 'PRZ-B', 40, -7, 400],
  [7, 3, 'PIP-A', 30, -40, 9],
  [7, 3, 'PIP-B', 30, -6, 450],
  [8, 1, 'RAB-A', 40, -70, 22],
  [8, 1, 'RAB-B', 40, -14, 250],
  [9, 1, 'TRF-A', 15, -120, -5],
  [9, 1, 'TRF-B', 14, -10, 180],
  [10, 1, 'QUI-A', 30, -30, 200],
  [10, 1, 'QUI-B', 20, -3, 330],
  [11, 2, 'MLX-A', 8, -60, 90],
  [11, 2, 'MLX-B', 4, -2, 400],
  [12, 2, 'TRM-A', 20, -50, 240],
  [12, 2, 'TRM-B', 10, -4, 45],
  [13, 2, 'JER-A', 12, -60, 700],
  [13, 2, 'JER-B', 10, -8, 730],
  [14, 2, 'GUA-A', 15, -30, 900],
  [14, 3, 'GUA-B', 10, -4, 900],
  [15, 0, 'FEN-A', 6, -200, -30],
];

// [numeroLote, motivo, cantidad, dias atras, observacion]
export const AJUSTES: [string, string, number, number, string | null][] = [
  ['PIP-A', 'DANO', 2, 9, 'Pipetas con el empaque roto'],
  ['RAB-A', 'PERDIDA', 2, 8, 'Se rompio la cadena de frio'],
  ['TRF-A', 'VENCIDO', 2, 3, null],
  ['JER-A', 'OTRO', 1, 5, 'Caja abierta en el consultorio'],
];

export const MASCOTAS = [
  'Max',
  'Luna',
  'Toby',
  'Michi',
  'Rocky',
  'Nala',
  'Simba',
  'Bruno',
  'Coco',
  'Mia',
  'Thor',
  'Lola',
  'Rex',
  'Pelusa',
  'Kira',
  'Canela',
  'Zeus',
  'Mora',
  'Pancho',
  'Lupe',
];
export const VETERINARIOS = [
  'Dra. Paola Rosero',
  'Dr. Carlos Erazo',
  'Dra. Laura Benavides',
  'Dr. Andres Mora',
];
export const MOTIVOS_ANULACION = [
  'Error de digitacion en la cantidad',
  'Se registro la mascota equivocada',
];
