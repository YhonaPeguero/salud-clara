# Auditoría de Datos

Actualización: 2026-05-17

## Alcance

Archivos actualizados:

- `data/dipres_ejecucion.json`
- `data/minsal_espera.json`

Archivo creado:

- `data/_data_audit.md`

No se modificó `data/mapping.json`. Se ajustó una aserción de tipo en `src/lib/search.ts` para aceptar `fecha_corte: null` en la metadata raíz de MINSAL; no cambia la lógica de búsqueda.

## DIPRES

Fuente principal: https://www.dipres.gob.cl/597/w3-multipropertyvalues-15149-35869.html

Documento auxiliar de unidad: https://www.dipres.gob.cl/597/articles-325502_doc_xls.xls

Método aplicado:

- Para cada Servicio de Salud se usó el XML oficial de DIPRES de ejecución 2024, `Informe Ejecución Capítulo Cuarto Trimestre [Pesos]`.
- Se extrajo la fila XML con `<nombre>GASTOS</nombre>`.
- `presupuesto_inicial_MM` viene de `<formulado>` dividido por 1.000.
- `presupuesto_vigente_MM` viene de `<vigente>` dividido por 1.000.
- `devengado_MM` viene de `<monto>` dividido por 1.000.
- `pct_ejecucion` se deriva como `devengado_MM / presupuesto_vigente_MM * 100`.
- `poblacion_beneficiaria_aprox` queda `null` porque no se parseó una fuente oficial para ese campo.

Reproducción usada:

```bash
node -e "const fs=require('fs'); const current=JSON.parse(fs.readFileSync('data/dipres_ejecucion.json','utf8')); const ids={ss_arica_parinacota:'359477',ss_tarapaca:'359478',ss_antofagasta:'359479',ss_atacama:'359480',ss_coquimbo:'359481',ss_valparaiso_sa:'359482',ss_vina_quillota:'359483',ss_aconcagua:'359484',ss_ohiggins:'359485',ss_maule:'359486',ss_nuble:'359487',ss_talcahuano:'359489',ss_biobio:'359490',ss_arauco:'359491',ss_araucania_norte:'359492',ss_araucania_sur:'359493',ss_osorno:'359494',ss_valdivia:'359495',ss_reloncavi:'359496',ss_aysen:'359497',ss_magallanes:'359498',ss_metro_oriente:'359499',ss_metro_central:'359500',ss_metro_sur:'359501',ss_metro_norte:'359502',ss_metro_occidente:'359503',ss_metro_sur_oriente:'359504',ss_chiloe:'359508'}; (async()=>{for (const key of Object.keys(current.servicios)){const id=ids[key]; const url='https://www.dipres.gob.cl/597/articles-'+id+'_doc_xml.xml'; const t=await (await fetch(url)).text(); const m=t.match(/<nombre>GASTOS<\/nombre>\s*<formulado>(\d+)<\/formulado>\s*<vigente>(\d+)<\/vigente>\s*<monto>(\d+)<\/monto>/); if(!m) throw new Error('No GASTOS '+key); console.log(key,id,m.slice(1).join(','));}})();"
```

Valores extraídos y escritos:

