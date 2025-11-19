import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1763592795065 implements MigrationInterface {
    name = 'Auto1763592795065'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "historial_medico" ADD "estado" character varying(20) NOT NULL DEFAULT 'pendiente'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "historial_medico" DROP COLUMN "estado"`);
    }
}
