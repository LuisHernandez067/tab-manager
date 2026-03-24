# Requerimiento general de proyecto
## Extensión de navegador local-first para captura, organización y restauración de pestañas

**Nombre tentativo del producto:** Panic Tabs / Tab Vault / Zero Tabs  
**Tipo de producto:** Extensión de navegador basada en Chrome (Chrome / Edge Chromium, fase inicial)  
**Enfoque inicial:** Local-first, sin backend, sin cuenta de usuario  
**Stack aprobado:** Angular 21+ standalone + Bootstrap 5 + Manifest V3 + Service Worker MV3 + IndexedDB + Dexie + `chrome.storage.local`

---

## 1. Resumen ejecutivo

El proyecto consiste en construir una extensión de navegador orientada a resolver un problema concreto de productividad personal: la acumulación excesiva de pestañas abiertas como sustituto de una lista de tareas. La propuesta central es ofrecer un **botón de pánico** que permita capturar el estado actual de las pestañas abiertas, almacenarlo en un repositorio local estructurado, cerrar las pestañas activas y permitir su posterior exploración, búsqueda, clasificación y restauración.

La experiencia del usuario debe combinar dos superficies principales:

1. **Side panel** para acceso rápido y operaciones inmediatas.
2. **Dashboard interno en una pestaña de la propia extensión** para visualización amplia, navegación tipo biblioteca y configuración avanzada.

La solución será **local-first** en su primera versión. El repositorio principal vivirá en **IndexedDB** mediante **Dexie**, mientras que la configuración ligera y preferencias residirán en **`chrome.storage.local`**. Desde el primer MVP se incluirán funciones de **exportación e importación** para permitir respaldos manuales y restauración del repositorio.

La arquitectura se apoya en **Manifest V3**, que es la versión vigente del formato de extensiones aceptado por Chrome Web Store, y en un **extension service worker**, que actúa como manejador central de eventos. El side panel puede mantener una experiencia persistente y, al ser una página de extensión, tiene acceso a las APIs de Chrome. Angular v21 mantiene el enfoque moderno de componentes standalone, lo que favorece una UI modular para popup, panel, dashboard y opciones. Dexie ofrece una capa ergonómica sobre IndexedDB y dispone de soporte oficial para exportar e importar la base de datos como `Blob`. citeturn892973view5turn892973view2turn807436view1turn807436view4turn807436view5turn795342search0

---

## 2. Problema a resolver

### 2.1 Problema principal

El usuario utiliza las pestañas abiertas como representación informal de tareas pendientes, investigación en progreso, lecturas futuras o contexto de trabajo. Esto genera:

- saturación visual del navegador;
- pérdida de contexto al acumular demasiadas tabs;
- dificultad para distinguir entre “algo activo ahora” y “algo que simplemente no se quiere perder”;
- sesiones pesadas e improductivas;
- mala recuperación posterior de información útil.

### 2.2 Hipótesis de producto

Si el usuario cuenta con un mecanismo confiable para:

- capturar todas sus pestañas en un solo gesto,
- clasificarlas automáticamente,
- guardarlas localmente con seguridad,
- buscarlas y restaurarlas después,

entonces reducirá la fricción cognitiva de “tener que dejar todo abierto” y podrá vaciar el navegador sin sentir que está perdiendo trabajo.

---

## 3. Objetivo general

Diseñar e implementar una extensión de navegador local-first que permita **capturar, almacenar, categorizar, visualizar, respaldar y restaurar pestañas y sesiones de navegación**, reemplazando el uso de pestañas abiertas como sistema improvisado de gestión de tareas o recordatorios.

---

## 4. Objetivos específicos

1. Implementar un **botón de pánico** accesible desde action button, popup, side panel y atajo de teclado.
2. Capturar pestañas abiertas de la ventana actual y, más adelante, opcionalmente de todas las ventanas.
3. Persistir la información capturada en una base local navegable.
4. Construir un **dashboard visual tipo biblioteca** inspirado en patrones de organización estilo Raindrop, pero sin depender de backend en esta fase.
5. Permitir restauración parcial o total de sesiones guardadas.
6. Permitir exportación e importación manual de respaldos.
7. Mantener separación clara entre:
   - datos principales del repositorio;
   - preferencias del usuario;
   - futuras capacidades de sincronización con cuenta.
