import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1761098135552 implements MigrationInterface {
    name = 'Auto1761098135552'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "punto_de_interes" ADD "nombre" text NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."punto_de_interes_categoria_enum" AS ENUM('Veterinario', 'Tienda', 'Ocio', 'Deporte', 'Otro')`);
        await queryRunner.query(`ALTER TABLE "punto_de_interes" ADD "categoria" "public"."punto_de_interes_categoria_enum" NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "punto_de_interes" DROP COLUMN "categoria"`);
        await queryRunner.query(`DROP TYPE "public"."punto_de_interes_categoria_enum"`);
        await queryRunner.query(`ALTER TABLE "punto_de_interes" DROP COLUMN "nombre"`);
    }

}
