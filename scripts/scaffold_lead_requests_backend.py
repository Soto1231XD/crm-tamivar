from pathlib import Path


ROOT = Path(r"C:\Users\Soto\OneDrive\Escritorio\tamivar-api")


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def replace_once(source: str, old: str, new: str) -> str:
    if old not in source:
        return source
    return source.replace(old, new, 1)


def update_schema() -> None:
    path = ROOT / "prisma" / "schema.prisma"
    content = read(path)

    old_relations = (
        '  registros_leads_creados   RegistroLead[] @relation("RegistroLeadCreador")\n'
        '  registros_leads_asignados RegistroLead[] @relation("RegistroLeadVendedorAsignado")'
    )
    new_relations = (
        '  registros_leads_creados   RegistroLead[] @relation("RegistroLeadCreador")\n'
        '  registros_leads_asignados RegistroLead[] @relation("RegistroLeadVendedorAsignado")\n'
        '  solicitudes_leads_creadas SolicitudLead[] @relation("SolicitudLeadCreador")\n'
        '  solicitudes_leads_asignadas SolicitudLead[] @relation("SolicitudLeadVendedor")'
    )
    if "solicitudes_leads_creadas" not in content:
        content = replace_once(content, old_relations, new_relations)

    if "model SolicitudLead {" not in content:
        marker = "model Movimiento {"
        solicitud_model = """model SolicitudLead {
  id                  Int      @id @default(autoincrement())
  estado              String
  fecha_alta          DateTime
  vendedor_id         Int
  nombre              String
  telefono            BigInt
  solicitud           String?  @db.Text
  tipo_inmueble       String?
  presupuesto         Decimal? @db.Decimal(12, 2)
  metodo_pago         String?
  ubicacion           String?  @db.Text
  numero_habitaciones String?
  caracteristicas     String?  @db.Text
  seguimiento         String?  @db.Text
  opciones_enviadas   String?  @db.Text
  medio               String?
  comentario_final    String?  @db.Text
  creado_en           DateTime @default(now())
  actualizado_en      DateTime @updatedAt
  creado_por_id       Int
  creador             Usuario  @relation("SolicitudLeadCreador", fields: [creado_por_id], references: [id])
  vendedor            Usuario  @relation("SolicitudLeadVendedor", fields: [vendedor_id], references: [id])
}

"""
        content = replace_once(content, marker, solicitud_model + marker)

    write(path, content)


def create_migration() -> None:
    migration = ROOT / "prisma" / "migrations" / "20260429170000_create_solicitudes_leads" / "migration.sql"
    write(
        migration,
        """CREATE TABLE "SolicitudLead" (
    "id" SERIAL NOT NULL,
    "estado" TEXT NOT NULL,
    "fecha_alta" TIMESTAMP(3) NOT NULL,
    "vendedor_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" BIGINT NOT NULL,
    "solicitud" TEXT,
    "tipo_inmueble" TEXT,
    "presupuesto" DECIMAL(12,2),
    "metodo_pago" TEXT,
    "ubicacion" TEXT,
    "numero_habitaciones" TEXT,
    "caracteristicas" TEXT,
    "seguimiento" TEXT,
    "opciones_enviadas" TEXT,
    "medio" TEXT,
    "comentario_final" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "creado_por_id" INTEGER NOT NULL,

    CONSTRAINT "SolicitudLead_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SolicitudLead" ADD CONSTRAINT "SolicitudLead_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SolicitudLead" ADD CONSTRAINT "SolicitudLead_vendedor_id_fkey" FOREIGN KEY ("vendedor_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
""",
    )


