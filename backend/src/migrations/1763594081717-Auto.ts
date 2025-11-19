import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1763594081717 implements MigrationInterface {
    name = 'Auto1763594081717'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // No hacer nada: migración generada por índices que ya no existen en las entidades
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No hacer nada
    }
}
