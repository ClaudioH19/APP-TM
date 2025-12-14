import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1763593570274 implements MigrationInterface {
    name = 'Auto1763593570274'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // No hacer nada: índices ya gestionados por otra migración
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No hacer nada
    }
}