8. Minimizar permisos y complejidad técnica en el MVP.

---

## 5. Alcance del MVP

### 5.1 Incluye

- Extensión Chrome/Edge basada en **Manifest V3**.
- **Action button** en la barra del navegador.
- **Popup** simple con acciones rápidas.
- **Side panel** persistente para acceso operativo.
- **Dashboard interno** en pestaña completa de la extensión.
- **Options page** para configuración técnica y preferencias.
- **Service worker MV3** para coordinación de eventos y acciones.
- Captura de tabs mediante la API `chrome.tabs`.
- Cierre masivo de pestañas después de capturarlas.
- Repositorio local con **IndexedDB + Dexie**.
- Preferencias ligeras con **`chrome.storage.local`**.
- Exportación e importación manual desde el día 1.
- Categorización automática básica por reglas.
- Búsqueda local por título, dominio, URL y tags.
- Restauración de:
  - pestaña individual,
  - selección múltiple,
  - sesión completa.

### 5.2 No incluye en el MVP

- Backend.
- Autenticación o cuentas de usuario.
- Sincronización en nube.
- Funciones colaborativas.
- Inteligencia artificial obligatoria para clasificación.
- Resúmenes de páginas mediante scraping profundo.
- Inyección de content scripts por defecto.
- Compatibilidad garantizada con Firefox/Safari desde el día 1.

La decisión de evitar content scripts en la primera fase es deliberada: no son necesarios para capturar y administrar pestañas con el caso de uso actual, y además tienen un modelo distinto de permisos y capacidades. Los content scripts corren dentro de páginas web, acceden a un subconjunto de APIs y, para llegar al resto, deben comunicarse por mensajería con otras partes de la extensión. citeturn950158view0turn807436view2turn702400view0

---

## 6. Decisiones técnicas base

### 6.1 Plataforma de extensión

Se usará **Chrome Extensions Manifest V3**, ya que es la versión vigente del manifiesto y la aceptada por Chrome Web Store. Toda extensión debe declarar un `manifest.json` en la raíz del paquete. citeturn892973view4turn892973view5

### 6.2 UI principal

Se usará **Angular 21+ con componentes standalone** para toda la interfaz. Angular documenta el enfoque standalone como una forma de reducir la necesidad de `NgModule` y simplificar la composición de aplicaciones. Bootstrap 5 se usará como toolkit visual y de layout para acelerar una UI responsiva y consistente. citeturn807436view4turn807436view6turn513613search9

### 6.3 Lógica de fondo

La lógica de coordinación vivirá en un **extension service worker** escrito en TypeScript puro. Chrome lo define como el manejador central de eventos de la extensión, cargado cuando se necesita y descargado cuando queda inactivo; además, no tiene acceso directo al DOM. citeturn892973view2

### 6.4 Superficies de interacción

- **Popup**: acceso inmediato a acciones rápidas.
- **Side panel**: experiencia persistente durante la navegación; puede permanecer abierto entre tabs y, como página de extensión, tiene acceso a las APIs de Chrome. citeturn807436view1
- **Dashboard en tab interna**: vista principal de biblioteca y gestión amplia.
- **Options page**: configuración funcional y técnica; Chrome soporta opciones en nueva pestaña o embebidas en `chrome://extensions`. Para este proyecto conviene tratarlas como página completa. citeturn892973view1

### 6.5 Persistencia

- **IndexedDB + Dexie** para el repositorio principal.
- **`chrome.storage.local`** para settings.

IndexedDB está orientada a almacenar cantidades significativas de datos estructurados y soporta índices para búsquedas de alto rendimiento. La Storage API de extensiones, por su parte, ofrece almacenamiento específico para extensiones; `storage.local` guarda datos localmente, se elimina al desinstalar la extensión y tiene límite de 10 MB, ampliable con `unlimitedStorage`. Chrome recomienda `storage.local` para cantidades mayores dentro de esa API y `storage.sync` para settings sincronizables, pero `storage.sync` tiene una cuota aproximada de 100 KB. Para este proyecto, el repositorio de sesiones debe salir de `storage.*` y vivir en IndexedDB. citeturn795342search0turn771578view0turn771578view1turn771578view3

