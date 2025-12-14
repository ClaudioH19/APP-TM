import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1763593944289 implements MigrationInterface {
    name = 'Auto1763593944289'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // No hacer nada: migración generada por error de diff
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No hacer nada
    }
}
