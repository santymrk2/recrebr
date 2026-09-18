Falta acá el archivo "Arial Rounded MT.json" (fuente convertida al formato
"typeface" de Three.js) que usa el hero 3D para extrudir las letras "B&R".

El index.html original lo cargaba con una ruta relativa ("../fonts/...")
que no estaba incluida en lo que subiste, así que no lo pude copiar acá.

Sin este archivo, el hero 3D va a fallar al iniciar y se va a mostrar el
overlay de error que ya tiene el propio código (#error) — el resto del
sitio (nav, secciones, catálogo, reservas) funciona igual.

Para arreglarlo: conseguí el .json original (o generá uno nuevo con la
herramienta oficial de Three.js, "facetype.js", a partir de la fuente que
estén usando) y colocalo en esta carpeta como:

  public/legacy/fonts/Arial Rounded MT.json
