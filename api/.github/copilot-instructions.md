# Instrucciones para Copilot

## Arquitectura del Proyecto
Este proyecto es una API construida con Node.js y Express, que utiliza MongoDB como base de datos. La estructura del proyecto es la siguiente:

- **src/**: Contiene el código fuente de la API.
  - **controllers/**: Controladores que manejan la lógica de negocio.
  - **models/**: Modelos de datos que definen la estructura de los documentos en MongoDB.
  - **routes/**: Rutas que definen los endpoints de la API.

## Flujos de Trabajo
1. **Obtener todos los items**: Se puede acceder a todos los items mediante un GET a `/items`.
2. **Obtener un item por ID**: Se puede acceder a un item específico mediante un GET a `/items/:id`.
3. **Crear un item**: Se puede crear un nuevo item mediante un POST a `/items` con el cuerpo adecuado.
4. **Actualizar un item**: Se puede actualizar un item existente mediante un PUT a `/items/:id`.
5. **Eliminar un item**: Se puede eliminar un item mediante un DELETE a `/items/:id`.

## Convenciones
- Los nombres de las variables y funciones deben ser descriptivos y seguir la convención camelCase.
- Los mensajes de error deben ser claros y proporcionar información útil para la depuración.

## Puntos de Integración
- La API se integra con MongoDB a través de Mongoose, lo que permite una fácil manipulación de los datos.
- Se pueden agregar middlewares para manejar la autenticación y la validación de datos.