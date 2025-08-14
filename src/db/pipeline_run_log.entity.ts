import {BaseEntity, Entity, Column, PrimaryColumn, Index} from 'typeorm';

@Entity('pipeline_runs_logs')
export class PipelineRunLog extends BaseEntity {
  @PrimaryColumn({type: 'uniqueidentifier'})
  id: string;

  @Index('IX_run_id')
  @Column({type: 'uniqueidentifier', nullable: false})
  run_id: string;

  @Column({type: 'datetime2', nullable: false})
  log_timestamp: Date;

  @Column({type: 'nvarchar', length: 'MAX'})
  log_message: string;
}
