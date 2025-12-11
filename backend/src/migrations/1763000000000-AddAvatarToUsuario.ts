import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddAvatarToUsuario1763000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("usuario", new TableColumn({
            name: "avatar",
            type: "bytea",
            isNullable: true
        }));

        await queryRunner.addColumn("usuario", new TableColumn({
            name: "avatar_mime_type",
            type: "varchar",
            length: "50",
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("usuario", "avatar");
        await queryRunner.dropColumn("usuario", "avatar_mime_type");
    }
}
