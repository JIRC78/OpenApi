const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
chai.use(chaiHttp);

const app = require('./index');

describe('Pruebas del servidor', () => {
    it('Debe devolver un libro por su ID', function (done) {
        chai.request(app)
            .get('/libro?idLibro=1')
            .end((err, res) => {
                if (err) return done(err);
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('array').that.has.lengthOf(1);
                const libro = res.body[0];
                expect(libro).to.have.property('idLibro', 1); 
                done();
            });
    });

    it('Debe insertar un nuevo libro', function (done) {
        const nuevoLibro = {
            Nombre: 'Nuevo Libro',
            Genero: 'Género',
            SubGenero: 'Subgénero',
            Autor: 'Autor',
            Idioma: 'Idioma',
            Editorial: 'Editorial',
            Año: 2024
        };

        chai.request(app)
            .post('/libro')
            .send(nuevoLibro)
            .end((err, res) => {
                if (err) return done(err);
                expect(res).to.have.status(201);
                expect(res.body).to.have.property('message', 'Libro insertado');
                done();
            });
    });

});
