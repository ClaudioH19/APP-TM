import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1762786677080 implements MigrationInterface {
    name = 'Auto1762786677080'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mascota" ADD "fecha_nacimiento" date`);
        await queryRunner.query(`ALTER TABLE "mascota" ADD "especie" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mascota" DROP COLUMN "especie"`);
        await queryRunner.query(`ALTER TABLE "mascota" DROP COLUMN "fecha_nacimiento"`);
    }

}
