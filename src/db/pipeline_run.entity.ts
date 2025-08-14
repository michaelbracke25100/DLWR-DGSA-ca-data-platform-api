import {Entity, Column, PrimaryColumn, AfterLoad, BeforeInsert, BeforeRemove, BeforeUpdate} from 'typeorm';
import {PipelineRunLog} from './pipeline_run_log.entity';

enum PipelineRunState {
  REQUESTED = 'REQUESTED',
  QUEUED = 'QUEUED',
  ESTIMATING = 'ESTIMATING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
}

@Entity('pipeline_runs')
export class PipelineRun {
  @PrimaryColumn({type: 'uniqueidentifier'})
  run_id: string;

  @Column({type: 'uuid', nullable: false})
  job_id: string;

  @Column({type: 'uuid', nullable: false})
  pipeline_id: string;

  @Column({type: 'nvarchar', length: 'MAX', nullable: false})
  run_parameters_compressed: string;

  @Column({type: 'nvarchar', length: 'MAX', nullable: false})
  run_parameters_hash: string;

  @Column({type: 'nvarchar', length: 100, enum: PipelineRunState, nullable: false})
  state: PipelineRunState;

  @Column({type: 'datetime2', precision: 3, nullable: false})
  queued_time: Date;

  @Column({type: 'datetime2', precision: 3, nullable: true})
  start_time: Date | null;

  @Column({type: 'bigint', nullable: true})
  estimated_duration: number | null;

  @Column({type: 'datetime2', precision: 3, nullable: true})
  end_time: Date | null;

  @Column({type: 'nvarchar', length: 255, nullable: true})
  modified_by: object | string;

  @AfterLoad()
  after() {
    if (typeof this.estimated_duration === 'string') this.estimated_duration = parseInt(this.estimated_duration);
    if (typeof this.modified_by === 'string') {
      this.modified_by = JSON.parse(this.modified_by);
    }
  }
  @BeforeInsert()
  @BeforeUpdate()
  @BeforeRemove()
  before() {
    if (typeof this.modified_by === 'object') {
      this.modified_by = JSON.stringify(this.modified_by);
    }
  }

  logs: PipelineRunLog[];
}
