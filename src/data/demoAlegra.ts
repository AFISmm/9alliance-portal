import type {
  AlegraJournal, AlegraInvoice, AlegraAccount, AlegraExpense,
  AlegraContact, AlegraItem, AlegraCostCenter,
} from '../lib/alegraApi';
import type { Contract } from './contracts';

// ── Demo Journals ───────────────────────────────────────────────────────
export const DEMO_JOURNALS: AlegraJournal[] = [
  { id: 1001, date: '2026-06-30', description: 'Causación nómina junio 2026',              numberTemplate: { fullNumber: 'CC-1001' }, total: 12_450_000 },
  { id: 1002, date: '2026-06-30', description: 'Pago arriendo oficina principal',           numberTemplate: { fullNumber: 'CC-1002' }, total: 3_800_000 },
  { id: 1003, date: '2026-06-28', description: 'Causación servicios públicos',              numberTemplate: { fullNumber: 'CC-1003' }, total: 420_000 },
  { id: 1004, date: '2026-06-25', description: 'Amortización software corporativo',         numberTemplate: { fullNumber: 'CC-1004' }, total: 750_000 },
  { id: 1005, date: '2026-06-20', description: 'Ingreso por consultoría estratégica',       numberTemplate: { fullNumber: 'CC-1005' }, total: 28_000_000 },
  { id: 1006, date: '2026-06-18', description: 'Depreciación equipo de cómputo',            numberTemplate: { fullNumber: 'CC-1006' }, total: 280_000 },
  { id: 1007, date: '2026-06-15', description: 'Ingreso comisión gestión comercial',        numberTemplate: { fullNumber: 'CC-1007' }, total: 5_200_000 },
  { id: 1008, date: '2026-06-10', description: 'Pago honorarios profesionales',             numberTemplate: { fullNumber: 'CC-1008' }, total: 4_500_000 },
  { id: 1009, date: '2026-06-05', description: 'Abono obligación financiera Bancolombia',   numberTemplate: { fullNumber: 'CC-1009' }, total: 1_250_000 },
  { id: 1010, date: '2026-06-01', description: 'Causación IVA retención mayo 2026',         numberTemplate: { fullNumber: 'CC-1010' }, total: 840_000 },
  { id: 1011, date: '2026-05-31', description: 'Cierre período mayo 2026',                  numberTemplate: { fullNumber: 'CC-1011' }, total: 0 },
  { id: 1012, date: '2026-05-28', description: 'Ingreso dividendos empresa asociada',       numberTemplate: { fullNumber: 'CC-1012' }, total: 9_600_000 },
];

// ── Demo Invoices ───────────────────────────────────────────────────────
export const DEMO_INVOICES: AlegraInvoice[] = [
  { id: 2001, date: '2026-06-25', dueDate: '2026-07-25', numberTemplate: { fullNumber: 'FE-2001' }, status: 'open',    total: 28_000_000, balance: 28_000_000, client: { name: '9ALLIANCE SAS BIC' } },
  { id: 2002, date: '2026-06-18', dueDate: '2026-07-18', numberTemplate: { fullNumber: 'FE-2002' }, status: 'paid',    total: 12_500_000, balance: 0,          client: { name: 'ILC SAS BIC' } },
  { id: 2003, date: '2026-06-10', dueDate: '2026-07-10', numberTemplate: { fullNumber: 'FE-2003' }, status: 'partial', total: 8_400_000,  balance: 3_200_000,  client: { name: 'Construcciones Modernas SAS' } },
  { id: 2004, date: '2026-06-05', dueDate: '2026-06-20', numberTemplate: { fullNumber: 'FE-2004' }, status: 'overdue', total: 5_200_000,  balance: 5_200_000,  client: { name: 'Grupo Empresarial del Norte' } },
  { id: 2005, date: '2026-05-30', dueDate: '2026-06-30', numberTemplate: { fullNumber: 'FE-2005' }, status: 'paid',    total: 15_750_000, balance: 0,          client: { name: 'Inversiones Andinas Ltda' } },
  { id: 2006, date: '2026-05-22', dueDate: '2026-06-22', numberTemplate: { fullNumber: 'FE-2006' }, status: 'paid',    total: 6_300_000,  balance: 0,          client: { name: 'Comercializadora del Pacífico' } },
  { id: 2007, date: '2026-05-15', dueDate: '2026-06-15', numberTemplate: { fullNumber: 'FE-2007' }, status: 'void',    total: 2_100_000,  balance: 0,          client: { name: '9ALLIANCE SAS BIC' } },
  { id: 2008, date: '2026-05-08', dueDate: '2026-06-08', numberTemplate: { fullNumber: 'FE-2008' }, status: 'paid',    total: 18_900_000, balance: 0,          client: { name: 'Distribuidora Central SAS' } },
];