### 6.6 Backups

Dexie dispone de soporte oficial de exportación/importación mediante el paquete `dexie-export-import`, lo que permite respaldar la base como `Blob` y restaurarla después. Esto encaja exactamente con el requisito de backup manual desde el MVP. citeturn807436view5

### 6.7 Comunicación interna

La comunicación entre service worker, páginas `chrome-extension://` y otros contextos se implementará por **message passing** con `runtime.sendMessage`, `runtime.connect` y listeners asociados. Chrome documenta explícitamente esta comunicación entre service worker y páginas internas de extensión. citeturn702400view0

### 6.8 Dependencias locales, no remotas

Manifest V3 exige que la lógica de la extensión forme parte del paquete y no se cargue como código remoto. Esto afecta directamente al uso de librerías: Angular, Bootstrap y cualquier dependencia de runtime deben ir empaquetadas dentro de la extensión, no servidas desde CDN. citeturn892973view6

---

## 7. Arquitectura conceptual

## 7.1 Contextos de ejecución

### A. Service Worker (núcleo operativo)
Responsabilidades:

- escuchar clics del action button;
- escuchar atajos de teclado con `commands`;
- abrir o enfocar side panel/dashboard;
- consultar tabs;
- crear snapshots;
- persistir datos;
- cerrar tabs;
- restaurar tabs o sesiones;
- coordinar mensajería entre vistas.

La API `commands` permite definir atajos de teclado en el manifiesto y asociarlos a acciones de la extensión. La API `tabs` permite crear, modificar y reorganizar pestañas. citeturn892973view0turn807436view2

### B. Popup
Responsabilidades:

- mostrar resumen breve del estado actual;
- ejecutar “Guardar y vaciar”;
- abrir dashboard;
- abrir configuración.

### C. Side Panel
Responsabilidades:

- acceso operativo persistente;
- mostrar últimas sesiones;
- búsqueda rápida;
- restauración rápida;
- acceso a acciones frecuentes.

### D. Dashboard interno
Responsabilidades:

- repositorio visual completo;
- gestión de colecciones, tags y filtros;
- exploración tipo galería/lista;
- import/export;
- auditoría de sesiones y backups.

### E. Options Page
Responsabilidades:

- configuración funcional;
- reglas de categorización;
- preferencias de captura;
- flags experimentales.

---

## 8. Arquitectura de datos

## 8.1 Repositorio principal: IndexedDB + Dexie

La base local contendrá el dominio funcional del producto.

### Entidades iniciales

#### `SessionSnapshot`
Representa una captura de una sesión de navegación.

Campos sugeridos:
- `id`
- `createdAt`
- `updatedAt`
- `name`
- `description`
- `sourceWindowIds`
- `tabCount`
- `status` (`active`, `archived`, `deleted` lógico)
- `collectionId?`
- `autoTags[]`
- `manualTags[]`
- `notes?`

#### `SavedTab`
Representa una pestaña guardada dentro de una sesión.

Campos sugeridos:
- `id`
- `sessionId`
- `url`
- `normalizedUrl`
- `title`
- `favIconUrl?`
- `domain`
- `path?`
- `capturedAt`
- `windowIdOriginal?`
- `indexOriginal?`
- `pinnedOriginal?`
- `groupKey?`
- `category`
- `subCategory?`
- `isRestored`
- `restoredAt?`

#### `Collection`
Agrupa sesiones o tabs bajo una lógica del usuario.

Campos sugeridos:
- `id`
- `name`
- `slug`
- `description?`
- `icon?`
- `color?`
- `createdAt`
- `updatedAt`

#### `Tag`
Clasificación transversal manual o automática.

#### `Rule`
Regla local de categorización automática.

Campos sugeridos:
- `id`
- `type` (`domain`, `titleContains`, `urlContains`, `regex`, `manualMapping`)
- `pattern`
- `targetCategory`
- `targetCollection?`
- `targetTags[]`
- `priority`
- `enabled`

#### `BackupRecord`
Historial de exportaciones/importaciones.

