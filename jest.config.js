/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'result.xml',
      },
    ],
  ],
  testEnvironment: 'node',
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
  collectCoverageFrom: [
    'src/**/DataObjectController.ts',
    'src/**/LinkedServiceController.ts',
    'src/**/PipelineController.ts',
    'src/**/PipelineRunOutputController.ts',
    'src/**/SecretController.ts',
    'src/db/data_object.entity.ts',
    'src/db/pipeline_run_output.entity.ts',
    'src/db/pipeline_run.entity.ts',
    'src/db/pipeline.entity.ts',
    'src/db/secret.entity.ts',
    'src/**/DataObjectService.ts',
    'src/**/PipelineEntityService.ts',
    'src/**/PipelineRunOutputEntityService.ts',
    'src/**/SecretEntityService.ts',
  ],
  coverageReporters: ['lcov', 'cobertura', 'html'],
  testResultsProcessor: 'jest-junit',
  coverageDirectory: 'coverage',
};