def create_module_files() -> None:
    dto_dir = ROOT / "src" / "solicitudes-leads" / "dto"
    write(
        dto_dir / "create-solicitud-lead.dto.ts",
        """import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSolicitudLeadDto {
  @IsString()
  estado: string;

  @IsDateString()
  fecha_alta: string;

  @IsInt()
  @Type()
  vendedor_id: number;

  @IsString()
  nombre: string;

  @Matches(/^[0-9]{10}$/, {
    message: 'El telefono debe tener exactamente 10 digitos numericos',
  })
  telefono: string;

  @IsInt()
  @Type()
  creado_por_id: number;

  @IsOptional()
  @IsString()
  solicitud?: string;

  @IsOptional()
  @IsString()
  tipo_inmueble?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  presupuesto?: number;

  @IsOptional()
  @IsString()
  metodo_pago?: string;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsOptional()
  @IsString()
  numero_habitaciones?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500, { message: 'Caracteristicas no puede exceder 1500 caracteres' })
  caracteristicas?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500, { message: 'Seguimiento no puede exceder 1500 caracteres' })
  seguimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500, { message: 'Opciones enviadas no puede exceder 1500 caracteres' })
  opciones_enviadas?: string;

  @IsOptional()
  @IsString()
  medio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500, { message: 'Comentario final no puede exceder 1500 caracteres' })
  comentario_final?: string;
}
""",
    )
    write(
        dto_dir / "update-solicitud-lead.dto.ts",
        """import { PartialType } from '@nestjs/mapped-types';
import { CreateSolicitudLeadDto } from './create-solicitud-lead.dto';

export class UpdateSolicitudLeadDto extends PartialType(CreateSolicitudLeadDto) {}
""",
    )

    module_dir = ROOT / "src" / "solicitudes-leads"
    write(
        module_dir / "solicitudes-leads.service.ts",
        """import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateSolicitudLeadDto } from './dto/create-solicitud-lead.dto';

@Injectable()
export class SolicitudesLeadsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeOptions = {
    creador: {
      select: {
        id: true,
        nombres: true,
        apellido_paterno: true,
        apellido_materno: true,
        correo_electronico: true,
        foto_url: true,
      },
    },
    vendedor: {
      select: {
        id: true,
        nombres: true,
        apellido_paterno: true,
        apellido_materno: true,
        correo_electronico: true,
        foto_url: true,
      },
    },
  };

  async create(data: CreateSolicitudLeadDto, permissions: string[] = []) {
    this.assertCanCreate(permissions);

    return this.prisma.solicitudLead.create({
      data: {
        ...data,
        fecha_alta: new Date(data.fecha_alta),
        telefono: BigInt(data.telefono),
        presupuesto: data.presupuesto !== undefined ? Number(data.presupuesto) : undefined,
        solicitud: data.solicitud?.trim() || undefined,
        tipo_inmueble: data.tipo_inmueble?.trim() || undefined,
        metodo_pago: data.metodo_pago?.trim() || undefined,
        ubicacion: data.ubicacion?.trim() || undefined,
        numero_habitaciones: data.numero_habitaciones?.trim() || undefined,
        caracteristicas: data.caracteristicas?.trim() || undefined,
        seguimiento: data.seguimiento?.trim() || undefined,
        opciones_enviadas: data.opciones_enviadas?.trim() || undefined,
        medio: data.medio?.trim() || undefined,
        comentario_final: data.comentario_final?.trim() || undefined,
      },
      include: this.includeOptions,
    });
  }

  async findAll(permissions: string[] = []) {
    this.assertCanRead(permissions);

    return this.prisma.solicitudLead.findMany({
      include: this.includeOptions,
      orderBy: [{ fecha_alta: 'desc' }, { id: 'desc' }],
    });
  }

  async findOne(id: number, permissions: string[] = []) {
    this.assertCanRead(permissions);

    const solicitudLead = await this.prisma.solicitudLead.findUnique({
      where: { id },
      include: this.includeOptions,
    });

    if (!solicitudLead) {
      throw new NotFoundException(`Solicitud lead con ID ${id} no encontrada`);
    }

    return solicitudLead;
  }

  async update(
    id: number,
    data: Partial<CreateSolicitudLeadDto>,
    permissions: string[] = [],
  ) {
    this.assertCanUpdate(permissions);

    const currentSolicitud = await this.prisma.solicitudLead.findUnique({
      where: { id },
      include: this.includeOptions,
    });

    if (!currentSolicitud) {
      throw new NotFoundException(`Solicitud lead con ID ${id} no encontrada`);
    }

    return this.prisma.solicitudLead.update({
      where: { id },
      data: {
        ...(data.fecha_alta !== undefined ? { fecha_alta: new Date(data.fecha_alta) } : {}),
        ...(data.estado !== undefined ? { estado: data.estado } : {}),
        ...(data.vendedor_id !== undefined ? { vendedor_id: data.vendedor_id } : {}),
        ...(data.nombre !== undefined ? { nombre: data.nombre.trim() } : {}),
        ...(data.telefono !== undefined ? { telefono: BigInt(data.telefono) } : {}),
        ...(data.presupuesto !== undefined
          ? { presupuesto: data.presupuesto !== null ? Number(data.presupuesto) : null }
          : {}),
        ...(data.solicitud !== undefined ? { solicitud: data.solicitud?.trim() || null } : {}),
        ...(data.tipo_inmueble !== undefined ? { tipo_inmueble: data.tipo_inmueble?.trim() || null } : {}),
        ...(data.metodo_pago !== undefined ? { metodo_pago: data.metodo_pago?.trim() || null } : {}),
        ...(data.ubicacion !== undefined ? { ubicacion: data.ubicacion?.trim() || null } : {}),
        ...(data.numero_habitaciones !== undefined
          ? { numero_habitaciones: data.numero_habitaciones?.trim() || null }
          : {}),
        ...(data.caracteristicas !== undefined ? { caracteristicas: data.caracteristicas?.trim() || null } : {}),
        ...(data.seguimiento !== undefined ? { seguimiento: data.seguimiento?.trim() || null } : {}),
        ...(data.opciones_enviadas !== undefined
          ? { opciones_enviadas: data.opciones_enviadas?.trim() || null }
          : {}),
        ...(data.medio !== undefined ? { medio: data.medio?.trim() || null } : {}),
        ...(data.comentario_final !== undefined
          ? { comentario_final: data.comentario_final?.trim() || null }
          : {}),
      },
      include: this.includeOptions,
    });
  }

  async remove(id: number, permissions: string[] = []) {
    this.assertCanDelete(permissions);

    return this.prisma.solicitudLead.delete({
      where: { id },
    });
  }

  private assertCanCreate(permissions: string[]) {
    const canCreate =
      permissions.includes('*:*') ||
      permissions.includes('solicitudes_leads:*') ||
      permissions.includes('solicitudes_leads:crear');

    if (!canCreate) {
      throw new ForbiddenException('No tienes permisos para registrar solicitudes de leads.');
    }
  }

  private assertCanRead(permissions: string[]) {
    const canRead =
      permissions.includes('*:*') ||
      permissions.includes('solicitudes_leads:*') ||
      permissions.includes('solicitudes_leads:leer') ||
      permissions.includes('solicitudes_leads:leer_todos');

    if (!canRead) {
      throw new ForbiddenException('No tienes permisos para consultar solicitudes de leads.');
    }
  }

  private assertCanUpdate(permissions: string[]) {
    const canUpdate =
      permissions.includes('*:*') ||
      permissions.includes('solicitudes_leads:*') ||
      permissions.includes('solicitudes_leads:actualizar');

    if (!canUpdate) {
      throw new ForbiddenException('No tienes permisos para editar solicitudes de leads.');
    }
  }

  private assertCanDelete(permissions: string[]) {
    const canDelete =
      permissions.includes('*:*') ||
      permissions.includes('solicitudes_leads:*') ||
      permissions.includes('solicitudes_leads:eliminar');

    if (!canDelete) {
      throw new ForbiddenException('No tienes permisos para eliminar solicitudes de leads.');
    }
  }
}
""",
    )
    write(
        module_dir / "solicitudes-leads.controller.ts",
        """import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { CreateSolicitudLeadDto } from './dto/create-solicitud-lead.dto';
import { UpdateSolicitudLeadDto } from './dto/update-solicitud-lead.dto';
import { SolicitudesLeadsService } from './solicitudes-leads.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('solicitudes-leads')
export class SolicitudesLeadsController {
  constructor(private readonly service: SolicitudesLeadsService) {}

  @Post()
  @RequirePermissions('solicitudes_leads:crear')
  create(
    @Body() dto: CreateSolicitudLeadDto,
    @GetUser('permissions') permissions: string[],
  ) {
    return this.service.create(dto, permissions ?? []);
  }

  @Get()
  findAll(@GetUser('permissions') permissions: string[]) {
    return this.service.findAll(permissions ?? []);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser('permissions') permissions: string[],
  ) {
    return this.service.findOne(+id, permissions ?? []);
  }

  @Patch(':id')
  @RequirePermissions('solicitudes_leads:actualizar')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSolicitudLeadDto,
    @GetUser('permissions') permissions: string[],
  ) {
    return this.service.update(+id, dto, permissions ?? []);
  }

  @Delete(':id')
  @RequirePermissions('solicitudes_leads:eliminar')
  remove(
    @Param('id') id: string,
    @GetUser('permissions') permissions: string[],
  ) {
    return this.service.remove(+id, permissions ?? []);
  }
}
""",
    )
    write(
        module_dir / "solicitudes-leads.module.ts",
        """import { Module } from '@nestjs/common';
import { SolicitudesLeadsController } from './solicitudes-leads.controller';
import { SolicitudesLeadsService } from './solicitudes-leads.service';

@Module({
  controllers: [SolicitudesLeadsController],
  providers: [SolicitudesLeadsService],
})
export class SolicitudesLeadsModule {}
""",
    )