| key | fuente | formulado raw | vigente raw | monto raw | presupuesto_inicial_MM | presupuesto_vigente_MM | devengado_MM |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ss_metro_norte | https://www.dipres.gob.cl/597/articles-359502_doc_xml.xml | 427880061 | 525783321 | 527941834 | 427880.061 | 525783.321 | 527941.834 |
| ss_metro_occidente | https://www.dipres.gob.cl/597/articles-359503_doc_xml.xml | 631846749 | 827149757 | 824603835 | 631846.749 | 827149.757 | 824603.835 |
| ss_metro_central | https://www.dipres.gob.cl/597/articles-359500_doc_xml.xml | 487879975 | 647457121 | 647393664 | 487879.975 | 647457.121 | 647393.664 |
| ss_metro_oriente | https://www.dipres.gob.cl/597/articles-359499_doc_xml.xml | 580107422 | 659051966 | 659583209 | 580107.422 | 659051.966 | 659583.209 |
| ss_metro_sur | https://www.dipres.gob.cl/597/articles-359501_doc_xml.xml | 596337283 | 670520149 | 671620307 | 596337.283 | 670520.149 | 671620.307 |
| ss_metro_sur_oriente | https://www.dipres.gob.cl/597/articles-359504_doc_xml.xml | 773499964 | 1024840526 | 968896454 | 773499.964 | 1024840.526 | 968896.454 |
| ss_valparaiso_sa | https://www.dipres.gob.cl/597/articles-359482_doc_xml.xml | 315950983 | 423580539 | 417512991 | 315950.983 | 423580.539 | 417512.991 |
| ss_vina_quillota | https://www.dipres.gob.cl/597/articles-359483_doc_xml.xml | 507920723 | 718600855 | 730342934 | 507920.723 | 718600.855 | 730342.934 |
| ss_aconcagua | https://www.dipres.gob.cl/597/articles-359484_doc_xml.xml | 170092144 | 196038798 | 196192999 | 170092.144 | 196038.798 | 196192.999 |
| ss_ohiggins | https://www.dipres.gob.cl/597/articles-359485_doc_xml.xml | 442364453 | 528172985 | 528297251 | 442364.453 | 528172.985 | 528297.251 |
| ss_maule | https://www.dipres.gob.cl/597/articles-359486_doc_xml.xml | 620087712 | 742364045 | 721010413 | 620087.712 | 742364.045 | 721010.413 |
| ss_nuble | https://www.dipres.gob.cl/597/articles-359487_doc_xml.xml | 288264400 | 473275052 | 468228411 | 288264.4 | 473275.052 | 468228.411 |
| ss_biobio | https://www.dipres.gob.cl/597/articles-359490_doc_xml.xml | 270003651 | 335568694 | 336843690 | 270003.651 | 335568.694 | 336843.69 |
| ss_talcahuano | https://www.dipres.gob.cl/597/articles-359489_doc_xml.xml | 248529147 | 351077922 | 349906021 | 248529.147 | 351077.922 | 349906.021 |
| ss_arauco | https://www.dipres.gob.cl/597/articles-359491_doc_xml.xml | 116251394 | 173281266 | 168797602 | 116251.394 | 173281.266 | 168797.602 |
| ss_araucania_norte | https://www.dipres.gob.cl/597/articles-359492_doc_xml.xml | 180430464 | 216272384 | 216670328 | 180430.464 | 216272.384 | 216670.328 |
| ss_araucania_sur | https://www.dipres.gob.cl/597/articles-359493_doc_xml.xml | 541927163 | 717530046 | 717486588 | 541927.163 | 717530.046 | 717486.588 |
| ss_valdivia | https://www.dipres.gob.cl/597/articles-359495_doc_xml.xml | 263737732 | 336251698 | 335758699 | 263737.732 | 336251.698 | 335758.699 |
| ss_osorno | https://www.dipres.gob.cl/597/articles-359494_doc_xml.xml | 170119684 | 233202725 | 231642463 | 170119.684 | 233202.725 | 231642.463 |
| ss_reloncavi | https://www.dipres.gob.cl/597/articles-359496_doc_xml.xml | 305484363 | 420597138 | 413815401 | 305484.363 | 420597.138 | 413815.401 |
| ss_chiloe | https://www.dipres.gob.cl/597/articles-359508_doc_xml.xml | 162538684 | 249505307 | 245935916 | 162538.684 | 249505.307 | 245935.916 |
| ss_aysen | https://www.dipres.gob.cl/597/articles-359497_doc_xml.xml | 141958702 | 191495046 | 191429522 | 141958.702 | 191495.046 | 191429.522 |
| ss_magallanes | https://www.dipres.gob.cl/597/articles-359498_doc_xml.xml | 173914220 | 220243034 | 220513422 | 173914.22 | 220243.034 | 220513.422 |
| ss_coquimbo | https://www.dipres.gob.cl/597/articles-359481_doc_xml.xml | 432496310 | 556234505 | 557891657 | 432496.31 | 556234.505 | 557891.657 |
| ss_atacama | https://www.dipres.gob.cl/597/articles-359480_doc_xml.xml | 173934129 | 215277595 | 215160790 | 173934.129 | 215277.595 | 215160.79 |
| ss_antofagasta | https://www.dipres.gob.cl/597/articles-359479_doc_xml.xml | 334593216 | 396531471 | 394774585 | 334593.216 | 396531.471 | 394774.585 |
| ss_tarapaca | https://www.dipres.gob.cl/597/articles-359478_doc_xml.xml | 234148250 | 302420241 | 297283957 | 234148.25 | 302420.241 | 297283.957 |
| ss_arica_parinacota | https://www.dipres.gob.cl/597/articles-359477_doc_xml.xml | 145136875 | 170219477 | 166332355 | 145136.875 | 170219.477 | 166332.355 |

