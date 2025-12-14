import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1763585010866 implements MigrationInterface {
    name = 'Auto1763585010866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "interaccion" DROP CONSTRAINT "interaccion_publicacion_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "interaccion" DROP CONSTRAINT "interaccion_usuario_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "usuario" DROP COLUMN "avatar"`);
        await queryRunner.query(`ALTER TABLE "usuario" DROP COLUMN "avatar_mime_type"`);
        await queryRunner.query(`ALTER TABLE "historial_medico" ADD "categoria" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "historial_medico" ADD "titulo" character varying(120)`);
        await queryRunner.query(`ALTER TABLE "historial_medico" ADD "descripcion" text`);
        await queryRunner.query(`CREATE INDEX "idx_hist_med_fecha" ON "historial_medico" ("fecha") `);
        await queryRunner.query(`ALTER TABLE "interaccion" ADD CONSTRAINT "FK_212c904d17a504152f39d4e2267" FOREIGN KEY ("publicacion_id") REFERENCES "publicacion"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "interaccion" ADD CONSTRAINT "FK_e9edd603e5bb8086a0efd8cf36a" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "interaccion" DROP CONSTRAINT "FK_e9edd603e5bb8086a0efd8cf36a"`);
        await queryRunner.query(`ALTER TABLE "interaccion" DROP CONSTRAINT "FK_212c904d17a504152f39d4e2267"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_com_pub"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_com_usuario"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_hist_med_fecha"`);
        await queryRunner.query(`ALTER TABLE "historial_medico" DROP COLUMN "descripcion"`);
        await queryRunner.query(`ALTER TABLE "historial_medico" DROP COLUMN "titulo"`);
        await queryRunner.query(`ALTER TABLE "historial_medico" DROP COLUMN "categoria"`);
        await queryRunner.query(`ALTER TABLE "usuario" ADD "avatar_mime_type" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "usuario" ADD "avatar" bytea`);
        await queryRunner.query(`ALTER TABLE "interaccion" ADD CONSTRAINT "interaccion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "interaccion" ADD CONSTRAINT "interaccion_publicacion_id_fkey" FOREIGN KEY ("publicacion_id") REFERENCES "publicacion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
