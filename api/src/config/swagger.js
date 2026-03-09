const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "KidoTag API",
      version: "1.0.0",
      description: "API REST para sistema de control de asistencias con NFC",
      contact: {
        name: "API Support",
        email: "support@kidotag.com",
      },
      license: {
        name: "ISC",
        url: "https://opensource.org/licenses/ISC",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor de desarrollo",
      },
      {
        url: "http://0.0.0.0:3000",
        description: "Servidor local",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Ingresa el token JWT obtenido del login",
        },
      },
      schemas: {
        Alumno: {
          type: "object",
          required: ["nombre", "uidTarjeta"],
          properties: {
            _id: {
              type: "string",
              description: "ID único del alumno",
            },
            nombre: {
              type: "string",
              description: "Nombre completo del alumno",
            },
            uidTarjeta: {
              type: "string",
              description: "UID único de la tarjeta NFC",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Fecha de creación",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Fecha de última actualización",
            },
          },
        },
        Asistencia: {
          type: "object",
          required: ["alumno"],
          properties: {
            _id: {
              type: "string",
              description: "ID único de la asistencia",
            },
            alumno: {
              type: "string",
              description: "ID del alumno",
            },
            fecha: {
              type: "string",
              format: "date-time",
              description: "Fecha y hora de la asistencia",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Tutor: {
          type: "object",
          required: ["nombre", "email", "password"],
          properties: {
            _id: {
              type: "string",
              description: "ID único del tutor",
            },
            nombre: {
              type: "string",
              description: "Nombre completo del tutor",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email del tutor",
            },
            password: {
              type: "string",
              description: "Contraseña del tutor",
            },
            telefono: {
              type: "string",
              description: "Teléfono del tutor",
            },
            alumnos: {
              type: "array",
              items: {
                type: "string",
              },
              description: "IDs de alumnos asociados",
            },
            devices: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  deviceId: { type: "string" },
                  deviceType: { type: "string", enum: ["web", "mobile"] },
                  deviceName: { type: "string" },
                  lastLogin: { type: "string", format: "date-time" },
                  isActive: { type: "boolean" },
                },
              },
              description: "Devices registrados del tutor",
            },
            activo: {
              type: "boolean",
              description: "Estado del tutor",
            },
          },
        },
        Profesor: {
          type: "object",
          required: ["nombre", "email", "password"],
          properties: {
            _id: {
              type: "string",
              description: "ID único del profesor",
            },
            nombre: {
              type: "string",
              description: "Nombre completo del profesor",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email del profesor",
            },
            password: {
              type: "string",
              description: "Contraseña del profesor",
            },
            telefono: {
              type: "string",
              description: "Teléfono del profesor",
            },
            especialidad: {
              type: "string",
              description: "Especialidad del profesor",
            },
            activo: {
              type: "boolean",
              description: "Estado del profesor",
            },
          },
        },
        Grupo: {
          type: "object",
          required: ["nombre", "profesor"],
          properties: {
            _id: {
              type: "string",
              description: "ID único del grupo",
            },
            nombre: {
              type: "string",
              description: "Nombre del grupo",
            },
            descripcion: {
              type: "string",
              description: "Descripción del grupo",
            },
            profesor: {
              type: "string",
              description: "ID del profesor",
            },
            alumnos: {
              type: "array",
              items: {
                type: "string",
              },
              description: "IDs de alumnos del grupo",
            },
            horario: {
              type: "string",
              description: "Horario del grupo",
            },
            activo: {
              type: "boolean",
              description: "Estado del grupo",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            ok: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "object",
              properties: {
                codigo: {
                  type: "string",
                  description: "Código del error",
                },
                mensaje: {
                  type: "string",
                  description: "Mensaje del error",
                },
              },
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            ok: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
              description: "Datos de respuesta",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Autenticación",
        description: "Endpoints de login y gestión de sesiones",
      },
      {
        name: "Estado",
        description: "Endpoints para verificar el estado del sistema",
      },
      {
        name: "Alumnos",
        description: "Gestión de alumnos",
      },
      {
        name: "Asistencias",
        description: "Gestión de asistencias",
      },
      {
        name: "Tutores",
        description: "Gestión de tutores y sus alumnos",
      },
      {
        name: "Profesores",
        description: "Gestión de profesores",
      },
      {
        name: "Grupos",
        description: "Gestión de grupos",
      },
      {
        name: "Items",
        description: "Gestión de items (ejemplo)",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
