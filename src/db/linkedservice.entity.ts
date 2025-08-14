import {Entity, Column, PrimaryColumn, AfterLoad, BeforeInsert, BeforeRemove, BeforeUpdate} from 'typeorm';

enum LinkedServiceType {
  // AZUREKEYVAULTSECRET = 'AZUREKEYVAULTSECRET',
  // AZURESTORAGE = 'AZURESTORAGE',
  ORACLESQL = 'ORACLESQL',
  // AZURESQL = 'AZURESQL',
}
enum LinkedServiceState {
  CREATED = 'CREATED',
  VALIDATING = 'VALIDATING',
  CONNECTED = 'CONNECTED',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

@Entity('linkedservices')
export class LinkedService {
  @PrimaryColumn({type: 'uniqueidentifier'})
  linkedservice_id: string;

  @Column({type: 'nvarchar', length: 100, nullable: false})
  state: LinkedServiceState;

  @Column({type: 'nvarchar', length: 255, nullable: false})
  type: LinkedServiceType;

  @Column({type: 'nvarchar', length: 'MAX', nullable: false})
  config: object | string;

  @Column({type: 'datetime2', precision: 3, nullable: false})
  created_date: Date;

  @Column({type: 'datetime2', precision: 3, nullable: true})
  modified_date: Date | null;

  @AfterLoad()
  after() {
    if (typeof this.config === 'string') {
      this.config = JSON.parse(this.config);
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  @BeforeRemove()
  before() {
    if (typeof this.config === 'object') {
      this.config = JSON.stringify(this.config);
    }
  }
}
