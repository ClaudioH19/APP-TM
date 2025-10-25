import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1761105136174 implements MigrationInterface {
    name = 'Auto1761105136174'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "punto_de_interes" ADD "usuario_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "punto_de_interes" ADD CONSTRAINT "FK_03b20858c38186fb356ce7e9b8c" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "punto_de_interes" DROP CONSTRAINT "FK_03b20858c38186fb356ce7e9b8c"`);
        await queryRunner.query(`ALTER TABLE "punto_de_interes" DROP COLUMN "usuario_id"`);
    }

}
