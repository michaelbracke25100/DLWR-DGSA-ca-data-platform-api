import {BaseEntity, Entity, Column, PrimaryColumn, Index} from 'typeorm';

export enum PipelineRunOutputType {
  JSON = 'JSON',
  CSV = 'CSV',
  XML = 'XML',
  BINARY = 'BINARY',
  ERROR = 'ERROR',
}

@Entity('pipeline_runs_outputs')
export class PipelineRunOutput extends BaseEntity {
  @PrimaryColumn({type: 'uniqueidentifier'})
  id: string;

  @Index('IX_run_id')
  @Column({type: 'uniqueidentifier', nullable: false})
  run_id: string;

  @Column({type: 'nvarchar', length: 100, enum: PipelineRunOutputType, nullable: false})
  type: PipelineRunOutputType;

  @Column({type: 'nvarchar', length: 255, nullable: true})
  size: string | null;

  @Column({type: 'nvarchar', length: 255, nullable: false})
  location: string;
}
