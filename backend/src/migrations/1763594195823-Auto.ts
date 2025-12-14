import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1763594195823 implements MigrationInterface {
    name = 'Auto1763594195823'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // No hacer nada: migración generada por índices antiguos en las entidades
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No hacer nada
    }
}