def update_app_module() -> None:
    path = ROOT / "src" / "app.module.ts"
    content = read(path)
    if "SolicitudesLeadsModule" not in content:
        content = replace_once(
            content,
            "import { RegistroLeadsModule } from './registro-leads/registro-leads.module';",
            "import { RegistroLeadsModule } from './registro-leads/registro-leads.module';\nimport { SolicitudesLeadsModule } from './solicitudes-leads/solicitudes-leads.module';",
        )
        content = replace_once(
            content,
            "    RegistroLeadsModule,",
            "    RegistroLeadsModule,\n    SolicitudesLeadsModule,",
        )
    write(path, content)


def update_logger() -> None:
    path = ROOT / "src" / "common" / "logger.interceptor.ts"
    content = read(path)
    if "  'solicitudes-leads': 'Solicitudes de leads'," not in content:
        content = content.replace(
            "  'registros-leads': 'Registros leads',",
            "  'registros-leads': 'Registros leads',\n  'solicitudes-leads': 'Solicitudes de leads',",
        )
    if "  'solicitudes-leads': 'solicitudLead'," not in content:
        content = content.replace(
            "  'registros-leads': 'registroLead',",
            "  'registros-leads': 'registroLead',\n  'solicitudes-leads': 'solicitudLead',",
        )
    if "moduleKey === 'solicitudes-leads'" not in content:
        old = """  if (moduleKey === 'registros-leads') {
    const fullName = [body.nombres, body.apellidos]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim())
      .join(' ');

    return fullName || 'un lead';
  }
"""
        new = """  if (moduleKey === 'registros-leads') {
    const fullName = [body.nombres, body.apellidos]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim())
      .join(' ');

    return fullName || 'un lead';
  }

  if (moduleKey === 'solicitudes-leads') {
    const fullName = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    return fullName || 'una solicitud';
  }
"""
        content = replace_once(content, old, new)
    write(path, content)