// ── Demo Accounts ───────────────────────────────────────────────────────
export const DEMO_ACCOUNTS: AlegraAccount[] = [
  // Activos
  { id: '1',  name: 'ACTIVO',                        code: '1',      type: 'asset',   balance: 245_800_000 },
  { id: '11', name: 'Caja y Bancos',                 code: '11',     type: 'asset',   balance: 38_500_000,  _depth: 1 },
  { id: '111',name: 'Caja General',                  code: '1105',   type: 'asset',   balance: 2_500_000,   _depth: 2 },
  { id: '112',name: 'Bancolombia Cta Cte 4512',      code: '111005', type: 'asset',   balance: 24_300_000,  _depth: 2 },
  { id: '113',name: 'Davivienda Cta Ahorros 7823',   code: '111010', type: 'asset',   balance: 11_700_000,  _depth: 2 },
  { id: '12', name: 'Cuentas por cobrar',            code: '13',     type: 'asset',   balance: 41_200_000,  _depth: 1 },
  { id: '13', name: 'Inventarios',                   code: '14',     type: 'asset',   balance: 8_600_000,   _depth: 1 },
  { id: '14', name: 'Propiedad, planta y equipo',    code: '15',     type: 'asset',   balance: 157_500_000, _depth: 1 },
  // Pasivos
  { id: '2',  name: 'PASIVO',                        code: '2',      type: 'liability', balance: 98_450_000 },
  { id: '21', name: 'Obligaciones financieras',      code: '21',     type: 'liability', balance: 62_000_000, _depth: 1 },
  { id: '22', name: 'Cuentas por pagar',             code: '22',     type: 'liability', balance: 18_250_000, _depth: 1 },
  { id: '23', name: 'Impuestos por pagar',           code: '24',     type: 'liability', balance: 12_100_000, _depth: 1 },
  { id: '24', name: 'Obligaciones laborales',        code: '25',     type: 'liability', balance: 6_100_000,  _depth: 1 },
  // Patrimonio
  { id: '3',  name: 'PATRIMONIO',                    code: '3',      type: 'equity',  balance: 147_350_000 },
  { id: '31', name: 'Capital social',                code: '31',     type: 'equity',  balance: 100_000_000, _depth: 1 },
  { id: '32', name: 'Reserva legal',                 code: '33',     type: 'equity',  balance: 20_000_000,  _depth: 1 },
  { id: '33', name: 'Utilidad del ejercicio',        code: '36',     type: 'equity',  balance: 27_350_000,  _depth: 1 },
  // Ingresos
  { id: '4',  name: 'INGRESOS',                      code: '4',      type: 'income',  balance: 89_250_000 },
  { id: '41', name: 'Ingresos por consultoría',      code: '4135',   type: 'income',  balance: 62_000_000, _depth: 1 },
  { id: '42', name: 'Comisiones comerciales',        code: '4140',   type: 'income',  balance: 18_450_000, _depth: 1 },
  { id: '43', name: 'Otros ingresos',                code: '4210',   type: 'income',  balance: 8_800_000,  _depth: 1 },
  // Gastos
  { id: '5',  name: 'GASTOS',                        code: '5',      type: 'expense', balance: 61_900_000 },
  { id: '51', name: 'Gastos de personal',            code: '5105',   type: 'expense', balance: 38_400_000, _depth: 1 },
  { id: '52', name: 'Arrendamientos',                code: '5110',   type: 'expense', balance: 9_600_000,  _depth: 1 },
  { id: '53', name: 'Servicios públicos',            code: '5115',   type: 'expense', balance: 1_800_000,  _depth: 1 },
  { id: '54', name: 'Honorarios',                    code: '5120',   type: 'expense', balance: 7_500_000,  _depth: 1 },
  { id: '55', name: 'Otros gastos operativos',       code: '5195',   type: 'expense', balance: 4_600_000,  _depth: 1 },
];

