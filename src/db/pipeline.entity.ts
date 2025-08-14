import {Entity, Column, PrimaryColumn, AfterLoad, BeforeInsert, BeforeUpdate, BeforeRemove} from 'typeorm';

enum PipelineState {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  DELETED = 'DELETED',
  ERROR = 'ERROR',
}

enum PipelineType {
  DATABASE_SYNCHRONIZATION = 'DATABASE_SYNCHRONIZATION',
  FILE_SYNCHRONIZATION = 'FILE_SYNCHRONIZATION',
  DATABASE_TRANSFORMATION = 'DATABASE_TRANSFORMATION',
}

enum PipelinePrivacyLevel {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
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

@Entity('pipelines')
export class Pipeline {
  @PrimaryColumn({type: 'uuid'})
  pipeline_id: string;

  @Column({type: 'nvarchar', length: 255, nullable: false})
  name: string;

  @Column({type: 'nvarchar', length: 'MAX', nullable: true})
  description: string | null;

  @Column({type: 'nvarchar', length: 'MAX', nullable: false})
  parameters: object | string;

  @Column({type: 'uuid', nullable: false})
  job_id: string;

  @Column({type: 'uuid', nullable: true})
  linkedservice_id: string;

  @Column({type: 'nvarchar', length: 100, nullable: false})
  state: PipelineState;

  @Column({type: 'nvarchar', length: 100, nullable: false})
  type: PipelineType;

  @Column({type: 'nvarchar', length: 100, nullable: false})
  privacy_level: PipelinePrivacyLevel;

  @Column({type: 'nvarchar', length: 100, nullable: true})
  cron: string | null;

  @Column({type: 'datetime2', precision: 3, nullable: true})
  deleted_date: Date | null;

  @Column({type: 'datetime2', precision: 3, nullable: true})
  modified_date: Date | null;

  @Column({type: 'datetime2', precision: 3, nullable: true})
  created_date: Date | null;

  @Column({type: 'nvarchar', length: 255, nullable: true})
  modified_by: object | string;

  @Column({type: 'nvarchar', length: 255, nullable: true})
  owner: object | string;

  @Column({type: 'nvarchar', length: 255, nullable: true})
  user_groups: string[] | string | null;

  @AfterLoad()
  after() {
    if (typeof this.parameters === 'string') {
      this.parameters = JSON.parse(this.parameters);
    }
    if (typeof this.modified_by === 'string') {
      this.modified_by = JSON.parse(this.modified_by);
    }
    if (typeof this.user_groups === 'string') {
      try {
        this.user_groups = JSON.parse(this.user_groups);
        // Ensure it's always an array
        if (!Array.isArray(this.user_groups)) {
          this.user_groups = this.user_groups ? [this.user_groups] : [];
        }
      } catch {
        this.user_groups = [];
      }
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  @BeforeRemove()
  before() {
    if (typeof this.parameters === 'object') {
      this.parameters = JSON.stringify(this.parameters);
    }
    if (typeof this.modified_by === 'object') {
      this.modified_by = JSON.stringify(this.modified_by);
    }
    if (typeof this.user_groups === 'object') {
      this.user_groups = JSON.stringify(this.user_groups);
    }
  }

  metadata: Metadata;
}