Campos DIPRES en `null`:

- `poblacion_beneficiaria_aprox`: sin fuente oficial parseada en esta carga para los 28 servicios.

## MINSAL

Fuente principal verificada: https://www.listaesperasalud.cl/

El visor oficial de la Subsecretaría de Redes Asistenciales (`listaesperasalud.cl`) carga sus gráficos desde JSONs estáticos publicados en la misma página, uno por Servicio de Salud, accesibles públicamente sin autenticación.

Patrón de URL descubierto inspeccionando el código de `index.html` (script inline que llama a `fetch('data/data_SERVICIO_DE_SALUD_<NOMBRE_NORMALIZADO>.json')`):

```
https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_<NOMBRE_NORMALIZADO>.json
```

Donde `<NOMBRE_NORMALIZADO>` es el nombre del Servicio de Salud en mayúsculas, espacios → `_`, tildes y `Ñ` removidas (`Á→A, É→E, Í→I, Ó→O, Ú→U, Ñ→N`).

Esta fuente sí cumple la regla #2 de CLAUDE.md (unidad = Servicio de Salud) y se descartaron el dominio antiguo `visortiemposespera.minsal.cl` (no resuelve) y el visor PBI embebido (`app.powerbi.com/view?r=...`) por no exponer descarga oficial parseable.

Método aplicado a los 28 Servicios de Salud:

- Se descargó el JSON de cada SS.
- Cada JSON contiene una serie histórica trimestral desde `MARZO 2019` hasta `JUNIO 2025` (26 trimestres).
- Se tomó la fila del último trimestre como cifras vigentes.
- `espera_cirugia` = `quirurgica_pacientes` del último trimestre.
- `espera_consulta_especialidad` = `consulta_pacientes` del último trimestre.
- `variacion_cirugia_pct` = variación interanual contra el mismo trimestre del año anterior (`JUNIO 2024`), calculada como `(actual − previo) / previo × 100`, redondeada a 2 decimales.
- `variacion_consulta_pct` = lo mismo para consultas de especialidad. **En los 28 SS este valor queda `null` porque la fuente entrega `consulta_pacientes = null` en el trimestre comparativo JUNIO 2024**, motivo por el cual no es posible calcular variación honesta. La cifra absoluta sí está disponible.
- `fecha_corte` = `"JUNIO 2025"` en los 28 (coincide en la raíz del archivo).

Reproducción usada:

```bash
node -e "(async()=>{
  const services = ['METROPOLITANO_NORTE','METROPOLITANO_OCCIDENTE','METROPOLITANO_CENTRAL','METROPOLITANO_ORIENTE','METROPOLITANO_SUR','METROPOLITANO_SUR_ORIENTE','VALPARAISO-SAN_ANTONIO','VINA_DEL_MAR-QUILLOTA','ACONCAGUA','O’HIGGINS','DEL_MAULE','NUBLE','BIOBIO','TALCAHUANO','ARAUCO','ARAUCANIA_NORTE','ARAUCANIA_SUR','LOS_RIOS','OSORNO','DEL_RELONCAVI','CHILOE','AYSEN','MAGALLANES','COQUIMBO','ATACAMA','ANTOFAGASTA','TARAPACA','ARICA_Y_PARINACOTA'];
  for (const n of services){
    const url='https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_'+n+'.json';
    const arr=await (await fetch(url)).json();
    const last=arr[arr.length-1], yoy=arr[arr.length-5];
    console.log(n, last.trimestre, 'qpac=', last.quirurgica_pacientes, 'cpac=', last.consulta_pacientes, '|YoY', yoy.trimestre, yoy.quirurgica_pacientes, yoy.consulta_pacientes);
  }
})()"
```

Valores extraídos y escritos (filas raw de la fuente):

