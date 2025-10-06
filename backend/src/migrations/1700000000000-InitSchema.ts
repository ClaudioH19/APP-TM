import { MigrationInterface, QueryRunner } from 'typeorm';

// Migración inicial del esquema.
export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE usuario (
        usuario_id SERIAL PRIMARY KEY,
        nombre      TEXT NOT NULL,
        contrasena  TEXT NOT NULL,
        ubicacion   TEXT NOT NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE mascota (
        mascota_id  SERIAL PRIMARY KEY,
        descripcion TEXT,
        usuario_id  INT NOT NULL REFERENCES usuario(usuario_id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE historial_medico (
        id                     SERIAL PRIMARY KEY,
        fecha                  TIMESTAMP NOT NULL,
        ubicacion_clinica_lat  FLOAT,
        ubicacion_clinica_lon  FLOAT,
        mascota_id             INT NOT NULL REFERENCES mascota(mascota_id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE recorrido (
        id          SERIAL PRIMARY KEY,
        fecha       TIMESTAMP NOT NULL,
        usuario_id  INT NOT NULL REFERENCES usuario(usuario_id),
        mascota_id  INT NOT NULL REFERENCES mascota(mascota_id),
        pasos       INT
      );
    `);

    await queryRunner.query(`
      CREATE TABLE puntos_recorrido (
        id            SERIAL PRIMARY KEY,
        longitud      FLOAT,
        latitud       FLOAT,
        fecha_hora    TIMESTAMP,
        recorrido_id  INT NOT NULL REFERENCES recorrido(id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE publicacion (
        id               SERIAL PRIMARY KEY,
        fecha            TIMESTAMP NOT NULL,
        ubicacion_lat    FLOAT,
        ubicacion_lon    FLOAT,
        descripcion      TEXT,
        contador_likes   INT,
        id_video         TEXT,
        provider         TEXT,
        mime_type        TEXT,
        size_bytes       TEXT,
        usuario_id       INT NOT NULL REFERENCES usuario(usuario_id),
        mascota_id       INT REFERENCES mascota(mascota_id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE comentario (
        id             SERIAL PRIMARY KEY,
        comentario     TEXT,
        publicacion_id INT NOT NULL REFERENCES publicacion(id),
        usuario_id     INT NOT NULL REFERENCES usuario(usuario_id),
        fecha          TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE TABLE punto_de_interes (
        id               SERIAL PRIMARY KEY,
        longitud         FLOAT,
        latitud          FLOAT,
        fecha_creacion   TIMESTAMP,
        descripcion      TEXT
      );
    `);

    await queryRunner.query(`
      CREATE TABLE resena (
        id                 SERIAL PRIMARY KEY,
        id_punto_interes   INT NOT NULL REFERENCES punto_de_interes(id),
        id_usuario         INT NOT NULL REFERENCES usuario(usuario_id),
        fecha_creacion     TIMESTAMP,
        descripcion        TEXT,
        valoracion         INT
      );
    `);

    await queryRunner.query(`
      CREATE TABLE realizado_por (
        id            SERIAL PRIMARY KEY,
        mascota_id    INT NOT NULL REFERENCES mascota(mascota_id),
        recorrido_id  INT NOT NULL REFERENCES recorrido(id)
      );
    `);

    await queryRunner.query(`CREATE INDEX idx_mascota_usuario   ON mascota(usuario_id);`);
    await queryRunner.query(`CREATE INDEX idx_hist_med_mascota  ON historial_medico(mascota_id);`);
    await queryRunner.query(`CREATE INDEX idx_recorrido_usuario ON recorrido(usuario_id);`);
    await queryRunner.query(`CREATE INDEX idx_recorrido_mascota ON recorrido(mascota_id);`);
    await queryRunner.query(`CREATE INDEX idx_puntos_recorrido  ON puntos_recorrido(recorrido_id);`);
    await queryRunner.query(`CREATE INDEX idx_pub_usuario       ON publicacion(usuario_id);`);
    await queryRunner.query(`CREATE INDEX idx_pub_mascota       ON publicacion(mascota_id);`);
    await queryRunner.query(`CREATE INDEX idx_com_pub           ON comentario(publicacion_id);`);
    await queryRunner.query(`CREATE INDEX idx_com_usuario       ON comentario(usuario_id);`);
    await queryRunner.query(`CREATE INDEX idx_resena_poi        ON resena(id_punto_interes);`);
    await queryRunner.query(`CREATE INDEX idx_resena_usuario    ON resena(id_usuario);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_resena_usuario;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_resena_poi;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_com_usuario;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_com_pub;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pub_mascota;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pub_usuario;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_puntos_recorrido;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_recorrido_mascota;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_recorrido_usuario;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_hist_med_mascota;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_mascota_usuario;`);

    await queryRunner.query(`DROP TABLE IF EXISTS realizado_por;`);
    await queryRunner.query(`DROP TABLE IF EXISTS resena;`);
    await queryRunner.query(`DROP TABLE IF EXISTS punto_de_interes;`);
    await queryRunner.query(`DROP TABLE IF EXISTS comentario;`);
    await queryRunner.query(`DROP TABLE IF EXISTS publicacion;`);
    await queryRunner.query(`DROP TABLE IF EXISTS puntos_recorrido;`);
    await queryRunner.query(`DROP TABLE IF EXISTS recorrido;`);
    await queryRunner.query(`DROP TABLE IF EXISTS historial_medico;`);
    await queryRunner.query(`DROP TABLE IF EXISTS mascota;`);
    await queryRunner.query(`DROP TABLE IF EXISTS usuario;`);
  }
}
