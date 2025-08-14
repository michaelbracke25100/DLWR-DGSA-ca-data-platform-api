import {Entity, Column, PrimaryColumn} from 'typeorm';

@Entity('metadata')
export class Metadata {
  @PrimaryColumn({type: 'uuid'})
  metadata_id: string;

  @Column({type: 'uuid', nullable: true})
  pipeline_id: string | null;

  @Column({type: 'uuid', nullable: true})
  dataobject_id: string | null;

  @Column({type: 'nvarchar', length: 'MAX', nullable: true})
  business_unit: string | null;

  @Column({type: 'nvarchar', length: 'MAX', nullable: true})
  it_solution: string | null;

  @Column({type: 'nvarchar', length: 'MAX', nullable: true})
  eurovoc_subjects: string | null;

  @Column({type: 'nvarchar', length: 'MAX', nullable: true})
  business_data_owner: string | null;

  @Column({type: 'nvarchar', length: 'MAX', nullable: true})
  business_data_steward: string | null;

  @Column({type: 'nvarchar', length: 'MAX', nullable: true})
  technical_data_steward: string | null;

  @Column({type: 'nvarchar', length: 'MAX', nullable: true})
  domain: string | null;

  @Column({type: 'nvarchar', length: 'MAX', nullable: true})
  sub_domain: string | null;
}
