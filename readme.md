# Travel Journal

Este proyecto es un diario visual de viajes que muestra los destinos desde un archivo JSON.

## Editar contenido

La edición principal se realiza en el archivo [data/countries.json](data/countries.json).
No es necesario modificar HTML, CSS o JavaScript para añadir un país nuevo.

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

## Reglas básicas

- `name`: nombre del país que aparecerá en la lista.
- `description`: texto corto para la vista previa.
- `places`: lugares destacados del viaje.
- `activities`: actividades recomendadas o favoritas.
- `experiences`: descripción más amplia del viaje.
- `photos`: rutas de imagen relativas al proyecto.

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
  "photos": ["images/peru/machupicchu.jpg"]
}
```
