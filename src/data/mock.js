// Datos de prueba. Imitan la forma de las tablas de Supabase para que, cuando
// se conecte la base de datos real, solo haya que cambiar de donde vienen los
// datos y no como se usan en las pantallas.

// Espejo de la tabla parametros_calculo. Los porcentajes se guardan como
// fraccion decimal (0.09 = 9%), igual que en src/lib/calculos.js.
export const parametrosCalculoMock = [
  {
    id: 1,
    clave: 'tasa_bcv',
    valor: 40.5,
    descripcion: 'Tasa de cambio Bs/USD',
    actualizado_en: '2026-07-15T09:00:00Z',
  },
  {
    id: 2,
    clave: 'dias_bono_vacacional',
    valor: 15,
    descripcion: 'Dias de bono vacacional al ano',
    actualizado_en: '2026-07-15T09:00:00Z',
  },
  {
    id: 3,
    clave: 'dias_utilidades',
    valor: 30,
    descripcion: 'Dias de utilidades al ano',
    actualizado_en: '2026-07-15T09:00:00Z',
  },
  {
    id: 4,
    clave: 'cestaticket',
    valor: 40,
    descripcion: 'Cestaticket mensual',
    actualizado_en: '2026-07-15T09:00:00Z',
  },
  {
    id: 5,
    clave: 'ivss_patronal',
    valor: 0.11,
    descripcion: 'Aporte patronal al IVSS',
    actualizado_en: '2026-07-15T09:00:00Z',
  },
  {
    id: 6,
    clave: 'rpe_patronal',
    valor: 0.02,
    descripcion: 'Aporte patronal al Regimen Prestacional de Empleo (RPE)',
    actualizado_en: '2026-07-15T09:00:00Z',
  },
  {
    id: 7,
    clave: 'faov_patronal',
    valor: 0.02,
    descripcion: 'Aporte patronal al Fondo de Ahorro Obligatorio para la Vivienda (FAOV)',
    actualizado_en: '2026-07-15T09:00:00Z',
  },
  {
    id: 8,
    clave: 'inces_patronal',
    valor: 0.02,
    descripcion: 'Aporte patronal al INCES',
    actualizado_en: '2026-07-15T09:00:00Z',
  },
  {
    id: 9,
    clave: 'ivss_trabajador',
    valor: 0.04,
    descripcion: 'Retencion al trabajador para el IVSS',
    actualizado_en: '2026-07-15T09:00:00Z',
  },
  {
    id: 10,
    clave: 'rpe_trabajador',
    valor: 0.005,
    descripcion: 'Retencion al trabajador para el RPE',
    actualizado_en: '2026-07-15T09:00:00Z',
  },
  {
    id: 11,
    clave: 'faov_trabajador',
    valor: 0.01,
    descripcion: 'Retencion al trabajador para el FAOV',
    actualizado_en: '2026-07-15T09:00:00Z',
  },
]

// Simula una llamada a Supabase: devuelve una copia de los datos despues de un
// pequeno retraso, para que la pantalla ya maneje el estado de carga real.
export function obtenerParametrosCalculoMock() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(parametrosCalculoMock.map((parametro) => ({ ...parametro })))
    }, 300)
  })
}

// Espejo de la tabla clientes.
export const clientesMock = [
  { id: 1, nombre_empresa: 'Inversiones Andina C.A.', rubro: 'Servicios Financieros', ciudad: 'Caracas' },
  { id: 2, nombre_empresa: 'TecnoSoluciones VE', rubro: 'Tecnologia', ciudad: 'Valencia' },
  { id: 3, nombre_empresa: 'Distribuidora El Puerto', rubro: 'Retail', ciudad: 'Maracaibo' },
  { id: 4, nombre_empresa: 'Manufacturas del Centro', rubro: 'Manufactura', ciudad: 'Caracas' },
]

