import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { calcularPaquete } from '../lib/calculos.js'
import { obtenerParametrosCalculoMock } from '../data/mock.js'

// Convierte el arreglo clave/valor de parametros_calculo al objeto que espera
// calcularPaquete(), y saca la tasa aparte porque calcularPaquete la recibe
// como argumento independiente.
const CLAVE_A_CAMPO = {
  dias_bono_vacacional: 'diasBonoVacacional',
  dias_utilidades: 'diasUtilidades',
  cestaticket: 'cestaticket',
  ivss_patronal: 'ivssPatronal',
  rpe_patronal: 'rpePatronal',
  faov_patronal: 'faovPatronal',
  inces_patronal: 'incesPatronal',
  ivss_trabajador: 'ivssTrabajador',
  rpe_trabajador: 'rpeTrabajador',
  faov_trabajador: 'faovTrabajador',
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

function formatearFecha(fecha) {
  return fecha.toLocaleDateString('es-VE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Fila de una tabla de montos, con las columnas USD y Bs.
function FilaMonto({ etiqueta, usd, bs, negrita = false }) {
  const claseTexto = negrita ? 'font-semibold text-slate-900' : 'text-slate-700'
  return (
    <tr className={negrita ? 'border-t-2 border-slate-300' : 'border-t border-slate-100'}>
      <td className={`px-4 py-2 ${claseTexto}`}>{etiqueta}</td>
      <td className={`px-4 py-2 text-right ${claseTexto}`}>USD {formatearMonto(usd)}</td>
      <td className={`px-4 py-2 text-right ${claseTexto}`}>Bs {formatearMonto(bs)}</td>
    </tr>
  )
}

function Resultados() {
  const location = useLocation()
  const navigate = useNavigate()
  const propuesta = location.state

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [parametros, setParametros] = useState(null)
  const [tasa, setTasa] = useState(0)

  const [guardando, setGuardando] = useState(false)
  const [mensajeGuardado, setMensajeGuardado] = useState(null)

  const fecha = useMemo(() => new Date(), [])

  useEffect(() => {
    if (!propuesta) return

    let cancelado = false

    async function cargarParametros() {
      setCargando(true)
      setError(null)
      try {
        const lista = await obtenerParametrosCalculoMock()
        if (!cancelado) {
          const { parametros: parametrosConvertidos, tasa: tasaConvertida } =
            convertirParametros(lista)
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

  const resultado = useMemo(() => {
    if (!propuesta || !parametros) return null
    return calcularPaquete({
      medianaMercado: propuesta.medianaMercado,
      compaRatio: propuesta.compaRatio,
      parametros,
      beneficiosAdicionales: propuesta.beneficiosAdicionales,
      tasa,
    })
  }, [propuesta, parametros, tasa])

  // Desglose mensual del bono vacacional y las utilidades (calcularPaquete
  // solo devuelve el prorrateo combinado, aqui se separan para mostrarlos).
  const desglose = useMemo(() => {
    if (!resultado || !parametros) return null
    const prorrateoBono = {
      usd: resultado.bonoVacacionalAnual.usd / 12,
      bs: resultado.bonoVacacionalAnual.bs / 12,
    }
    const prorrateoUtilidades = {
      usd: resultado.utilidadesAnuales.usd / 12,
      bs: resultado.utilidadesAnuales.bs / 12,
    }
    const cestaticket = {
      usd: parametros.cestaticket,
      bs: parametros.cestaticket * tasa,
    }
    const retencionIvss = {
      usd: resultado.salarioBase.usd * parametros.ivssTrabajador,
      bs: resultado.salarioBase.bs * parametros.ivssTrabajador,
    }
    const retencionRpe = {
      usd: resultado.salarioBase.usd * parametros.rpeTrabajador,
      bs: resultado.salarioBase.bs * parametros.rpeTrabajador,
    }
    const retencionFaov = {
      usd: resultado.salarioBase.usd * parametros.faovTrabajador,
      bs: resultado.salarioBase.bs * parametros.faovTrabajador,
    }
    return {
      prorrateoBono,
      prorrateoUtilidades,
      cestaticket,
      retencionIvss,
      retencionRpe,
      retencionFaov,
    }
  }, [resultado, parametros, tasa])

  function manejarGuardar() {
    setGuardando(true)
    setMensajeGuardado(null)
    setTimeout(() => {
      setGuardando(false)
      setMensajeGuardado('Propuesta guardada.')
    }, 300)
  }

  function manejarComparar() {
    navigate('/comparar', { state: propuesta })
  }

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
    return <p className="text-sm text-slate-500">Calculando paquete...</p>
  }

  if (error) {
    return (
      <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {propuesta.clienteNombre}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {propuesta.cargo} &middot; {propuesta.rubro} &middot;{' '}
            {propuesta.ciudad ?? 'Nacional'}
          </p>
        </div>
        <p className="text-sm text-slate-500">{formatearFecha(fecha)}</p>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-slate-800 p-6 text-white shadow-sm">
        <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-300">
              Mediana de mercado
            </p>
            <p className="mt-1 text-xl font-semibold">
              USD {formatearMonto(propuesta.medianaMercado)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-300">
              Compa-ratio aplicado
            </p>
            <p className="mt-1 text-xl font-semibold">
              {Math.round(propuesta.compaRatio * 100)}%
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-300">
              Salario base posicionado
            </p>
            <p className="mt-1 text-xl font-semibold">
              USD {formatearMonto(resultado.salarioBase.usd)}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          Costo para la empresa
        </h2>
        <table className="w-full text-sm">
          <tbody>
            <FilaMonto
              etiqueta="Salario base"
              usd={resultado.salarioBase.usd}
              bs={resultado.salarioBase.bs}
            />
            <FilaMonto
              etiqueta="Prorrateo bono vacacional"
              usd={desglose.prorrateoBono.usd}
              bs={desglose.prorrateoBono.bs}
            />
            <FilaMonto
              etiqueta="Prorrateo utilidades"
              usd={desglose.prorrateoUtilidades.usd}
              bs={desglose.prorrateoUtilidades.bs}
            />
            <FilaMonto
              etiqueta="Cestaticket"
              usd={desglose.cestaticket.usd}
              bs={desglose.cestaticket.bs}
            />
            <FilaMonto
              etiqueta="Aportes patronales"
              usd={resultado.aportesPatronales.usd}
              bs={resultado.aportesPatronales.bs}
            />
            <FilaMonto
              etiqueta="Beneficios adicionales"
              usd={resultado.beneficiosTotal.usd}
              bs={resultado.beneficiosTotal.bs}
            />
            <FilaMonto
              etiqueta="Total costo empresa"
              usd={resultado.costoEmpresaMensual.usd}
              bs={resultado.costoEmpresaMensual.bs}
              negrita
            />
          </tbody>
        </table>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          Neto del trabajador
        </h2>
        <table className="w-full text-sm">
          <tbody>
            <FilaMonto
              etiqueta="Salario base"
              usd={resultado.salarioBase.usd}
              bs={resultado.salarioBase.bs}
            />
            <FilaMonto
              etiqueta="Menos retencion IVSS"
              usd={-desglose.retencionIvss.usd}
              bs={-desglose.retencionIvss.bs}
            />
            <FilaMonto
              etiqueta="Menos retencion RPE"
              usd={-desglose.retencionRpe.usd}
              bs={-desglose.retencionRpe.bs}
            />
            <FilaMonto
              etiqueta="Menos retencion FAOV"
              usd={-desglose.retencionFaov.usd}
              bs={-desglose.retencionFaov.bs}
            />
            <FilaMonto
              etiqueta="Mas cestaticket"
              usd={desglose.cestaticket.usd}
              bs={desglose.cestaticket.bs}
            />
            <FilaMonto
              etiqueta="Total neto trabajador"
              usd={resultado.netoTrabajadorMensual.usd}
              bs={resultado.netoTrabajadorMensual.bs}
              negrita
            />
          </tbody>
        </table>
      </section>

      <p className="mt-4 text-xs text-slate-500">
        Tasa BCV usada: {formatearMonto(tasa)} Bs/USD &middot; calculado el{' '}
        {formatearFecha(fecha)}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={manejarGuardar}
          disabled={guardando}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? 'Guardando...' : 'Guardar propuesta'}
        </button>
        <button
          type="button"
          onClick={manejarComparar}
          className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
        >
          Comparar escenarios
        </button>
        {mensajeGuardado && (
          <span className="text-sm text-green-700">{mensajeGuardado}</span>
        )}
      </div>
    </div>
  )
}

export default Resultados
