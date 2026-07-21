import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto)
}

function formatearFecha(fechaIso) {
  if (!fechaIso) return ''
  const fecha = new Date(`${fechaIso}T00:00:00`)
  return fecha.toLocaleDateString('es-VE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const FORMULARIO_VACIO = {
  cargo: '',
  rubro: '',
  ciudad: '',
  mediana_salarial: '',
  fecha_referencia: '',
}

function ReferenciasMercado() {
  const [referencias, setReferencias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [busquedaCargo, setBusquedaCargo] = useState('')
  const [busquedaRubro, setBusquedaRubro] = useState('')

  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [referenciaEnEdicion, setReferenciaEnEdicion] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [guardandoFormulario, setGuardandoFormulario] = useState(false)
  const [errorFormulario, setErrorFormulario] = useState(null)

  const [eliminandoId, setEliminandoId] = useState(null)
  const [mensajeAccion, setMensajeAccion] = useState(null)

  useEffect(() => {
    let cancelado = false

    async function cargarReferencias() {
      setCargando(true)
      setError(null)
      try {
        const { data, error: errorSupabase } = await supabase
          .from('referencias_mercado')
          .select('*')
          .order('cargo')

        if (errorSupabase) throw errorSupabase

        if (!cancelado) setReferencias(data)
      } catch {
        if (!cancelado) {
          setError('No se pudieron cargar las referencias de mercado. Intenta de nuevo.')
        }
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    cargarReferencias()

    return () => {
      cancelado = true
    }
  }, [])

  const referenciasFiltradas = useMemo(() => {
    const cargo = busquedaCargo.trim().toLowerCase()
    const rubro = busquedaRubro.trim().toLowerCase()
    return referencias.filter((referencia) => {
      const coincideCargo = cargo === '' || referencia.cargo.toLowerCase().includes(cargo)
      const coincideRubro = rubro === '' || referencia.rubro.toLowerCase().includes(rubro)
      return coincideCargo && coincideRubro
    })
  }, [referencias, busquedaCargo, busquedaRubro])

  function abrirFormularioNuevo() {
    setReferenciaEnEdicion(null)
    setFormulario(FORMULARIO_VACIO)
    setErrorFormulario(null)
    setFormularioAbierto(true)
  }

  function abrirFormularioEdicion(referencia) {
    setReferenciaEnEdicion(referencia)
    setFormulario({
      cargo: referencia.cargo,
      rubro: referencia.rubro,
      ciudad: referencia.ciudad ?? '',
      mediana_salarial: referencia.mediana_salarial,
      fecha_referencia: referencia.fecha_referencia,
    })
    setErrorFormulario(null)
    setFormularioAbierto(true)
  }

  function cerrarFormulario() {
    setFormularioAbierto(false)
    setReferenciaEnEdicion(null)
    setFormulario(FORMULARIO_VACIO)
    setErrorFormulario(null)
  }

  function manejarCambioFormulario(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  async function manejarGuardarFormulario(evento) {
    evento.preventDefault()
    setErrorFormulario(null)
    setGuardandoFormulario(true)

    const referenciaGuardada = {
      cargo: formulario.cargo.trim(),
      rubro: formulario.rubro.trim(),
      ciudad: formulario.ciudad.trim() === '' ? null : formulario.ciudad.trim(),
      mediana_salarial: Number(formulario.mediana_salarial),
      moneda: 'USD',
      fecha_referencia: formulario.fecha_referencia,
    }

    try {
      if (referenciaEnEdicion) {
        const { data, error: errorSupabase } = await supabase
          .from('referencias_mercado')
          .update(referenciaGuardada)
          .eq('id', referenciaEnEdicion.id)
          .select()
          .single()

        if (errorSupabase) throw errorSupabase

        setReferencias((actuales) =>
          actuales.map((referencia) => (referencia.id === data.id ? data : referencia)),
        )
      } else {
        const { data, error: errorSupabase } = await supabase
          .from('referencias_mercado')
          .insert(referenciaGuardada)
          .select()
          .single()

        if (errorSupabase) throw errorSupabase

        setReferencias((actuales) => [...actuales, data])
      }

      cerrarFormulario()
    } catch {
      setErrorFormulario('No se pudo guardar la referencia. Intenta de nuevo.')
    } finally {
      setGuardandoFormulario(false)
    }
  }

  async function manejarEliminar(referencia) {
    const confirmado = window.confirm(
      `Eliminar la referencia de "${referencia.cargo}" (${referencia.rubro})? Esta accion no se puede deshacer.`,
    )
    if (!confirmado) return

    setMensajeAccion(null)
    setEliminandoId(referencia.id)
    try {
      const { error: errorSupabase } = await supabase
        .from('referencias_mercado')
        .delete()
        .eq('id', referencia.id)

      if (errorSupabase) throw errorSupabase

      setReferencias((actuales) => actuales.filter((r) => r.id !== referencia.id))
    } catch {
      setMensajeAccion({
        tipo: 'error',
        texto: 'No se pudo eliminar la referencia. Intenta de nuevo.',
      })
    } finally {
      setEliminandoId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Referencias de mercado</h1>
          <p className="mt-1 text-sm text-slate-500">
            Medianas salariales usadas para posicionar las propuestas.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirFormularioNuevo}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Agregar referencia
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:max-w-md">
        <input
          type="text"
          placeholder="Buscar por cargo"
          value={busquedaCargo}
          onChange={(evento) => setBusquedaCargo(evento.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Buscar por rubro"
          value={busquedaRubro}
          onChange={(evento) => setBusquedaRubro(evento.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
        />
      </div>

      {cargando && <p className="mt-6 text-sm text-slate-500">Cargando referencias...</p>}

      {!cargando && error && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!cargando && !error && mensajeAccion && (
        <p
          className={
            mensajeAccion.tipo === 'error'
              ? 'mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
              : 'mt-6 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700'
          }
        >
          {mensajeAccion.texto}
        </p>
      )}

      {!cargando && !error && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Cargo</th>
                <th className="px-4 py-3 font-medium">Rubro</th>
                <th className="px-4 py-3 font-medium">Ciudad</th>
                <th className="px-4 py-3 font-medium">Mediana</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {referenciasFiltradas.map((referencia) => (
                <tr key={referencia.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{referencia.cargo}</td>
                  <td className="px-4 py-3 text-slate-700">{referencia.rubro}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {referencia.ciudad ?? 'Nacional'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {referencia.moneda} {formatearMonto(referencia.mediana_salarial)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatearFecha(referencia.fecha_referencia)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => abrirFormularioEdicion(referencia)}
                        disabled={eliminandoId === referencia.id}
                        className="text-sm font-medium text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => manejarEliminar(referencia)}
                        disabled={eliminandoId === referencia.id}
                        className="text-sm font-medium text-red-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {eliminandoId === referencia.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {referenciasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No hay referencias que coincidan con la busqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {formularioAbierto && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-800">
              {referenciaEnEdicion ? 'Editar referencia' : 'Agregar referencia'}
            </h2>

            <form onSubmit={manejarGuardarFormulario} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600">Cargo</label>
                <input
                  type="text"
                  required
                  value={formulario.cargo}
                  onChange={(evento) => manejarCambioFormulario('cargo', evento.target.value)}
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
                  Ciudad (opcional, vacio = Nacional)
                </label>
                <input
                  type="text"
                  value={formulario.ciudad}
                  onChange={(evento) => manejarCambioFormulario('ciudad', evento.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600">
                  Mediana salarial (USD)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={formulario.mediana_salarial}
                  onChange={(evento) =>
                    manejarCambioFormulario('mediana_salarial', evento.target.value)
                  }
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600">
                  Fecha de referencia
                </label>
                <input
                  type="date"
                  required
                  value={formulario.fecha_referencia}
                  onChange={(evento) =>
                    manejarCambioFormulario('fecha_referencia', evento.target.value)
                  }
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
                  onClick={cerrarFormulario}
                  disabled={guardandoFormulario}
                  className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoFormulario}
                  className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardandoFormulario ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReferenciasMercado
