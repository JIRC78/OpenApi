const express = require('express');
const app = express();
const path = require('path');
const mysql = require('mysql2');
const fs = require('fs');
const { SwaggerTheme, SwaggerThemeNameEnum } = require('swagger-themes');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
require('dotenv').config();

// Configurar la conexión a la base de datos usando variables de entorno
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  } else {
    console.log('Connected to the database.');
  }
});

app.use(express.static('public'));
app.use(express.json());
const theme = new SwaggerTheme();

const readmeFile = fs.readFileSync(path.join(__dirname, 'README.md'), { encoding: 'utf8' });

const options = {
  explorer: true,
  customCss: theme.getBuffer(SwaggerThemeNameEnum.MUTED),
  customSiteTitle: 'API de Libros',
  swaggerOptions: {},
  customCssUrl: '/custom.css'
};

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Libreria',
      version: '1.0.0',
      description: readmeFile
    },
    servers: [
      { url: "https://openapi-g6x4.onrender.com" }  // Cambia a la URL de tu despliegue en Render
    ],
  },
  apis: [`${path.join(__dirname, "./index.js")}`],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs, options));
app.get('/api-docs-json', (req, res) => {
  res.json(swaggerDocs);
});

// Ruta para la raíz ("/")
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Libro:
 *       type: object
 *       properties:
 *         idLibro:
 *           type: integer
 *           description: ID del libro
 *         Nombre:
 *           type: string
 *           description: Nombre del libro
 *         Genero:
 *           type: string
 *           description: Género del libro
 *         SubGenero:
 *           type: string
 *           description: Subgénero del libro
 *         Autor:
 *           type: string
 *           description: Autor del libro
 *         Idioma:
 *           type: string
 *           description: Idioma del libro
 *         Editorial:
 *           type: string
 *           description: Editorial del libro
 *         Año:
 *           type: integer
 *           description: Año de publicación del libro
 */

/**
 * @swagger
 * /libro:
 *   get:
 *     summary: Obtiene todos los libros o un libro específico por ID
 *     parameters:
 *       - in: query
 *         name: idLibro
 *         schema:
 *           type: integer
 *         description: ID del libro
 *     responses:
 *       200:
 *         description: Lista de libros
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Libro'
 *       404:
 *         description: Libro no encontrado
 *       500:
 *         description: Error en la consulta a la base de datos
 */
app.get('/libro', async (req, res) => {
  try {
    if (typeof req.query.idLibro == 'undefined') {
      connection.query('SELECT * FROM libro', (err, rows) => {
        if (err) throw err;
        res.json(rows);
      });
    } else {
      connection.query(`SELECT * FROM libro WHERE idLibro = ${req.query.idLibro}`, (err, rows) => {
        if (err) throw err;
        if (rows.length === 0) {
          res.status(404).json({ error: 'Libro no encontrado' });
        } else {
          res.json(rows);
        }
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error en la consulta a la base de datos' });
  }
});

/**
 * @swagger
 * /libro:
 *   post:
 *     summary: Inserta un nuevo libro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Libro'
 *     responses:
 *       201:
 *         description: Libro insertado
 *       404:
 *         description: Error al insertar el libro
 */
app.post('/libro', async (req, res) => {
  try {
    const { Nombre, Genero, SubGenero, Autor, Idioma, Editorial, Año } = req.body;
    connection.query(
      'INSERT INTO libro (Nombre, Genero, SubGenero, Autor, Idioma, Editorial, Año) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [Nombre, Genero, SubGenero, Autor, Idioma, Editorial, Año]
    );
    res.status(201).json({ message: 'Libro insertado' });
  } catch (error) {
    console.error('Error al insertar:', error);
    res.status(404).json({ error: 'Error al insertar el libro' });
  }
});

/**
 * @swagger
 * /libro/{idLibro}:
 *   delete:
 *     summary: Elimina un libro por ID
 *     parameters:
 *       - in: path
 *         name: idLibro
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del libro a eliminar
 *     responses:
 *       200:
 *         description: Libro eliminado
 *       404:
 *         description: Ya está eliminado
 *       500:
 *         description: Error al eliminar el libro
 */
app.delete('/libro/:idLibro', async (req, res) => {
  try {
    const idLibro = req.params.idLibro;
    connection.query(
      'DELETE FROM libro WHERE idLibro = ?',
      [idLibro],
      (err, result) => {
        if (err) throw err;
        if (result.affectedRows === 0) {
          res.status(404).json({ error: 'Ya esta eliminado' });
        } else {
          res.json({ message: 'Libro eliminado' });
        }
      }
    );
  } catch (error) {
    console.error('Error al eliminar:', error);
    res.status(500).json({ error: 'Error al eliminar el libro' });
  }
});

/**
 * @swagger
 * /libro/{idLibro}:
 *   put:
 *     summary: Actualiza un libro por ID
 *     parameters:
 *       - in: path
 *         name: idLibro
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del libro a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Libro'
 *     responses:
 *       200:
 *         description: Libro actualizado
 *       404:
 *         description: No se pudo actualizar
 *       500:
 *         description: Error al actualizar el libro
 */
app.put('/libro/:idLibro', async (req, res) => {
  try {
    const idLibro = req.params.idLibro;
    const { Nombre, Genero, SubGenero, Autor, Idioma, Editorial, Año } = req.body;
    connection.query(
      'UPDATE libro SET Nombre = ?, Genero = ?, SubGenero = ?, Autor = ?, Idioma = ?, Editorial = ?, Año = ? WHERE idLibro = ?',
      [Nombre, Genero, SubGenero, Autor, Idioma, Editorial, Año, idLibro],
      (err, result) => {
        if (err) throw err;
        if (result.affectedRows === 0) {
          res.status(404).json({ error: 'no se pudo actualizar' });
        } else {
          res.json({ message: 'Libro actualizado' });
        }
      }
    );
  } catch (error) {
    console.error('Error al actualizar el libro:', error);
    res.status(500).json({ error: 'Error al actualizar el libro' });
  }
});

app.listen(3000, () => {
  console.log('listening on port 3000!');
});

module.exports = app;
