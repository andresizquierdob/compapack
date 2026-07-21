import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto)
}

function formatearFecha(fechaIso) {
  return new Date(fechaIso).toLocaleDateString('es-VE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const FORMULARIO_VACIO = { nombre_empresa: '', rubro: '', ciudad: '' }

function Inicio() {
  const [clientes, setClientes] = useState([])
  const [propuestas, setPropuestas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [clienteExpandidoId, setClienteExpandidoId] = useState(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [guardandoCliente, setGuardandoCliente] = useState(false)
  const [errorFormulario, setErrorFormulario] = useState(null)

  useEffect(() => {
    let cancelado = false

    async function cargarDatos() {
      setCargando(true)
      setError(null)
      try {
        const [resultadoClientes, resultadoPropuestas] = await Promise.all([
          supabase.from('clientes').select('*').order('nombre_empresa'),
          supabase.from('propuestas').select('*').order('created_at', { ascending: false }),
        ])

        if (resultadoClientes.error) throw resultadoClientes.error
        if (resultadoPropuestas.error) throw resultadoPropuestas.error

        if (!cancelado) {
          setClientes(resultadoClientes.data)
          setPropuestas(resultadoPropuestas.data)
        }
      } catch {
        if (!cancelado) {
          setError('No se pudieron cargar los clientes. Intenta de nuevo.')
        }
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    cargarDatos()

    return () => {
      cancelado = true
    }
  }, [])

  const propuestasPorCliente = useMemo(() => {
    const mapa = new Map()
    propuestas.forEach((propuesta) => {
      const lista = mapa.get(propuesta.cliente_id) ?? []
      lista.push(propuesta)
      mapa.set(propuesta.cliente_id, lista)
    })
    mapa.forEach((lista) => {
      lista.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    })
    return mapa
  }, [propuestas])

  function alternarCliente(clienteId) {
    setClienteExpandidoId((actual) => (actual === clienteId ? null : clienteId))
  }

  function manejarCambioFormulario(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  async function manejarAgregarCliente(evento) {
    evento.preventDefault()
    setErrorFormulario(null)
    setGuardandoCliente(true)

    const clienteNuevo = {
      nombre_empresa: formulario.nombre_empresa.trim(),
      rubro: formulario.rubro.trim(),
      ciudad: formulario.ciudad.trim() === '' ? null : formulario.ciudad.trim(),
    }

    try {
      const { data, error: errorSupabase } = await supabase
        .from('clientes')
        .insert(clienteNuevo)
        .select()
        .single()

      if (errorSupabase) throw errorSupabase

      setClientes((actuales) =>
        [...actuales, data].sort((a, b) => a.nombre_empresa.localeCompare(b.nombre_empresa)),
      )
      setFormulario(FORMULARIO_VACIO)
      setFormularioAbierto(false)
    } catch {
      setErrorFormulario('No se pudo guardar el cliente. Intenta de nuevo.')
    } finally {
      setGuardandoCliente(false)
    }
  }

  function cerrarFormularioCliente() {
    setFormularioAbierto(false)
    setFormulario(FORMULARIO_VACIO)
    setErrorFormulario(null)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Propuestas salariales guardadas por cliente.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setErrorFormulario(null)
              setFormularioAbierto(true)
            }}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
          >
            Agregar cliente
          </button>
          <Link
            to="/nueva"
            className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Nueva propuesta
          </Link>
        </div>
      </div>

      {cargando && <p className="mt-6 text-sm text-slate-500">Cargando clientes...</p>}

      {!cargando && error && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!cargando && !error && clientes.length === 0 && (
        <div className="mt-10 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-700">Todavia no tienes clientes registrados.</p>
          <button
            type="button"
            onClick={() => setFormularioAbierto(true)}
            className="mt-4 rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Agregar tu primer cliente
          </button>
        </div>
      )}

      {!cargando && !error && clientes.length > 0 && (
        <div className="mt-6 space-y-3">
          {clientes.map((cliente) => {
            const propuestasCliente = propuestasPorCliente.get(cliente.id) ?? []
            const expandido = clienteExpandidoId === cliente.id

            return (
              <div
                key={cliente.id}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => alternarCliente(cliente.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-4 text-left hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{cliente.nombre_empresa}</p>
                    <p className="text-sm text-slate-500">
                      {cliente.rubro} &middot; {cliente.ciudad ?? 'Nacional'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {propuestasCliente.length}{' '}
                      {propuestasCliente.length === 1 ? 'propuesta' : 'propuestas'}
                    </span>
                    <span className="text-slate-400">{expandido ? '−' : '+'}</span>
                  </div>
                </button>

                {expandido && (
                  <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                    {propuestasCliente.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        Aun no hay propuestas guardadas para este cliente.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="text-slate-500">
                            <tr>
                              <th className="py-1 pr-4 font-medium">Cargo</th>
                              <th className="py-1 pr-4 font-medium">Compa-ratio</th>
                              <th className="py-1 pr-4 font-medium">Costo empresa</th>
                              <th className="py-1 pr-4 font-medium">Fecha</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {propuestasCliente.map((propuesta) => (
                              <tr key={propuesta.id}>
                                <td className="py-2 pr-4 text-slate-700">{propuesta.cargo}</td>
                                <td className="py-2 pr-4 text-slate-700">
                                  {Math.round(propuesta.compa_ratio * 100)}%
                                </td>
                                <td className="py-2 pr-4 text-slate-700">
                                  USD {formatearMonto(propuesta.costo_empresa_total)}
                                </td>
                                <td className="py-2 pr-4 text-slate-500">
                                  {formatearFecha(propuesta.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {formularioAbierto && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-800">Agregar cliente</h2>

            <form onSubmit={manejarAgregarCliente} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600">
                  Nombre de la empresa
                </label>
                <input
                  type="text"
                  required
                  value={formulario.nombre_empresa}
                  onChange={(evento) =>
                    manejarCambioFormulario('nombre_empresa', evento.target.value)
                  }
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600">Rubro</label>
                <input
                  type="text"
                  required
                  value={formulario.rubro}
                  onChange={(evento) => manejarCambioFormulario('rubro', evento.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600">
                  Ciudad (opcional)
                </label>
                <input
                  type="text"
                  value={formulario.ciudad}
                  onChange={(evento) => manejarCambioFormulario('ciudad', evento.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
                />
              </div>

              {errorFormulario && (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorFormulario}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrarFormularioCliente}
                  disabled={guardandoCliente}
                  className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCliente}
                  className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardandoCliente ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inicio
