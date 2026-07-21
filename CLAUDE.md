# CompaPack

Aplicacion web para consultores de compensacion y beneficios de la consultora
Izquierdo HR (Venezuela). Arma paquetes salariales posicionados contra la
mediana de mercado usando compa-ratio, y los guarda por cliente.
Proyecto final de la materia IA Aplicada, UCAB. Autor: Andres.

## Stack (no cambiar sin que yo lo pida)
- Vite + React + JavaScript (NO TypeScript)
- Tailwind CSS para estilos
- Supabase (PostgreSQL) via @supabase/supabase-js
- Despliegue en Netlify
- Toda la interfaz en espanol

## Reglas de trabajo
- Explica en espanol y sin jerga: soy principiante absoluto.
- Cambios pequenos e incrementales, un tema por vez.
- Antes de un cambio grande, dime en pocas palabras que vas a hacer y espera mi ok.
- NINGUN valor de calculo va quemado en el codigo. Los porcentajes, dias, tasa y
  cestaticket se leen SIEMPRE de la tabla parametros_calculo y son editables por
  el usuario desde una pantalla de Configuracion.
- Las credenciales van en variables de entorno (VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY). Jamas en el codigo ni en los commits.
- Cada pantalla maneja estado de carga y estado de error con mensajes claros.
- Formatea los montos con separador de miles y 2 decimales.

## Tablas en Supabase
- clientes(id, nombre_empresa, rubro, ciudad, created_at)
- referencias_mercado(id, cargo, rubro, ciudad, mediana_salarial, moneda,
  fecha_referencia, created_at)
- parametros_calculo(id, clave, valor, descripcion, actualizado_en)
- propuestas(id, cliente_id, cargo, rubro, ciudad, mediana_usada, compa_ratio,
  salario_base, beneficios jsonb, parametros_usados jsonb, costo_empresa_total,
  neto_estimado, tasa_usada, notas, created_at)

## Logica de calculo (fuente de verdad)
1. salario_base = mediana_mercado * compa_ratio
2. bono_vacacional_anual = (salario_base / 30) * dias_bono_vacacional
3. utilidades_anuales = (salario_base / 30) * dias_utilidades
4. prorrateo_mensual = (bono_vacacional_anual + utilidades_anuales) / 12
5. aportes_patronales = salario_base * (ivss + rpe + faov + inces) patronales
6. beneficios_adicionales = suma de beneficios marcados
7. costo_empresa_mensual = salario_base + prorrateo_mensual + cestaticket
   + aportes_patronales + beneficios_adicionales
8. retenciones_trabajador = salario_base * (ivss + rpe + faov) del trabajador
9. neto_trabajador = salario_base - retenciones_trabajador + cestaticket
10. Cada monto se muestra en USD y en Bs usando parametros_calculo.tasa_bcv

Todos los porcentajes, dias, cestaticket y tasa vienen de parametros_calculo.
Cada propuesta guarda en parametros_usados y tasa_usada los valores del momento
en que se creo: las propuestas historicas NO cambian si luego edito parametros.

## Pantallas
1. Inicio: lista de clientes y sus propuestas guardadas
2. Nueva propuesta: elegir cliente, cargo, rubro, ciudad y compa-ratio objetivo
3. Resultados: salario posicionado y desglose (costo empresa / neto, USD y Bs)
4. Comparacion de escenarios: varios compa-ratios lado a lado
5. Referencias de mercado: administrar las medianas por cargo/rubro/ciudad
6. Configuracion: editar los valores de parametros_calculo (tasa, dias, %)
