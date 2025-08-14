import { Entity, Column, PrimaryColumn, AfterLoad, BeforeInsert, BeforeRemove, BeforeUpdate } from 'typeorm';

enum DataObjectState {
  UNPUBLISHED = 'UNPUBLISHED',
  PUBLISHED = 'PUBLISHED',
  DELETED = 'DELETED',
}

export enum DataObjectManagedBy {
  DATAOBJECT = 'DATAOBJECT',
  PIPELINE = 'PIPELINE',
}
interface Metadata {
  business_unit: string | null;
  it_solution: string | null;
  eurovoc_subjects: string | null;
  business_data_owner: string | null;
  business_data_steward: string | null;
  technical_data_steward: string | null;
  domain: string | null;
  sub_domain: string | null;
}
@Entity('data_objects')
export class DataObject {
  @PrimaryColumn({ type: 'uuid' })
  dataobject_id: string;

  @Column({ type: 'uuid', nullable: true })
  pipeline_id: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: false })
  type: string;

  @Column({ type: 'nvarchar', length: 255, nullable: false })
  state: DataObjectState;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  modified_by: { name: string; user_id: string | null } | string | null;

  @Column({ type: 'datetime2', precision: 3, nullable: true })
  uploaded_date: Date | null;

  @Column({ type: 'datetime2', precision: 3, nullable: true })
  modified_date: Date | null;

  @Column({ type: 'datetime2', precision: 3, nullable: true })
  deleted_date: Date | null;

  @Column({ type: 'nvarchar', length: 255, nullable: false, default: DataObjectManagedBy.DATAOBJECT })
  managed_by: DataObjectManagedBy;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  user_groups: string[] | string | null;

  @Column({ type: 'bit', nullable: true, default: false })
  is_enabled_for_download_apis: boolean;

  @AfterLoad()
  after() {
    if (typeof this.modified_by === 'string') {
      this.modified_by = JSON.parse(this.modified_by);
    }
    if (typeof this.user_groups === 'string') {
      this.user_groups = JSON.parse(this.user_groups);
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  @BeforeRemove()
  before() {
    if (typeof this.modified_by === 'object') {
      this.modified_by = JSON.stringify(this.modified_by);
    }
    if (typeof this.user_groups === 'object') {
      this.user_groups = JSON.stringify(this.user_groups);
    }
  }

  metadata: Metadata | null | undefined;
}
