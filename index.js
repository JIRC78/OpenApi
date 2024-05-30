const express = require('express');
const app = express();
const path = require('path');
const mysql = require('mysql2');
const fs = require('fs');
const { SwaggerTheme, SwaggerThemeNameEnum } = require('swagger-themes');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

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

app.use(express.static('/redoc.html'));
app.use(express.json());
const theme = new SwaggerTheme();

const readmeFile = fs.readFileSync(path.join(__dirname, 'README.md'), { encoding: 'utf8'});

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
      { url: "http://localhost:3000" }  // Puedes cambiar esto a la URL de tu despliegue en Render
    ],
  },
  apis: [`${path.join(__dirname,"./index.js")}`],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs, options));
app.get('/api-docs-json', (req, res) => {
  res.json(swaggerDocs);
});

// Rutas de la API
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
