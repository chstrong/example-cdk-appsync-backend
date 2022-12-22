import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import {
  CfnOutput,
  Duration,
  Expiration,
  RemovalPolicy,
  Stack,
  StackProps,
} from 'aws-cdk-lib'

import {
  GraphqlApi,
  SchemaFile,
  AuthorizationType,
  FieldLogLevel,
  MappingTemplate,
} from '@aws-cdk/aws-appsync-alpha';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class NotesBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const notesTable = new Table(this, "NotesTable", {
      tableName: '99cloud-notestable',
      partitionKey: { name: "ID", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const api = new GraphqlApi(this, 'NotesAPI', {
      name: 'NotesAPI',
      schema: SchemaFile.fromAsset(path.join(__dirname, 'schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.API_KEY,
          apiKeyConfig: {
            description: 'Public scan for notes',
            expires: Expiration.after(Duration.days(30)),
            name: 'API Key for notes',
          },
        },
      },
      logConfig: {
        fieldLogLevel: FieldLogLevel.ALL,
      },
      xrayEnabled: false,
    })

    api.addDynamoDbDataSource('listNotes', notesTable).createResolver('listNotesResolver', {
			typeName: 'Query',
			fieldName: 'listNotes',
			requestMappingTemplate: MappingTemplate.fromFile(
				path.join(__dirname, 'mappingTemplates/Query.listUsers.req.vtl')
			),
			responseMappingTemplate: MappingTemplate.fromFile(
				path.join(__dirname, 'mappingTemplates/Query.listUsers.res.vtl')
			),
		})

  }
}