// Espejo de la tabla referencias_mercado. `ciudad: null` significa que la
// referencia es nacional (no esta atada a una ciudad especifica).
export const referenciasMercadoMock = [
  { id: 1, cargo: 'Analista de Recursos Humanos', rubro: 'Servicios Financieros', ciudad: 'Caracas', mediana_salarial: 900, moneda: 'USD', fecha_referencia: '2026-06-01' },
  { id: 2, cargo: 'Analista de Recursos Humanos', rubro: 'Tecnologia', ciudad: null, mediana_salarial: 950, moneda: 'USD', fecha_referencia: '2026-06-01' },
  { id: 3, cargo: 'Gerente de Ventas', rubro: 'Retail', ciudad: 'Maracaibo', mediana_salarial: 1400, moneda: 'USD', fecha_referencia: '2026-06-01' },
  { id: 4, cargo: 'Gerente de Ventas', rubro: 'Servicios Financieros', ciudad: 'Caracas', mediana_salarial: 1800, moneda: 'USD', fecha_referencia: '2026-06-01' },
  { id: 5, cargo: 'Desarrollador de Software', rubro: 'Tecnologia', ciudad: 'Valencia', mediana_salarial: 1300, moneda: 'USD', fecha_referencia: '2026-06-01' },
  { id: 6, cargo: 'Desarrollador de Software', rubro: 'Tecnologia', ciudad: null, mediana_salarial: 1250, moneda: 'USD', fecha_referencia: '2026-06-01' },
  { id: 7, cargo: 'Contador', rubro: 'Manufactura', ciudad: 'Caracas', mediana_salarial: 1100, moneda: 'USD', fecha_referencia: '2026-06-01' },
  { id: 8, cargo: 'Contador', rubro: 'Retail', ciudad: null, mediana_salarial: 1000, moneda: 'USD', fecha_referencia: '2026-06-01' },
]

// Simula la carga de clientes desde Supabase.
export function obtenerClientesMock() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(clientesMock.map((cliente) => ({ ...cliente })))
    }, 300)
  })
}

// Simula la carga de referencias de mercado desde Supabase.
export function obtenerReferenciasMercadoMock() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(referenciasMercadoMock.map((referencia) => ({ ...referencia })))
    }, 300)
  })
}

// Espejo de la tabla propuestas. Los montos aqui son los que quedaron
// congelados al momento de crear cada propuesta (no se recalculan con los
// parametros actuales), igual que dice CLAUDE.md.
export const propuestasMock = [
  {
    id: 1,
    cliente_id: 1,
    cargo: 'Gerente de Ventas',
    rubro: 'Servicios Financieros',
    ciudad: 'Caracas',
    mediana_usada: 1800,
    compa_ratio: 1.0,
    salario_base: 1800,
    costo_empresa_total: 2450.3,
    neto_estimado: 1720.5,
    tasa_usada: 38.2,
    created_at: '2026-06-10T14:00:00Z',
  },
  {
    id: 2,
    cliente_id: 1,
    cargo: 'Analista de Recursos Humanos',
    rubro: 'Servicios Financieros',
    ciudad: 'Caracas',
    mediana_usada: 900,
    compa_ratio: 0.9,
    salario_base: 810,
    costo_empresa_total: 1150.75,
    neto_estimado: 775.4,
    tasa_usada: 39.0,
    created_at: '2026-07-01T10:30:00Z',
  },
  {
    id: 3,
    cliente_id: 2,
    cargo: 'Desarrollador de Software',
    rubro: 'Tecnologia',
    ciudad: 'Valencia',
    mediana_usada: 1300,
    compa_ratio: 1.1,
    salario_base: 1430,
    costo_empresa_total: 1960.2,
    neto_estimado: 1365.1,
    tasa_usada: 40.5,
    created_at: '2026-07-12T09:15:00Z',
  },
  {
    id: 4,
    cliente_id: 4,
    cargo: 'Contador',
    rubro: 'Manufactura',
    ciudad: 'Caracas',
    mediana_usada: 1100,
    compa_ratio: 1.0,
    salario_base: 1100,
    costo_empresa_total: 1520.6,
    neto_estimado: 1030.85,
    tasa_usada: 40.5,
    created_at: '2026-05-20T16:45:00Z',
  },
  {
    id: 5,
    cliente_id: 4,
    cargo: 'Contador',
    rubro: 'Manufactura',
    ciudad: 'Caracas',
    mediana_usada: 1100,
    compa_ratio: 1.2,
    salario_base: 1320,
    costo_empresa_total: 1790.4,
    neto_estimado: 1220.95,
    tasa_usada: 41.0,
    created_at: '2026-07-18T11:00:00Z',
  },
]

// Simula la carga de propuestas desde Supabase.
export function obtenerPropuestasMock() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(propuestasMock.map((propuesta) => ({ ...propuesta })))
    }, 300)
  })
}