| key | url | fecha_corte | last_quirurgica_pacientes | last_consulta_pacientes | yoy_trimestre | yoy_quirurgica_pacientes | yoy_consulta_pacientes |
|---|---|---|---:|---:|---|---:|---:|
| ss_arica_parinacota | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_ARICA_Y_PARINACOTA.json | JUNIO 2025 | 5457 | 35384 | JUNIO 2024 | 4376 | null |
| ss_tarapaca | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_TARAPACA.json | JUNIO 2025 | 5799 | 49785 | JUNIO 2024 | 5805 | null |
| ss_antofagasta | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_ANTOFAGASTA.json | JUNIO 2025 | 6598 | 72818 | JUNIO 2024 | 7693 | null |
| ss_atacama | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_ATACAMA.json | JUNIO 2025 | 5700 | 35461 | JUNIO 2024 | 4386 | null |
| ss_coquimbo | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_COQUIMBO.json | JUNIO 2025 | 20304 | 119096 | JUNIO 2024 | 14453 | null |
| ss_valparaiso_sa | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_VALPARAISO-SAN_ANTONIO.json | JUNIO 2025 | 13028 | 56631 | JUNIO 2024 | 11214 | null |
| ss_vina_quillota | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_VINA_DEL_MAR-QUILLOTA.json | JUNIO 2025 | 15648 | 125522 | JUNIO 2024 | 14494 | null |
| ss_aconcagua | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_ACONCAGUA.json | JUNIO 2025 | 7473 | 25280 | JUNIO 2024 | 7842 | null |
| ss_metro_norte | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_METROPOLITANO_NORTE.json | JUNIO 2025 | 15634 | 120191 | JUNIO 2024 | 14745 | null |
| ss_metro_occidente | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_METROPOLITANO_OCCIDENTE.json | JUNIO 2025 | 14883 | 140707 | JUNIO 2024 | 10987 | null |
| ss_metro_central | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_METROPOLITANO_CENTRAL.json | JUNIO 2025 | 13381 | 95881 | JUNIO 2024 | 11968 | null |
| ss_metro_oriente | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_METROPOLITANO_ORIENTE.json | JUNIO 2025 | 15104 | 79787 | JUNIO 2024 | 14280 | null |
| ss_metro_sur | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_METROPOLITANO_SUR.json | JUNIO 2025 | 17216 | 148099 | JUNIO 2024 | 14398 | null |
| ss_metro_sur_oriente | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_METROPOLITANO_SUR_ORIENTE.json | JUNIO 2025 | 22166 | 139933 | JUNIO 2024 | 19059 | null |
| ss_ohiggins | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_O’HIGGINS.json | JUNIO 2025 | 27526 | 105164 | JUNIO 2024 | 29198 | null |
| ss_maule | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_DEL_MAULE.json | JUNIO 2025 | 23931 | 131977 | JUNIO 2024 | 24077 | null |
| ss_nuble | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_NUBLE.json | JUNIO 2025 | 14133 | 74949 | JUNIO 2024 | 11098 | null |
| ss_biobio | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_BIOBIO.json | JUNIO 2025 | 19618 | 69065 | JUNIO 2024 | 14941 | null |
| ss_talcahuano | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_TALCAHUANO.json | JUNIO 2025 | 8195 | 51408 | JUNIO 2024 | 7141 | null |
| ss_arauco | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_ARAUCO.json | JUNIO 2025 | 3788 | 31326 | JUNIO 2024 | 3633 | null |
| ss_araucania_norte | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_ARAUCANIA_NORTE.json | JUNIO 2025 | 3638 | 43466 | JUNIO 2024 | 3555 | null |
| ss_araucania_sur | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_ARAUCANIA_SUR.json | JUNIO 2025 | 24879 | 171848 | JUNIO 2024 | 19131 | null |
| ss_valdivia | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_LOS_RIOS.json | JUNIO 2025 | 7110 | 58997 | JUNIO 2024 | 6646 | null |
| ss_osorno | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_OSORNO.json | JUNIO 2025 | 8764 | 32330 | JUNIO 2024 | 7105 | null |
| ss_reloncavi | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_DEL_RELONCAVI.json | JUNIO 2025 | 16238 | 80072 | JUNIO 2024 | 15843 | null |
| ss_chiloe | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_CHILOE.json | JUNIO 2025 | 4829 | 27480 | JUNIO 2024 | 4947 | null |
| ss_aysen | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_AYSEN.json | JUNIO 2025 | 1577 | 15396 | JUNIO 2024 | 1508 | null |
| ss_magallanes | https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_MAGALLANES.json | JUNIO 2025 | 3168 | 26129 | JUNIO 2024 | 2949 | null |

