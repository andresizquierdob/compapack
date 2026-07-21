import { useEffect, useState } from 'react'
import { obtenerParametrosCalculoMock } from '../data/mock.js'

// Como mostrar y editar cada parametro segun su clave. `unidad` controla el
// texto que se ve junto al campo; `tipo` controla como se convierte el valor
// entre lo que el usuario escribe y lo que se guarda internamente.
const UNIDAD_POR_CLAVE = {
  tasa_bcv: { unidad: 'Bs/USD', tipo: 'monto' },
  dias_bono_vacacional: { unidad: 'dias', tipo: 'dias' },
  dias_utilidades: { unidad: 'dias', tipo: 'dias' },
  cestaticket: { unidad: 'USD', tipo: 'monto' },
  ivss_patronal: { unidad: '%', tipo: 'porcentaje' },
  rpe_patronal: { unidad: '%', tipo: 'porcentaje' },
  faov_patronal: { unidad: '%', tipo: 'porcentaje' },
  inces_patronal: { unidad: '%', tipo: 'porcentaje' },
  ivss_trabajador: { unidad: '%', tipo: 'porcentaje' },
  rpe_trabajador: { unidad: '%', tipo: 'porcentaje' },
  faov_trabajador: { unidad: '%', tipo: 'porcentaje' },
}

// Convierte el valor guardado (fraccion decimal para porcentajes) al numero
// que se muestra en el campo de edicion (9 en vez de 0.09).
function valorParaCampo(parametro) {
  const config = UNIDAD_POR_CLAVE[parametro.clave]
  if (config?.tipo === 'porcentaje') {
    return parametro.valor * 100
  }
  return parametro.valor
}

// Convierte lo que el usuario escribio de vuelta al formato interno (0.09 en
// vez de 9) antes de guardarlo en el estado.
function campoAValor(clave, valorCampo) {
  const config = UNIDAD_POR_CLAVE[clave]
  if (config?.tipo === 'porcentaje') {
    return valorCampo / 100
  }
  return valorCampo
}

function Configuracion() {
  const [parametros, setParametros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensajeGuardado, setMensajeGuardado] = useState(null)

  useEffect(() => {
    let cancelado = false

    async function cargarParametros() {
      setCargando(true)
      setError(null)
      try {
        const datos = await obtenerParametrosCalculoMock()
        if (!cancelado) {
          setParametros(datos)
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
  }, [])

  function manejarCambioCampo(id, clave, textoCampo) {
    setMensajeGuardado(null)
    const numero = textoCampo === '' ? '' : Number(textoCampo)

    setParametros((actuales) =>
      actuales.map((parametro) => {
        if (parametro.id !== id) return parametro
        return {
          ...parametro,
          valor: textoCampo === '' ? '' : campoAValor(clave, numero),
        }
      }),
    )
  }

  async function manejarGuardar() {
    setGuardando(true)
    setMensajeGuardado(null)
    try {
      // Todavia no hay Supabase conectado: por ahora solo se simula el
      // guardado. Cuando exista la tabla real, aqui se hara el update.
      await new Promise((resolve) => setTimeout(resolve, 300))
      setMensajeGuardado({ tipo: 'ok', texto: 'Cambios guardados.' })
    } catch {
      setMensajeGuardado({
        tipo: 'error',
        texto: 'No se pudieron guardar los cambios. Intenta de nuevo.',
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Configuracion</h1>
      <p className="mt-1 text-sm text-slate-500">
        Estos valores se usan para calcular todas las propuestas nuevas. Las
        propuestas ya guardadas no cambian si editas algo aqui.
      </p>

      {cargando && (
        <p className="mt-6 text-sm text-slate-500">Cargando parametros...</p>
      )}

      {!cargando && error && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!cargando && !error && (
        <>
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Parametro</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Unidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parametros.map((parametro) => {
                  const config = UNIDAD_POR_CLAVE[parametro.clave]
                  return (
                    <tr key={parametro.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">
                        {parametro.descripcion}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="any"
                          value={
                            parametro.valor === ''
                              ? ''
                              : valorParaCampo(parametro)
                          }
                          onChange={(evento) =>
                            manejarCambioCampo(
                              parametro.id,
                              parametro.clave,
                              evento.target.value,
                            )
                          }
                          className="w-32 rounded border border-slate-300 px-2 py-1 text-slate-800 focus:border-slate-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {config?.unidad ?? ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={manejarGuardar}
              disabled={guardando}
              className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>

            {mensajeGuardado && (
              <span
                className={
                  mensajeGuardado.tipo === 'ok'
                    ? 'text-sm text-green-700'
                    : 'text-sm text-red-700'
                }
              >
                {mensajeGuardado.texto}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Configuracion
