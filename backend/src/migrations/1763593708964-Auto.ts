import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1763593708964 implements MigrationInterface {
    name = 'Auto1763593708964'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "idx_comentario_usuario" ON "public"."comentario" ("usuarioUsuarioId")`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "idx_comentario_pub" ON "public"."comentario" ("publicacionId")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_comentario_pub"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_comentario_usuario"`);
    }
}