Campos MINSAL en `null` por motivo:

- `variacion_consulta_pct` para los 28 servicios: la fuente oficial entrega `consulta_pacientes = null` en JUNIO 2024 (el trimestre comparativo). No se calcula variación si falta el dato base.
- `establecimientos.*.espera_*` y demás métricas a nivel hospital: la fuente oficial NO publica desagregado por establecimiento, solo por Servicio de Salud (que es la unidad correcta por regla #2). El mapeo hospital→servicio se mantiene en `establecimientos` solo para la búsqueda por nombre.

## Fragmentos de Fuente

Fragmento 1, unidad presupuestaria en Ley de Presupuestos 2024, Partida Ministerio de Salud:

```text
LEY DE PRESUPUESTOS AÑO 2024
Partida: Ministerio de Salud
Miles de $
```

Fragmento 2, XML DIPRES para `ss_metro_norte`:

```xml
<nombre>SERVICIO DE SALUD METROPOLITANO NORTE</nombre>
...
<nombre>GASTOS</nombre>
<formulado>427880061</formulado>
<vigente>525783321</vigente>
<monto>527941834</monto>
```

Fragmento 3, CSV DIPRES para `ss_metro_norte`:

```text
Partida;Capítulo;Subtítulo;Moneda;Denominación;Presupuesto Inicial;Presupuesto Vigente;Ejecución Acumulada a Cuarto Trimestre
16;45;21;P;GASTOS EN PERSONAL;191004539;210975336;210792064
```

Fragmento 4, fila cruda del JSON oficial para `ss_metro_norte` (corte JUNIO 2025), tal como la sirve `listaesperasalud.cl`:

```json
{
  "servicio": "METROPOLITANO_NORTE",
  "trimestre": "JUNIO 2025",
  "ges_registros": 8446,
  "consulta_registros": 145975,
  "quirurgica_registros": 17331,
  "ges_pacientes": null,
  "consulta_pacientes": 120191,
  "quirurgica_pacientes": 15634,
  "ges_promedio": null,
  "consulta_promedio": 621,
  "quirurgica_promedio": 422
}
```

Fragmento 5, fila cruda comparativa JUNIO 2024 para `ss_metro_norte` (muestra por qué `variacion_consulta_pct` queda en `null`):

```json
{
  "servicio": "METROPOLITANO_NORTE",
  "trimestre": "JUNIO 2024",
  "consulta_pacientes": null,
  "quirurgica_pacientes": 14745
}
```

## Notas de Integridad

- No se inventaron valores para campos sin fuente oficial parseada.
- Las cifras MINSAL son agregadas a nivel **Servicio de Salud**, no a nivel hospital — lo cual es la unidad correcta según regla #2 de CLAUDE.md y según la propia fuente oficial. La UI rotula explícitamente "Lista de espera de toda la red", para que el usuario no confunda la cifra con una métrica del hospital individual.
- Variaciones interanuales: si la fuente oficial entrega `null` en el trimestre comparativo (caso `consulta_pacientes` en JUNIO 2024), la variación queda en `null`. No se interpoló con vecinos ni se estimó.
- Se mantuvieron las claves existentes de servicios y establecimientos, con una sola corrección documentada: el registro previo `hosp_paula_jaraquemada` mezclaba dos hospitales distintos (Paula Jaraquemada, hoy reconvertido, dependía de SS Metro Central; Hospital Dr. Exequiel González Cortés, pediátrico en San Miguel, depende de SS Metro Sur). Se renombró el id a `hosp_exequiel_gonzalez_cortes` y se reclasificó a `ss_metro_sur` con comuna San Miguel. Verificado contra la propia institución: `https://www.hegc.gob.cl/` reporta literalmente "SERVICIO DE SALUD SUR HOSPITAL EXEQUIEL".
- `ss_valdivia` conserva su clave histórica del proyecto, pero el XML DIPRES oficial y el JSON MINSAL usados corresponden a `SERVICIO DE SALUD LOS RÍOS`.
