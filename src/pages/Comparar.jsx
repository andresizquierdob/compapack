import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { calcularPaquete } from '../lib/calculos.js'
import { supabase } from '../lib/supabase.js'

const PORCENTAJES_POR_DEFECTO = [80, 90, 100, 110, 120]

// Convierte el arreglo clave/valor de parametros_calculo (tal como esta en
// Supabase) al objeto que espera calcularPaquete().
const CLAVE_A_CAMPO = {
  dias_bono_vacacional: 'diasBonoVacacional',
  dias_utilidades: 'diasUtilidades',
  monto_cestaticket: 'cestaticket',
  pct_ivss_patronal: 'ivssPatronal',
  pct_rpe_patronal: 'rpePatronal',
  pct_faov_patronal: 'faovPatronal',
  pct_inces_patronal: 'incesPatronal',
  pct_ivss_trabajador: 'ivssTrabajador',
  pct_rpe_trabajador: 'rpeTrabajador',
  pct_faov_trabajador: 'faovTrabajador',
}

function convertirParametros(listaParametros) {
  const parametros = {}
  let tasa = 0
  listaParametros.forEach((parametro) => {
    if (parametro.clave === 'tasa_bcv') {
      tasa = parametro.valor
      return
    }
    const campo = CLAVE_A_CAMPO[parametro.clave]
    if (campo) parametros[campo] = parametro.valor
  })
  return { parametros, tasa }
}

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto)
}

function formatearPorcentaje(porcentaje) {
  const signo = porcentaje > 0 ? '+' : ''
  return `${signo}${porcentaje.toFixed(1)}%`
}