// ── Demo Expenses ───────────────────────────────────────────────────────
export const DEMO_EXPENSES: AlegraExpense[] = [
  { id: 3001, date: '2026-06-30', description: 'Nómina junio 2026',       total: 12_450_000, status: 'paid' },
  { id: 3002, date: '2026-06-30', description: 'Arriendo oficina',        total: 3_800_000,  status: 'paid' },
  { id: 3003, date: '2026-06-20', description: 'Honorarios asesor legal', total: 1_200_000,  status: 'paid' },
  { id: 3004, date: '2026-06-18', description: 'Servicios internet y telefonía', total: 420_000, status: 'paid' },
  { id: 3005, date: '2026-06-10', description: 'Mantenimiento equipos cómputo',  total: 680_000, status: 'draft' },
  { id: 3006, date: '2026-06-05', description: 'Material de papelería',          total: 95_000,  status: 'paid' },
];

// ── Demo Contacts ───────────────────────────────────────────────────────
export const DEMO_CONTACTS: AlegraContact[] = [
  { id: 101, name: '9ALLIANCE SAS BIC',           identificationObject: { number: '900524213', type: 'NIT' }, email: 'info@9alliance.co',        phonePrimary: '+57 1 3001234567', type: ['client'],  status: 'active' },
  { id: 102, name: 'ILC SAS BIC',                 identificationObject: { number: '830053483', type: 'NIT' }, email: 'ilc@9alliance.co',         phonePrimary: '+57 1 3109876543', type: ['client'],  status: 'active' },
  { id: 103, name: 'Construcciones Modernas SAS', identificationObject: { number: '901234567', type: 'NIT' }, email: 'contacto@consmod.co',       phonePrimary: '+57 4 6041112233', type: ['client'],  status: 'active' },
  { id: 104, name: 'Grupo Empresarial del Norte', identificationObject: { number: '800987654', type: 'NIT' }, email: 'ge@norte.co',               phonePrimary: '+57 5 7204445566', type: ['client'],  status: 'active' },
  { id: 105, name: 'Inversiones Andinas Ltda',    identificationObject: { number: '802345678', type: 'NIT' }, email: 'finanzas@andinas.co',       phonePrimary: '+57 1 3157778899', type: ['client'],  status: 'active' },
  { id: 106, name: 'Distribuidora Central SAS',   identificationObject: { number: '903210987', type: 'NIT' }, email: 'distribuidora@central.co',  phonePrimary: '+57 4 6052223344', type: ['client'],  status: 'active' },
  { id: 107, name: 'Sofía Ramírez',               identificationObject: { number: '1023456789', type: 'CC' }, email: 'sofia.ramirez@gmail.com',  phonePrimary: '+57 3106665544',   type: ['supplier'], status: 'active' },
  { id: 108, name: 'Carlos Mendoza Asociados',    identificationObject: { number: '904567890', type: 'NIT' }, email: 'cmendoza@asociados.co',    phonePrimary: '+57 1 3204567890', type: ['supplier'], status: 'active' },
];

// -- Demo Cost Centers
export const DEMO_COST_CENTERS: AlegraCostCenter[] = [
  { id: 1, name: 'Consultoria estrategica',    code: 'CC-01', status: 'active', description: 'Proyectos de consultoria y asesoria organizacional' },
  { id: 2, name: 'Gestion documental',         code: 'CC-02', status: 'active', description: 'Servicios de archivo y gestion de documentos' },
  { id: 3, name: 'Asesoria financiera',        code: 'CC-03', status: 'active', description: 'Consultoria financiera y tributaria' },
  { id: 4, name: 'Implementacion de sistemas', code: 'CC-04', status: 'active', description: 'ERP, software y digitalizacion' },
  { id: 5, name: 'Administracion interna',     code: 'CC-05', status: 'active', description: 'Gastos operativos de la firma' },
];

