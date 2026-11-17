# Rediseño de Medicamentos: patrones de lectura y decisiones

## Problema

En la página de Medicamentos el detalle del elemento elegido aparecía en un
panel angosto a la derecha, fuera de la ruta natural de lectura, mientras una
lista de dos columnas densas competía por la atención. Las personas no notaban
dónde aparecía la información.

## Hallazgos

1. **Patrón en F.** El eyetracking de Nielsen Norman Group muestra que la gente
   concentra fijaciones arriba y a la izquierda; el contenido del lado derecho
   se salta con frecuencia. Es más probable cuando el texto no tiene formato y
   la persona busca eficiencia. NN/g recomienda poner lo importante al inicio,
   encabezados visibles que empiecen con las palabras más informativas,
   agrupar contenido relacionado con bordes o fondos, resaltar con
   moderación, usar listas y quitar relleno.
   Fuente: [F-shaped pattern](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/).
2. **Layer-cake y otros patrones.** Cuando hay encabezados y subtítulos claros,
   la mirada hace franjas horizontales sobre ellos (layer-cake), el patrón de
   escaneo más eficaz salvo leer casi todo; el peor es el F, seguido del
   "spotted". Fuente: [Text scanning patterns](https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/).
3. **Jerarquía visual.** Fuentes secundarias coinciden en que el tamaño es la
   señal más fuerte, el peso la segunda, y que combinarlos da niveles claros;
   el color solo no basta (falla en escala de grises y daltonismo). Las
   diferencias sutiles obligan a interpretar en lugar de reconocer. Fuentes:
   [UXmatters](https://www.uxmatters.com/mt/archives/2024/02/visual-hierarchy-making-user-experiences-easier-to-understand.php),
   [IxDF](https://ixdf.org/literature/topics/visual-hierarchy).
   (No se localizó un artículo primario de NN/g sobre esto; se tratan como
   referencias de apoyo.)
4. **Lista-detalle (master-detail).**
   - Material Design / Android: dos paneles lado a lado; la lista con ancho
     fijo y el detalle flexible; en pantallas compactas se muestra uno solo y
     "atrás" vuelve a la lista. Fuente: [Canonical layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/canonical-layouts).
   - Apple HIG: mantener resaltada de forma persistente la selección actual en
     cada panel que lleva al detalle; por defecto un tercio para el panel
     primario y dos tercios para el secundario. Fuente: [Split views](https://developer.apple.com/design/human-interface-guidelines/split-views).
   - Shopify Polaris: el índice usa una sola columna para dar un orden claro
     de arriba hacia abajo y espacio horizontal a las columnas de datos; el
     detalle ordena las secciones por importancia y deja el estado y los
     metadatos en la columna secundaria. Fuentes: [Resource index layout](https://polaris-react.shopify.com/patterns/resource-index-layout),
     [Resource details layout](https://polaris.shopify.com/patterns/resource-details-layout).
   - Cloudscape: el panel debe reflejar siempre la selección actual y se abre
     al seleccionar. Fuente: [Split view](https://cloudscape.design/patterns/resource-management/view/split-view/).
   - SAP Fiori: seleccionar el primer elemento por defecto en vez de dejar el
     detalle vacío. Fuente: [List-detail](https://www.sap.com/design-system/fiori-design-android/v26-4/layouts/list-detail/list-detail-overview).
5. **Tipografía de datos.** Cifras tabulares (mismo ancho por dígito) para que
   las columnas se alineen; texto alineado a la izquierda y números a la
   derecha, con el encabezado alineado a su dato; la alineación a la derecha
   solo ayuda si las cifras tienen la misma precisión. Fuentes:
   [Fonts for numbers (data.europa.eu)](https://data.europa.eu/apps/data-visualisation-guide/fonts-for-numbers),
   [A List Apart](https://alistapart.com/article/web-typography-tables/).
6. **Longitud de línea.** WCAG 1.4.8 (AAA) fija un máximo de 80 caracteres;
   las guías de legibilidad suelen citar 45-75 (UXCel) o 50-75 (atribuido a
   Baymard, sin fuente primaria verificada). Fuente: [WCAG 1.4.8](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation).
   Se aplica a texto corrido; en esta pantalla hay poco texto largo.

## Decisiones de diseño

| Hallazgo | Decisión |
| --- | --- |
| F-pattern: la derecha se ignora | El detalle deja de ser una columna estrecha a la derecha: la lista ocupa un ancho fijo a la izquierda (lista de ancho fijo, detalle flexible) y el detalle ocupa el espacio principal, con la foto y el nombre arriba, donde cae la barra horizontal superior de la F. |
| Polaris: índice de una sola columna | La lista pasa de dos columnas a una sola, con filas tipo tabla y columnas alineadas: imagen, nombre y presentación, especie, stock y precio. |
| Layer-cake / encabezados | El detalle tiene un H2 con el nombre, y subtítulos (Existencias, Lotes) cortos que empiezan con la palabra clave. |
| Cifras clave primero | Disponible, precio, stock mínimo y vencido se muestran como números grandes con etiquetas pequeñas, justo bajo el nombre (front-loading). |
| Apple HIG / Cloudscape: selección persistente | La fila elegida tiene fondo, borde y marca lateral fuertes, y se conserva `aria-pressed`; el detalle siempre refleja la selección. El primer elemento se selecciona por defecto en pantallas anchas (SAP). |
| Conexión visual fila-panel | El panel comparte el acento violeta de la fila elegida y es `sticky`, así que no se pierde al desplazar la lista. |
| Pantallas compactas | Igual que M3/Android: se ve la lista y el detalle se abre como hoja modal (se mantiene el modal existente, con edición y eliminación). |
| Cifras tabulares | `font-variant-numeric: tabular-nums` y alineación a la derecha en precio y stock, con el encabezado de columna alineado igual. |
| Jerarquía por tamaño y peso | Escala de 5 niveles (12, 14, 16, 20, 28 px) y pesos 700 para nombres y cifras, 500 para texto secundario, 600 para etiquetas; las etiquetas en color apagado con contraste AA. |
| Longitud de línea | El texto corrido (descripciones, avisos) se limita a 65ch; las filas no mezclan texto largo. |

## Pendiente de verificar

- No se hizo prueba con usuarios ni seguimiento ocular propio: las decisiones
  se apoyan en la literatura citada.
- Los porcentajes de lectura y el rango 50-75 caracteres provienen de fuentes
  secundarias.