Campos sugeridos:
- `id`
- `type` (`export`, `import`)
- `format` (`json`, `db-blob`)
- `createdAt`
- `version`
- `notes?`

## 8.2 Configuración ligera: `chrome.storage.local`

Se guardarán aquí solo preferencias operativas, por ejemplo:

- tema visual;
- idioma;
- estrategia por defecto del botón pánico;
- si se captura solo ventana actual o todas las ventanas;
- confirmaciones antes de cerrar;
- reglas simples serializadas;
- flags de beta features.

---

## 9. Flujos funcionales principales

## 9.1 Flujo: botón de pánico

1. Usuario acciona botón/atajo.
2. La extensión consulta las tabs objetivo.
3. Normaliza y prepara metadatos.
4. Aplica reglas de categorización automática.
5. Crea un `SessionSnapshot`.
6. Inserta `SavedTab` asociados.
7. Confirma persistencia exitosa.
8. Cierra las tabs capturadas.
9. Muestra feedback al usuario.
10. Opcionalmente abre side panel o dashboard con la sesión recién guardada.

## 9.2 Flujo: restaurar sesión completa

1. Usuario elige sesión.
2. La UI consulta tabs relacionadas.
3. Se abre una nueva ventana o se reutiliza la actual según preferencia.
4. Se restauran las tabs en orden razonable.
5. Se marca trazabilidad de restauración.

## 9.3 Flujo: restaurar selección parcial

1. Usuario filtra o busca.
2. Marca tabs específicas.
3. Elige abrirlas en ventana actual o nueva.
4. Se actualiza estado de restauración.

## 9.4 Flujo: exportar backup

1. Usuario accede a backups.
2. Elige formato.
3. La extensión serializa repositorio y/o settings.
4. Se descarga archivo local.
5. Se registra `BackupRecord`.

## 9.5 Flujo: importar backup

1. Usuario selecciona archivo.
2. La extensión valida versión y estructura.
3. Muestra preview y estrategia:
   - reemplazar,
   - fusionar,
   - importar en colección nueva.
4. Ejecuta importación.
5. Registra auditoría del proceso.

---

## 10. Requerimientos funcionales

### RF-001
La extensión debe permitir capturar pestañas abiertas de la ventana actual.

### RF-002
La extensión debe ofrecer un botón de pánico accesible desde la interfaz de la extensión.

### RF-003
La extensión debe permitir asociar el botón de pánico a un atajo de teclado usando `commands`. citeturn892973view0

### RF-004
La extensión debe almacenar las sesiones capturadas localmente en IndexedDB.

### RF-005
La extensión debe cerrar las pestañas capturadas después de confirmar persistencia exitosa.

### RF-006
La extensión debe mostrar un side panel persistente para acceso rápido. citeturn807436view1

### RF-007
La extensión debe ofrecer un dashboard interno en una pestaña propia para navegación amplia del repositorio.

### RF-008
La extensión debe ofrecer una options page para configuración. citeturn892973view1

### RF-009
La extensión debe permitir buscar sesiones y tabs por título, dominio, URL y tags.

### RF-010
La extensión debe permitir restaurar una tab individual.

### RF-011
La extensión debe permitir restaurar múltiples tabs seleccionadas.

### RF-012
La extensión debe permitir restaurar una sesión completa.

### RF-013
La extensión debe categorizar automáticamente por reglas locales configurables.

### RF-014
La extensión debe permitir exportar backups manuales.

### RF-015
La extensión debe permitir importar backups manuales.

### RF-016
La extensión debe separar settings ligeros del repositorio principal.

### RF-017
La extensión debe funcionar sin backend ni cuenta de usuario.

### RF-018
La extensión debe preparar una base de diseño que permita futura sincronización remota sin romper el modelo local.

---

## 11. Requerimientos no funcionales

### RNF-001 Rendimiento
El guardado masivo de tabs debe ejecutarse de forma ágil y sin congelar la UI perceptiblemente.

### RNF-002 Confiabilidad
Nunca se deben cerrar tabs antes de confirmar que la sesión fue persistida correctamente.

### RNF-003 Privacidad
Todos los datos del MVP deben permanecer locales, salvo que el usuario exporte manualmente un backup.

