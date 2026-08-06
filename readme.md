# Travel Journal

Este proyecto es un diario visual de viajes que muestra los destinos desde archivos JSON.

## Editar contenido

La edición principal se realiza en estos archivos:

- [data/countries.json](data/countries.json): países ya visitados, lugares, actividades, experiencias y fotos.
- [data/site-content.json](data/site-content.json): orden de la lista, wishlist, métricas y contenido editorial por país.

No es necesario modificar HTML, CSS o JavaScript para añadir o ajustar contenido.

## Cómo añadir un país

1. Abre [data/countries.json](data/countries.json).
2. Añade un nuevo objeto dentro del array principal.
3. Usa el siguiente formato:

```json
{
  "name": "Nombre del país",
  "description": "Resumen breve del destino",
  "places": ["Lugar 1", "Lugar 2"],
  "activities": ["Actividad 1", "Actividad 2"],
  "experiences": "Texto breve con la experiencia del viaje",
  "photos": [
    "images/nombre-pais/imagen-1.jpg",
    "images/nombre-pais/imagen-2.jpg"
  ]
}
```

Si además quieres personalizar el mapa, tips de viaje o recomendaciones editoriales de ese país, añade una entrada con el mismo nombre en [data/site-content.json](data/site-content.json).

## Reglas básicas

- `name`: nombre del país que aparecerá en la lista.
- `description`: texto corto para la vista previa.
- `places`: lugares destacados del viaje.
- `activities`: actividades recomendadas o favoritas.
- `experiences`: descripción más amplia del viaje.
- `photos`: rutas de imagen relativas al proyecto.
- `region`, `tags`, `year`, `favorite`: metadatos usados por la interfaz y las métricas.

## Editar contenido editorial y configuración

En [data/site-content.json](data/site-content.json) puedes modificar:

- `metrics.totalFlights`: total de vuelos realizados.
- `customCountryOrder`: orden personalizado de la lista de países.
- `wishlist`: destinos y lugares por visitar.
- `countries`: contenido adicional por país, por ejemplo:
  - `location`: coordenadas y zoom para el mapa.
  - `travelTips`: clima, costo estimado y mejor época.
  - `recommendations`: no te pierdas, consejo local y ritmo sugerido.

## Recomendación de imágenes

Guarda las fotos en una carpeta propia por país, por ejemplo:

- `images/guatemala/`
- `images/costa-rica/`

Y referencia cada archivo desde la propiedad `photos`.

## Ejemplo mínimo

```json
{
  "name": "Perú",
  "description": "Un viaje lleno de montañas, cultura y comida.",
  "places": ["Machu Picchu", "Cusco"],
  "activities": ["Trekking", "Degustación local"],
  "experiences": "Una experiencia muy completa entre historia y naturaleza.",
  "photos": ["images/peru/machupicchu.jpg"],
  "region": "Sudamérica",
  "tags": ["historia", "aventura"],
  "year": 2024,
  "favorite": false
}
```
