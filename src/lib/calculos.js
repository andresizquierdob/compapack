// Calculos de paquete salarial. Funcion pura: no toca Supabase, no toca React,
// solo recibe numeros y devuelve numeros. La logica es la descrita en CLAUDE.md.
//
// Convenciones de los parametros que se esperan en `parametros`:
// - Los porcentajes (ivss, rpe, faov, inces) se reciben como fraccion decimal,
//   por ejemplo 0.09 significa 9%.
// - `diasBonoVacacional` y `diasUtilidades` son numeros de dias.
// - `cestaticket` es un monto MENSUAL en USD.
//
// `beneficiosAdicionales` es un arreglo de los beneficios marcados por el
// consultor, cada uno como { nombre, monto } donde `monto` es mensual en USD.

// Convierte un monto en USD a su equivalente en Bs usando la tasa, y devuelve
// ambos valores juntos para no repetir la conversion en cada paso.
function enUsdYBs(montoUsd, tasa) {
  return {
    usd: montoUsd,
    bs: montoUsd * tasa,
  }
}

export function calcularPaquete(datos) {
  const { medianaMercado, compaRatio, parametros, beneficiosAdicionales, tasa } = datos

  const {
    diasBonoVacacional,
    diasUtilidades,
    ivssPatronal,
    rpePatronal,
    faovPatronal,
    incesPatronal,
    ivssTrabajador,
    rpeTrabajador,
    faovTrabajador,
    cestaticket,
  } = parametros

  // 1. El salario base es la mediana de mercado posicionada segun el compa-ratio.
  const salarioBase = medianaMercado * compaRatio

  // 2. Bono vacacional anual: se prorratea el salario base a un dia (salario/30)
  //    y se multiplica por los dias de bono vacacional que corresponden.
  const bonoVacacionalAnual = (salarioBase / 30) * diasBonoVacacional

  // 3. Utilidades anuales: mismo criterio de prorrateo diario, con los dias de
  //    utilidades del parametro.
  const utilidadesAnuales = (salarioBase / 30) * diasUtilidades

  // 4. Prorrateo mensual: el bono vacacional y las utilidades son montos
  //    anuales, se reparten entre los 12 meses del ano para reflejar su
  //    impacto mensual en el costo de la empresa.
  const prorrateoMensual = (bonoVacacionalAnual + utilidadesAnuales) / 12

  // 5. Aportes patronales: porcentaje del salario base que paga la empresa por
  //    seguridad social (IVSS), regimen de empleo (RPE), vivienda (FAOV) y
  //    capacitacion (INCES).
  const aportesPatronales =
    salarioBase * (ivssPatronal + rpePatronal + faovPatronal + incesPatronal)

  // 6. Beneficios adicionales: suma de todos los beneficios que el consultor
  //    marco para esta propuesta (montos mensuales en USD).
  const beneficiosTotal = beneficiosAdicionales.reduce(
    (total, beneficio) => total + beneficio.monto,
    0,
  )

  // 7. Costo empresa mensual: todo lo que le cuesta a la empresa mantener al
  //    trabajador cada mes.
  const costoEmpresaMensual =
    salarioBase +
    prorrateoMensual +
    cestaticket +
    aportesPatronales +
    beneficiosTotal

  // 8. Retenciones del trabajador: porcentaje del salario base que se retiene
  //    para IVSS, RPE y FAOV (el trabajador no aporta a INCES).
  const retencionesTrabajador =
    salarioBase * (ivssTrabajador + rpeTrabajador + faovTrabajador)

  // 9. Neto del trabajador: salario base menos lo retenido, mas el cestaticket
  //    (que el trabajador recibe completo, sin retenciones).
  const netoTrabajadorMensual = salarioBase - retencionesTrabajador + cestaticket

  // 10. Cada monto se devuelve en USD y en Bs usando la tasa vigente.
  return {
    salarioBase: enUsdYBs(salarioBase, tasa),
    bonoVacacionalAnual: enUsdYBs(bonoVacacionalAnual, tasa),
    utilidadesAnuales: enUsdYBs(utilidadesAnuales, tasa),
    prorrateoMensual: enUsdYBs(prorrateoMensual, tasa),
    aportesPatronales: enUsdYBs(aportesPatronales, tasa),
    beneficiosTotal: enUsdYBs(beneficiosTotal, tasa),
    costoEmpresaMensual: enUsdYBs(costoEmpresaMensual, tasa),
    retencionesTrabajador: enUsdYBs(retencionesTrabajador, tasa),
    netoTrabajadorMensual: enUsdYBs(netoTrabajadorMensual, tasa),
  }
}