### RNF-004 Trazabilidad
Las operaciones de exportación, importación y restauración deben registrar metadatos mínimos de auditoría local.

### RNF-005 Escalabilidad local
La estructura de IndexedDB debe soportar crecimiento progresivo en cantidad de sesiones, tabs y reglas.

### RNF-006 UX
La interfaz debe ser visualmente atractiva, clara y orientada a reducir ansiedad de “cerrar algo que no quiero perder”.

### RNF-007 Mantenibilidad
La aplicación debe organizarse por dominios claros y componentes standalone reutilizables.

### RNF-008 Seguridad técnica
No se deben usar scripts o estilos cargados remotamente; las dependencias deben ir empaquetadas localmente en la extensión. citeturn892973view6

---

## 12. Permisos iniciales recomendados

Permisos probables para el MVP:

- `tabs`
- `storage`
- `commands`
- `sidePanel`

Evaluar además:
- `unlimitedStorage` si el crecimiento del repositorio lo justifica.

Chrome exige declarar en el manifiesto el uso de la mayoría de APIs y distingue entre `permissions`, `optional_permissions` y `host_permissions`. El criterio del proyecto será **pedir el mínimo conjunto de permisos necesario**. Los permisos opcionales quedarán reservados para futuras funciones que realmente los necesiten. citeturn892973view3

**Decisión actual:** no usar `content_scripts`, `scripting` ni `host_permissions` en el MVP salvo que aparezca una necesidad funcional real durante implementación.

---

## 13. Estructura de proyecto sugerida

```text
root/
  manifest.json
  package.json
  angular.json
  tsconfig.json
  src/
    app/
      core/
        messaging/
        permissions/
        settings/
        boot/
      shared/
        ui/
        models/
        utils/
        constants/
      features/
        popup/
        side-panel/
        dashboard/
        options/
        sessions/
        collections/
        backup/
        search/
      data/
        dexie/
        repositories/
        mappers/
        rules/
      workers/
        extension-worker.ts
```

### Criterios de organización

- **core**: orquestación y servicios transversales.
- **shared**: piezas reutilizables y tipados.
- **features**: módulos funcionales por dominio.
- **data**: acceso a IndexedDB, repositorios y transformaciones.
- **workers**: service worker y lógica asociada.

---

## 14. Estrategia de categorización automática inicial

La clasificación automática del MVP debe ser simple, determinista y transparente.

### Primera versión

Reglas por:
- dominio;
- coincidencia parcial de título;
- coincidencia parcial de URL;
- tags automáticos por palabras clave;
- normalización de URLs para evitar duplicados triviales.

### Categorías iniciales sugeridas

- Trabajo
- Desarrollo
- Lectura
- Compras
- Video
- Documentación
- Investigación
- Personal
- Pendiente
- Archivo rápido

### Meta del MVP

No buscar “inteligencia”; buscar **consistencia**.

---

## 15. Estrategia de UX

## 15.1 Principios

- un clic para aliviar la saturación;
- cero pérdida de confianza;
- recuperación rápida;
- estética sobria y cuidada;
- interfaz con sensación de biblioteca y control, no de cementerio de links.

## 15.2 Superficies UX

### Popup
Compacto, con pocas acciones.

### Side panel
Operativo, rápido, persistente.

### Dashboard
Explorable, visual, elegante, con filtros, vistas de lista/cuadrícula, métricas suaves y navegación amplia.

### Options
Menos “bonito”, más técnico y funcional.

---

## 16. Fases recomendadas

## Fase 1 — Base operativa

- manifiesto MV3
- service worker
- popup mínimo
- side panel mínimo
- tabs capture
- persistencia Dexie
- cierre de tabs

## Fase 2 — Repositorio usable

- dashboard interno
- búsqueda
- filtros
- tags
- colecciones
- restauración parcial y total

## Fase 3 — Backups y robustez

- export JSON
- export DB
- import merge/replace
- validación de versiones
- logs de operaciones

## Fase 4 — Refinamiento visual

- layout premium con Bootstrap 5
- vistas tipo biblioteca
- iconografía
- microinteracciones
- estados vacíos y feedbacks

## Fase 5 — Futuro

- sync opcional
- cuenta de usuario
- cifrado de backups
- IA para agrupación o resumen
- compatibilidad multi-browser más amplia

