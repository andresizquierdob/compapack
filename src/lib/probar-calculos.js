// Script manual de verificacion. Se corre con: node src/lib/probar-calculos.js
// Imprime el resultado de calcularPaquete() para 3 ejemplos distintos, para
// poder revisar los numeros a mano antes de conectar esto a la interfaz.

import { calcularPaquete } from './calculos.js'

// Parametros de ejemplo, como si vinieran de la tabla parametros_calculo.
// Los porcentajes van en fraccion decimal (0.09 = 9%).
const parametrosEjemplo = {
  diasBonoVacacional: 15,
  diasUtilidades: 30,
  ivssPatronal: 0.11,
  rpePatronal: 0.02,
  faovPatronal: 0.02,
  incesPatronal: 0.02,
  ivssTrabajador: 0.04,
  rpeTrabajador: 0.005,
  faovTrabajador: 0.01,
  cestaticket: 40,
}

const formateador = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatear(monto) {
  return formateador.format(monto)
}

function imprimirResultado(titulo, resultado) {
  console.log(`\n=== ${titulo} ===`)
  for (const [clave, valor] of Object.entries(resultado)) {
    console.log(`${clave}: USD ${formatear(valor.usd)}  |  Bs ${formatear(valor.bs)}`)
  }
}

// Ejemplo 1: compa-ratio en 1.0 (justo en la mediana), sin beneficios extra.
const ejemplo1 = calcularPaquete({
  medianaMercado: 1000,
  compaRatio: 1.0,
  parametros: parametrosEjemplo,
  beneficiosAdicionales: [],
  tasa: 40,
})
imprimirResultado('Ejemplo 1: mediana 1000, compa-ratio 1.0, sin beneficios', ejemplo1)

// Ejemplo 2: compa-ratio en 0.85 (por debajo de la mediana), con un beneficio.
const ejemplo2 = calcularPaquete({
  medianaMercado: 1500,
  compaRatio: 0.85,
  parametros: parametrosEjemplo,
  beneficiosAdicionales: [{ nombre: 'Seguro medico', monto: 50 }],
  tasa: 40,
})
imprimirResultado(
  'Ejemplo 2: mediana 1500, compa-ratio 0.85, con seguro medico',
  ejemplo2,
)

// Ejemplo 3: compa-ratio en 1.2 (por encima de la mediana), con varios beneficios.
const ejemplo3 = calcularPaquete({
  medianaMercado: 2200,
  compaRatio: 1.2,
  parametros: parametrosEjemplo,
  beneficiosAdicionales: [
    { nombre: 'Seguro medico', monto: 70 },
    { nombre: 'Bono transporte', monto: 30 },
  ],
  tasa: 45,
})
imprimirResultado(
  'Ejemplo 3: mediana 2200, compa-ratio 1.2, con dos beneficios',
  ejemplo3,
)