// -- Demo Contracts
export const DEMO_CONTRACTS: Contract[] = [
  {
    id: 'ct_demo_001', clienteId: 'demo-001',
    nombre: 'Consultoria estrategica anual',
    descripcion: 'Asesoria mensual en transformacion organizacional',
    costCenterId: 1, costCenterName: 'Consultoria estrategica',
    valorContrato: 84_000_000, fechaInicio: '2026-01-01', fechaFin: '2026-12-31',
    estado: 'activo', responsable: 'Felipe Serna', timestamp: 1_750_000_000_000,
  },
  {
    id: 'ct_demo_002', clienteId: 'demo-002',
    nombre: 'Servicios de gestion documental',
    descripcion: 'Archivo y digitalizacion de documentos historicos',
    costCenterId: 2, costCenterName: 'Gestion documental',
    valorContrato: 36_000_000, fechaInicio: '2026-02-01', fechaFin: '2026-07-31',
    estado: 'activo', responsable: 'Felipe Serna', timestamp: 1_750_000_001_000,
  },
  {
    id: 'ct_demo_003', clienteId: 'demo-003',
    nombre: 'Asesoria financiera trimestral',
    descripcion: 'Revision de estados financieros y planeacion tributaria',
    costCenterId: 3, costCenterName: 'Asesoria financiera',
    valorContrato: 24_000_000, fechaInicio: '2026-01-01',
    estado: 'activo', responsable: 'Felipe Serna', timestamp: 1_750_000_002_000,
  },
  {
    id: 'ct_demo_004', clienteId: 'demo-004',
    nombre: 'Implementacion modulo ERP',
    descripcion: 'Puesta en marcha y capacitacion del sistema contable',
    costCenterId: 4, costCenterName: 'Implementacion de sistemas',
    valorContrato: 48_000_000, fechaInicio: '2025-09-01', fechaFin: '2025-12-31',
    estado: 'finalizado', responsable: 'Felipe Serna', timestamp: 1_750_000_003_000,
  },
  {
    id: 'ct_demo_005', clienteId: 'demo-005',
    nombre: 'Outsourcing contable mensual',
    descripcion: 'Contabilidad externalizada completa',
    costCenterId: 3, costCenterName: 'Asesoria financiera',
    valorContrato: 18_000_000, fechaInicio: '2026-03-01',
    estado: 'activo', responsable: 'Felipe Serna', timestamp: 1_750_000_004_000,
  },
];

// ── Demo Items ──────────────────────────────────────────────────────────
export const DEMO_ITEMS: AlegraItem[] = [
  { id: 101, name: 'Consultoría estratégica (hora)',       type: 'service', price: [{ idPriceList: 1, name: 'Precio base', price: 350_000 }],     status: 'active' },
  { id: 102, name: 'Diagnóstico organizacional',          type: 'service', price: [{ idPriceList: 1, name: 'Precio base', price: 4_500_000 }],   status: 'active' },
  { id: 103, name: 'Gestión documental mensual',          type: 'service', price: [{ idPriceList: 1, name: 'Precio base', price: 1_200_000 }],   status: 'active' },
  { id: 104, name: 'Asesoría financiera trimestral',      type: 'service', price: [{ idPriceList: 1, name: 'Precio base', price: 8_000_000 }],   status: 'active' },
  { id: 105, name: 'Implementación ERP (licencia anual)', type: 'product', price: [{ idPriceList: 1, name: 'Precio base', price: 12_000_000 }],  status: 'active' },
  { id: 106, name: 'Capacitación corporativa (grupo)',    type: 'service', price: [{ idPriceList: 1, name: 'Precio base', price: 2_800_000 }],   status: 'active' },
];
