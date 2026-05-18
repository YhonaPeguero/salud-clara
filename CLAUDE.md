## Reglas no-negociables de datos (este proyecto es de transparencia)

1. PROHIBIDO inventar, estimar, aproximar o completar cualquier cifra.
   Todo número en data/ debe venir de una fuente oficial descargada y
   quedar trazado en data/_data_audit.md. Si no hay dato real: null +
   motivo documentado. Ante la duda: null.
2. Unidad de análisis: presupuesto (DIPRES) y listas de espera
   (listaesperasalud.cl) son por SERVICIO DE SALUD, no por hospital.
   minsal_espera.json va indexado por servicio_salud_id. El hospital/
   comuna es solo puerta de entrada del buscador; lo que se muestra y
   etiqueta es el Servicio de Salud.
3. Tono descriptivo, cero veredictos. Nunca "hubo corrupción" / "promesa
   incumplida". Solo describir datos y dejar que el ciudadano juzgue.
4. URLs visibles (badges): home estable del organismo
   (https://www.dipres.gob.cl/ y https://www.listaesperasalud.cl/).
   Nunca rutas profundas de dipres.gob.cl (dan Not Found intermitente).
   Las rutas de descarga reales van en _data_audit.md como trazabilidad,
   no como link público. Badge sin URL válida = texto plano, no link.
5. El agente solo responde con datos del contexto inyectado; nunca
   produce cifras desde el modelo. API key solo en servidor.
6. Etiquetas de fecha/fuente se leen del dato, no se hardcodean. Usar
   el período real que entregue la fuente, no un valor por defecto.