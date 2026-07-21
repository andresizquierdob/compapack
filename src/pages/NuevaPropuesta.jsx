import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

const OPCIONES_COMPA_RATIO = [0.8, 0.9, 1.0, 1.1, 1.2]

const BENEFICIOS_DISPONIBLES = [
  { clave: 'seguro_hcm', nombre: 'Seguro HCM', montoSugerido: 60 },
  { clave: 'transporte', nombre: 'Transporte', montoSugerido: 25 },
  { clave: 'alimentacion', nombre: 'Alimentacion', montoSugerido: 20 },
  { clave: 'bono_productividad', nombre: 'Bono de productividad', montoSugerido: 50 },
]

// Saca la lista de valores unicos (sin repetir, sin vacios) de un campo de
// las referencias de mercado, para llenar los selectores de cargo/rubro.
function valoresUnicos(referencias, campo) {
  const valores = new Set()
  referencias.forEach((referencia) => {
    if (referencia[campo]) valores.add(referencia[campo])
  })
  return Array.from(valores).sort()
}

// Busca la referencia de mercado que corresponde al cargo, rubro y ciudad
// elegidos. Si no hay una referencia especifica para la ciudad, cae a la
// referencia nacional (ciudad null) de ese cargo y rubro, si existe.
function buscarReferencia(referencias, cargo, rubro, ciudad) {
  if (!cargo || !rubro) return { referencia: null, esNacionalPorDefecto: false }

  if (ciudad) {
    const conCiudad = referencias.find(
      (referencia) =>
        referencia.cargo === cargo &&
        referencia.rubro === rubro &&
        referencia.ciudad === ciudad,
    )
    if (conCiudad) return { referencia: conCiudad, esNacionalPorDefecto: false }
  }

  const nacional = referencias.find(
    (referencia) =>
      referencia.cargo === cargo &&
      referencia.rubro === rubro &&
      referencia.ciudad === null,
  )
  if (nacional) {
    return { referencia: nacional, esNacionalPorDefecto: Boolean(ciudad) }
  }

  return { referencia: null, esNacionalPorDefecto: false }
}

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto)
}