def update_seed() -> None:
    path = ROOT / "prisma" / "seed.ts"
    content = read(path)
    content = replace_once(
        content,
        "    'registros_leads',\n    'blogs',",
        "    'registros_leads',\n    'solicitudes_leads',\n    'blogs',",
    )
    if "permisos.push({ modulo: 'solicitudes_leads', accion: 'leer_todos' });" not in content:
        content = replace_once(
            content,
            "  permisos.push({ modulo: 'registros_leads', accion: 'leer_todos' });",
            "  permisos.push({ modulo: 'registros_leads', accion: 'leer_todos' });\n  permisos.push({ modulo: 'solicitudes_leads', accion: 'leer_todos' });",
        )

    if "permisosSolicitudesLeadRead" not in content:
        anchor = "  const permisoResumenPropiedadesVendidas = permisosDB.find("
        injected = """  const permisosSolicitudesLeadRead = permisosDB.find(
    (permission) =>
      permission.modulo === 'solicitudes_leads' &&
      permission.accion === 'leer',
  );

  const permisosSolicitudesLeadReadAll = permisosDB.find(
    (permission) =>
      permission.modulo === 'solicitudes_leads' &&
      permission.accion === 'leer_todos',
  );

  const permisosSolicitudesLeadCreate = permisosDB.find(
    (permission) =>
      permission.modulo === 'solicitudes_leads' &&
      permission.accion === 'crear',
  );

  const permisosSolicitudesLeadUpdate = permisosDB.find(
    (permission) =>
      permission.modulo === 'solicitudes_leads' &&
      permission.accion === 'actualizar',
  );

  const permisosSolicitudesLeadDelete = permisosDB.find(
    (permission) =>
      permission.modulo === 'solicitudes_leads' &&
      permission.accion === 'eliminar',
  );

"""
        content = replace_once(content, anchor, injected + anchor)

        block_anchor = """  if (permisosLeadDelete) {
    await prisma.rolPermiso.createMany({
      data: rolesBorrarLeads.map((role) => ({
        rol_id: role!.id,
        permiso_id: permisosLeadDelete.id,
      })),
      skipDuplicates: true,
    });
  }
"""
        block = """  if (permisosLeadDelete) {
    await prisma.rolPermiso.createMany({
      data: rolesBorrarLeads.map((role) => ({
        rol_id: role!.id,
        permiso_id: permisosLeadDelete.id,
      })),
      skipDuplicates: true,
    });
  }

  const rolesSolicitudesLeadsBase = [rolSuperAdmin, rolAdmin, rolMarketing, rolCoordinadorVentas].filter(Boolean);

  if (permisosSolicitudesLeadRead) {
    await prisma.rolPermiso.createMany({
      data: rolesSolicitudesLeadsBase.map((role) => ({
        rol_id: role!.id,
        permiso_id: permisosSolicitudesLeadRead.id,
      })),
      skipDuplicates: true,
    });
  }

  if (permisosSolicitudesLeadReadAll) {
    await prisma.rolPermiso.createMany({
      data: rolesSolicitudesLeadsBase.map((role) => ({
        rol_id: role!.id,
        permiso_id: permisosSolicitudesLeadReadAll.id,
      })),
      skipDuplicates: true,
    });
  }

  if (permisosSolicitudesLeadCreate) {
    await prisma.rolPermiso.createMany({
      data: rolesSolicitudesLeadsBase.map((role) => ({
        rol_id: role!.id,
        permiso_id: permisosSolicitudesLeadCreate.id,
      })),
      skipDuplicates: true,
    });
  }

  if (permisosSolicitudesLeadUpdate) {
    await prisma.rolPermiso.createMany({
      data: rolesSolicitudesLeadsBase.map((role) => ({
        rol_id: role!.id,
        permiso_id: permisosSolicitudesLeadUpdate.id,
      })),
      skipDuplicates: true,
    });
  }

  if (permisosSolicitudesLeadDelete) {
    await prisma.rolPermiso.createMany({
      data: [rolSuperAdmin].filter(Boolean).map((role) => ({
        rol_id: role!.id,
        permiso_id: permisosSolicitudesLeadDelete.id,
      })),
      skipDuplicates: true,
    });
  }
"""
        content = replace_once(content, block_anchor, block)

    write(path, content)


def main() -> None:
    update_schema()
    create_migration()
    create_module_files()
    update_app_module()
    update_logger()
    update_seed()
    print("Scaffold backend de solicitudes de leads generado.")


if __name__ == "__main__":
    main()