---

## 17. Riesgos y mitigaciones

### Riesgo 1: pérdida de confianza del usuario
**Mitigación:** no cerrar tabs hasta confirmar escritura exitosa.

### Riesgo 2: repositorio local desordenado
**Mitigación:** reglas simples, filtros fuertes, tags y colecciones desde temprano.

### Riesgo 3: crecimiento del almacenamiento
**Mitigación:** IndexedDB como almacenamiento principal y política de backups manuales.

### Riesgo 4: arquitectura sobrecargada demasiado pronto
**Mitigación:** evitar backend, auth y IA en la primera versión.

### Riesgo 5: permisos excesivos
**Mitigación:** mantener el manifiesto mínimo y posponer permisos opcionales.

---

## 18. Criterios de aceptación del MVP

El MVP se considerará aceptado cuando permita:

1. Guardar todas las tabs de la ventana actual en una sesión local.
2. Cerrar esas tabs luego del guardado exitoso.
3. Visualizar la sesión desde side panel y dashboard.
4. Buscar tabs guardadas por título o dominio.
5. Restaurar una sesión completa.
6. Restaurar una tab individual.
7. Exportar un backup.
8. Importar un backup válido.
9. Configurar preferencias básicas desde options page.
10. Operar completamente sin backend.

---

## 19. Decisiones abiertas para refinamiento posterior

1. Nombre definitivo del producto.
2. Si el botón de pánico debe actuar por defecto sobre:
   - ventana actual,
   - todas las ventanas,
   - o preguntar cada vez.
3. Si la restauración completa debe abrir nueva ventana por defecto.
4. Si las colecciones serán primero manuales o derivadas de reglas.
5. Si el dashboard y options compartirán shell visual o serán experiencias distintas.
6. Si se habilitará `unlimitedStorage` desde el MVP o solo si aparecen límites reales.

---

## 20. Recomendación final de implementación

La implementación debe arrancar con una meta muy concreta: **resolver el problema de vaciar el navegador sin perder contexto**. Por tanto, el orden correcto no es empezar por la estética perfecta ni por sincronización futura, sino por asegurar cuatro pilares:

1. captura fiable;
2. persistencia local robusta;
3. restauración sencilla;
4. backup manual.

Una vez esos cuatro puntos estén sólidos, entonces sí tiene sentido elevar la experiencia visual del dashboard y preparar la evolución a cuenta de usuario y backend.

---

## 21. Referencias técnicas consultadas

- Chrome for Developers — Manifest file format  
  https://developer.chrome.com/docs/extensions/reference/manifest
- Chrome for Developers — Manifest Version  
  https://developer.chrome.com/docs/extensions/reference/manifest/manifest-version
- Chrome for Developers — About extension service workers  
  https://developer.chrome.com/docs/extensions/develop/concepts/service-workers
- Chrome for Developers — chrome.tabs API  
  https://developer.chrome.com/docs/extensions/reference/api/tabs
- Chrome for Developers — chrome.sidePanel API  
  https://developer.chrome.com/docs/extensions/reference/api/sidePanel
- Chrome for Developers — chrome.storage API  
  https://developer.chrome.com/docs/extensions/reference/api/storage
- Chrome for Developers — chrome.commands API  
  https://developer.chrome.com/docs/extensions/reference/api/commands
- Chrome for Developers — Give users options  
  https://developer.chrome.com/docs/extensions/develop/ui/options-page
- Chrome for Developers — Declare permissions  
  https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions
- Chrome for Developers — Message passing  
  https://developer.chrome.com/docs/extensions/develop/concepts/messaging
- Chrome for Developers — Improve extension security  
  https://developer.chrome.com/docs/extensions/develop/migrate/improve-security
- Angular — Standalone migration / standalone components  
  https://angular.dev/reference/migrations/standalone
- Angular — v21 documentation  
  https://angular.dev/guide/components
- MDN — IndexedDB API  
  https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- Dexie — Export and Import Database  
  https://dexie.org/docs/ExportImport/dexie-export-import
- Bootstrap 5.3 — Getting started  
  https://getbootstrap.com/docs/5.3/getting-started/introduction/