function NuevaPropuesta() {
  const navigate = useNavigate()

  const [clientes, setClientes] = useState([])
  const [referencias, setReferencias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [clienteId, setClienteId] = useState('')
  const [cargo, setCargo] = useState('')
  const [rubro, setRubro] = useState('')
  const [ciudad, setCiudad] = useState('')

  const [compaRatioSeleccionado, setCompaRatioSeleccionado] = useState(1.0)
  const [compaRatioPersonalizado, setCompaRatioPersonalizado] = useState('')

  const [beneficios, setBeneficios] = useState(
    Object.fromEntries(
      BENEFICIOS_DISPONIBLES.map((beneficio) => [
        beneficio.clave,
        { marcado: false, monto: beneficio.montoSugerido },
      ]),
    ),
  )

  useEffect(() => {
    let cancelado = false

    async function cargarDatos() {
      setCargando(true)
      setError(null)
      try {
        const [resultadoClientes, resultadoReferencias] = await Promise.all([
          supabase.from('clientes').select('*').order('nombre_empresa'),
          supabase.from('referencias_mercado').select('*').order('cargo'),
        ])

        if (resultadoClientes.error) throw resultadoClientes.error
        if (resultadoReferencias.error) throw resultadoReferencias.error

        if (!cancelado) {
          setClientes(resultadoClientes.data)
          setReferencias(resultadoReferencias.data)
        }
      } catch {
        if (!cancelado) {
          setError('No se pudieron cargar los datos del formulario. Intenta de nuevo.')
        }
      } finally {
        if (!cancelado) {
          setCargando(false)
        }
      }
    }

    cargarDatos()

    return () => {
      cancelado = true
    }
  }, [])

  const cargos = useMemo(() => valoresUnicos(referencias, 'cargo'), [referencias])
  const rubros = useMemo(() => valoresUnicos(referencias, 'rubro'), [referencias])
  const ciudades = useMemo(() => valoresUnicos(referencias, 'ciudad'), [referencias])

  const { referencia: referenciaEncontrada, esNacionalPorDefecto } = useMemo(
    () => buscarReferencia(referencias, cargo, rubro, ciudad),
    [referencias, cargo, rubro, ciudad],
  )

  const compaRatioFinal = compaRatioPersonalizado !== ''
    ? Number(compaRatioPersonalizado) / 100
    : compaRatioSeleccionado

  const formularioValido =
    clienteId !== '' &&
    cargo !== '' &&
    rubro !== '' &&
    referenciaEncontrada !== null &&
    compaRatioFinal > 0

  function manejarSeleccionCompaRatio(valor) {
    setCompaRatioSeleccionado(valor)
    setCompaRatioPersonalizado('')
  }

  function manejarCambioBeneficioMarcado(clave, marcado) {
    setBeneficios((actuales) => ({
      ...actuales,
      [clave]: { ...actuales[clave], marcado },
    }))
  }

  function manejarCambioBeneficioMonto(clave, texto) {
    setBeneficios((actuales) => ({
      ...actuales,
      [clave]: { ...actuales[clave], monto: texto === '' ? '' : Number(texto) },
    }))
  }

  function manejarCalcular(evento) {
    evento.preventDefault()
    if (!formularioValido) return

    const cliente = clientes.find((c) => c.id === clienteId)
    const beneficiosAdicionales = BENEFICIOS_DISPONIBLES.filter(
      (beneficio) => beneficios[beneficio.clave].marcado,
    ).map((beneficio) => ({
      nombre: beneficio.nombre,
      monto: Number(beneficios[beneficio.clave].monto) || 0,
    }))

    navigate('/resultados', {
      state: {
        clienteId,
        clienteNombre: cliente?.nombre_empresa ?? '',
        cargo,
        rubro,
        ciudad: ciudad || null,
        compaRatio: compaRatioFinal,
        medianaMercado: referenciaEncontrada.mediana_salarial,
        referenciaId: referenciaEncontrada.id,
        beneficiosAdicionales,
      },
    })
  }

  if (cargando) {
    return <p className="text-sm text-slate-500">Cargando formulario...</p>
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
      <h1 className="text-2xl font-bold text-slate-800">Nueva propuesta</h1>
      <p className="mt-1 text-sm text-slate-500">
        Define el cliente, el cargo a posicionar y el compa-ratio objetivo.
      </p>

      <form onSubmit={manejarCalcular} className="mt-6 space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Cliente y cargo</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-600">
                Cliente
              </label>
              <select
                value={clienteId}
                onChange={(evento) => setClienteId(evento.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre_empresa}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600">
                Cargo
              </label>
              <select
                value={cargo}
                onChange={(evento) => setCargo(evento.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
              >
                <option value="">Selecciona un cargo</option>
                {cargos.map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600">
                Rubro
              </label>
              <select
                value={rubro}
                onChange={(evento) => setRubro(evento.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
              >
                <option value="">Selecciona un rubro</option>
                {rubros.map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600">
                Ciudad (opcional)
              </label>
              <select
                value={ciudad}
                onChange={(evento) => setCiudad(evento.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
              >
                <option value="">Nacional</option>
                {ciudades.map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm">
            {cargo && rubro && referenciaEncontrada && (
              <p className="text-slate-600">
                Mediana de mercado encontrada:{' '}
                <span className="font-semibold text-slate-800">
                  USD {formatearMonto(referenciaEncontrada.mediana_salarial)}
                </span>
                {esNacionalPorDefecto && (
                  <span className="text-slate-500">
                    {' '}
                    (no hay referencia especifica para esa ciudad, se uso la
                    referencia nacional)
                  </span>
                )}
              </p>
            )}
            {cargo && rubro && !referenciaEncontrada && (
              <p className="text-amber-700">
                No hay una referencia de mercado para ese cargo y rubro. Agregala
                en Referencias de mercado antes de continuar.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">
            Compa-ratio objetivo
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {OPCIONES_COMPA_RATIO.map((opcion) => {
              const activo =
                compaRatioPersonalizado === '' && compaRatioSeleccionado === opcion
              return (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => manejarSeleccionCompaRatio(opcion)}
                  className={
                    activo
                      ? 'rounded border border-slate-800 bg-slate-800 px-4 py-2 text-sm font-medium text-white'
                      : 'rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400'
                  }
                >
                  {Math.round(opcion * 100)}%
                </button>
              )
            })}

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500" htmlFor="compa-ratio-personalizado">
                Personalizado:
              </label>
              <input
                id="compa-ratio-personalizado"
                type="number"
                step="any"
                min="0"
                placeholder="%"
                value={compaRatioPersonalizado}
                onChange={(evento) => setCompaRatioPersonalizado(evento.target.value)}
                className="w-20 rounded border border-slate-300 px-2 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">
            Beneficios adicionales
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {BENEFICIOS_DISPONIBLES.map((beneficio) => {
              const estado = beneficios[beneficio.clave]
              return (
                <div
                  key={beneficio.clave}
                  className="flex items-center justify-between gap-3 rounded border border-slate-200 px-3 py-2"
                >
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={estado.marcado}
                      onChange={(evento) =>
                        manejarCambioBeneficioMarcado(beneficio.clave, evento.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {beneficio.nombre}
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">USD</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      disabled={!estado.marcado}
                      value={estado.monto}
                      onChange={(evento) =>
                        manejarCambioBeneficioMonto(beneficio.clave, evento.target.value)
                      }
                      className="w-24 rounded border border-slate-300 px-2 py-1 text-sm text-slate-800 focus:border-slate-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!formularioValido}
            className="rounded bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Calcular paquete
          </button>
        </div>
      </form>
    </div>
  )
}

export default NuevaPropuesta
