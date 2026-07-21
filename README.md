# CompaPack

Aplicacion web para consultores de compensacion y beneficios de la
consultora Izquierdo HR (Venezuela). Arma paquetes salariales posicionados
contra la mediana de mercado usando compa-ratio, y los guarda por cliente.

Proyecto final de la materia IA Aplicada, UCAB.

## Que problema resuelve

Cuando un consultor de compensacion arma una propuesta salarial para un
cliente, tiene que combinar a mano varios numeros: la mediana de mercado para
ese cargo, el compa-ratio con el que quiere posicionar al candidato, los
prorrateos de bono vacacional y utilidades, los aportes patronales, el
cestaticket y las retenciones del trabajador — todo en dolares y en bolivares
a la tasa del dia. CompaPack automatiza ese calculo, deja los parametros
(dias, porcentajes, tasa) editables desde una pantalla en vez de quemados en
una hoja de calculo, y guarda cada propuesta con los valores que se usaron en
el momento, para que no cambien si despues se actualizan los parametros.

## Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) (JavaScript, sin
  TypeScript)
- [Tailwind CSS](https://tailwindcss.com/) para estilos
- [Supabase](https://supabase.com/) (PostgreSQL) via `@supabase/supabase-js`
- [React Router](https://reactrouter.com/) para la navegacion entre pantallas
- Despliegue en [Netlify](https://www.netlify.com/)

## Como correrlo localmente

1. Clona el repositorio e instala las dependencias:

   ```
   npm install
   ```

2. Copia `.env.example` a `.env` y completa las credenciales de Supabase (ver
   seccion siguiente).

3. Arranca el servidor de desarrollo:

   ```
   npm run dev
   ```

   La app queda disponible en `http://localhost:5173`.

Otros comandos utiles:

- `npm run build` — genera la version de produccion en `dist/`.
- `npm run preview` — sirve localmente el build de produccion, para probarlo
  antes de desplegar.
- `npm run lint` — corre el linter (oxlint).

## Variables de entorno

CompaPack necesita un proyecto de Supabase con las tablas `clientes`,
`referencias_mercado`, `parametros_calculo` y `propuestas` ya creadas. Las
credenciales se leen de variables de entorno con prefijo `VITE_` (asi Vite
las expone al codigo del navegador):

```
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
```

Estos valores se consiguen en el panel de Supabase, en **Settings → API**.
Nunca se suben al repositorio: `.env` esta en `.gitignore` y solo
`.env.example` (con las variables vacias) se versiona.

En Netlify, estas mismas dos variables se configuran en **Site settings →
Environment variables** del sitio.

## Despliegue en Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- El archivo `public/_redirects` ya esta incluido y se copia al build; sin
  el, recargar una pantalla interna (por ejemplo `/configuracion`) daria un
  404 porque Netlify buscaria ese archivo en el servidor en vez de dejar que
  React Router lo maneje en el navegador.

## Limitacion de seguridad del prototipo

Este es un prototipo academico: la base de datos usa Row Level Security
(RLS) abierto con la clave publica (`anon key`), sin sistema de login. En la
practica esto significa que **cualquiera con la URL del sitio y la anon key
puede leer y escribir en las cuatro tablas**, sin distinguir de que
consultor son los datos.

El siguiente paso antes de un uso real seria agregar
[Supabase Auth](https://supabase.com/docs/guides/auth) con una cuenta por
consultor, y politicas de RLS que solo permitan a cada quien ver y modificar
sus propios clientes y propuestas.