function Comparar() {
  const location = useLocation()
  const propuesta = location.state

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [parametros, setParametros] = useState(null)
  const [tasa, setTasa] = useState(0)

  // Un escenario por columna: el porcentaje de compa-ratio es editable.
  const [escenarios, setEscenarios] = useState(
    PORCENTAJES_POR_DEFECTO.map((porcentaje, indice) => ({ id: indice, porcentaje })),
  )

  useEffect(() => {
    if (!propuesta) return

    let cancelado = false

    async function cargarParametros() {
      setCargando(true)
      setError(null)
      try {
        const { data, error: errorSupabase } = await supabase
          .from('parametros_calculo')
          .select('*')

        if (errorSupabase) throw errorSupabase

        if (!cancelado) {
          const { parametros: parametrosConvertidos, tasa: tasaConvertida } =
            convertirParametros(data)
          setParametros(parametrosConvertidos)
          setTasa(tasaConvertida)
        }
      } catch {
        if (!cancelado) {
          setError('No se pudieron cargar los parametros de calculo. Intenta de nuevo.')
        }
      } finally {
        if (!cancelado) {
          setCargando(false)
        }
      }
    }

    cargarParametros()

    return () => {
      cancelado = true
    }
  }, [propuesta])

  function manejarCambioPorcentaje(id, texto) {
    setEscenarios((actuales) =>
      actuales.map((escenario) =>
        escenario.id === id
          ? { ...escenario, porcentaje: texto === '' ? '' : Number(texto) }
          : escenario,
      ),
    )
  }

  // La columna base para la diferencia en % es la que originalmente era el
  // 100% (la del medio), aunque el consultor haya editado su valor despues.
  const indiceBase = 2

  const resultados = useMemo(() => {
    if (!propuesta || !parametros) return null
    return escenarios.map((escenario) => {
      const compaRatio = escenario.porcentaje === '' ? 0 : escenario.porcentaje / 100
      return calcularPaquete({
        medianaMercado: propuesta.medianaMercado,
        compaRatio,
        parametros,
        beneficiosAdicionales: propuesta.beneficiosAdicionales,
        tasa,
      })
    })
  }, [propuesta, parametros, tasa, escenarios])

  if (!propuesta) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-slate-700">
          No hay una propuesta calculada todavia.
        </p>
        <Link
          to="/nueva"
          className="mt-4 inline-block rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Ir a Nueva propuesta
        </Link>
      </div>
    )
  }

  if (cargando) {
    return <p className="text-sm text-slate-500">Calculando escenarios...</p>
  }

  if (error) {
    return (
      <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    )
  }

  const costoEmpresaBase = resultados[indiceBase]?.costoEmpresaMensual.usd

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-800">
        Comparacion de escenarios
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {propuesta.clienteNombre} &middot; {propuesta.cargo} &middot;{' '}
        {propuesta.rubro} &middot; {propuesta.ciudad ?? 'Nacional'} &middot;{' '}
        mediana USD {formatearMonto(propuesta.medianaMercado)}
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Compa-ratio
              </th>
              {escenarios.map((escenario, indice) => {
                const seleccionado =
                  propuesta.compaRatio !== undefined &&
                  escenario.porcentaje !== '' &&
                  Math.abs(escenario.porcentaje / 100 - propuesta.compaRatio) < 0.001

                return (
                  <th
                    key={escenario.id}
                    className={
                      seleccionado
                        ? 'border-x-2 border-slate-800 bg-slate-100 px-4 py-3 text-center font-semibold text-slate-900'
                        : 'px-4 py-3 text-center font-medium text-slate-600'
                    }
                  >
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        step="any"
                        value={escenario.porcentaje}
                        onChange={(evento) =>
                          manejarCambioPorcentaje(escenario.id, evento.target.value)
                        }
                        className="w-16 rounded border border-slate-300 px-2 py-1 text-center text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                    {seleccionado && (
                      <p className="mt-1 text-xs font-normal text-slate-500">
                        seleccionado
                      </p>
                    )}
                    {indice === indiceBase && (
                      <p className="mt-1 text-xs font-normal text-slate-400">
                        base
                      </p>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td className="px-4 py-3 text-slate-700">Salario base</td>
              {resultados.map((resultado, indice) => (
                <FilaCelda
                  key={escenarios[indice].id}
                  resaltada={esColumnaSeleccionada(escenarios[indice], propuesta)}
                >
                  USD {formatearMonto(resultado.salarioBase.usd)}
                  <br />
                  <span className="text-xs text-slate-400">
                    Bs {formatearMonto(resultado.salarioBase.bs)}
                  </span>
                </FilaCelda>
              ))}
            </tr>
            <tr className="border-t border-slate-100">
              <td className="px-4 py-3 text-slate-700">Costo empresa total</td>
              {resultados.map((resultado, indice) => (
                <FilaCelda
                  key={escenarios[indice].id}
                  resaltada={esColumnaSeleccionada(escenarios[indice], propuesta)}
                >
                  USD {formatearMonto(resultado.costoEmpresaMensual.usd)}
                  <br />
                  <span className="text-xs text-slate-400">
                    Bs {formatearMonto(resultado.costoEmpresaMensual.bs)}
                  </span>
                </FilaCelda>
              ))}
            </tr>
            <tr className="border-t border-slate-100">
              <td className="px-4 py-3 text-slate-700">Neto trabajador</td>
              {resultados.map((resultado, indice) => (
                <FilaCelda
                  key={escenarios[indice].id}
                  resaltada={esColumnaSeleccionada(escenarios[indice], propuesta)}
                >
                  USD {formatearMonto(resultado.netoTrabajadorMensual.usd)}
                  <br />
                  <span className="text-xs text-slate-400">
                    Bs {formatearMonto(resultado.netoTrabajadorMensual.bs)}
                  </span>
                </FilaCelda>
              ))}
            </tr>
            <tr className="border-t-2 border-slate-300">
              <td className="px-4 py-3 font-semibold text-slate-900">
                Diferencia costo empresa vs 100%
              </td>
              {resultados.map((resultado, indice) => {
                const diferencia = costoEmpresaBase
                  ? ((resultado.costoEmpresaMensual.usd - costoEmpresaBase) / costoEmpresaBase) * 100
                  : 0
                const esBase = indice === indiceBase
                return (
                  <FilaCelda
                    key={escenarios[indice].id}
                    resaltada={esColumnaSeleccionada(escenarios[indice], propuesta)}
                    negrita
                  >
                    {esBase ? (
                      <span className="text-slate-400">base</span>
                    ) : (
                      <span className={diferencia >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                        {formatearPorcentaje(diferencia)}
                      </span>
                    )}
                  </FilaCelda>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Tasa BCV usada: {formatearMonto(tasa)} Bs/USD
      </p>
    </div>
  )
}

function esColumnaSeleccionada(escenario, propuesta) {
  return (
    propuesta.compaRatio !== undefined &&
    escenario.porcentaje !== '' &&
    Math.abs(escenario.porcentaje / 100 - propuesta.compaRatio) < 0.001
  )
}

function FilaCelda({ children, resaltada, negrita = false }) {
  const base = 'px-4 py-3 text-center'
  const color = negrita ? 'text-slate-900' : 'text-slate-700'
  const fondo = resaltada ? 'border-x-2 border-slate-800 bg-slate-100' : ''
  return <td className={`${base} ${color} ${fondo}`}>{children}</td>
}

export default Comparar
