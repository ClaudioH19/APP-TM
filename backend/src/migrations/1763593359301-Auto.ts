import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1763593359301 implements MigrationInterface {
    name = 'Auto1763593359301'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "idx_interaccion_usuario" ON "public"."interaccion" ("usuario_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "idx_interaccion_pub" ON "public"."interaccion" ("publicacion_id")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_interaccion_pub"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_interaccion_usuario"`);
    }
}
