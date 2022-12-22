import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'
import * as path from 'path'
import {
	GraphqlApi,
	SchemaFile,
	AuthorizationType,
	FieldLogLevel,
	MappingTemplate,
	PrimaryKey,
	Values,
} from '@aws-cdk/aws-appsync-alpha'
import { UserPool } from 'aws-cdk-lib/aws-cognito'
import { IRole } from 'aws-cdk-lib/aws-iam'
import { IdentityPool } from '@aws-cdk/aws-cognito-identitypool-alpha'

interface APIStackProps extends StackProps {
    appName: String,
    stage: String,
	userpool: UserPool
	noteTable: Table
    categoryTable: Table
	unauthenticatedRole: IRole
	identityPool: IdentityPool
}

export class APIStack extends Stack {
	constructor(scope: Construct, id: string, props: APIStackProps) {
		super(scope, id, props)

		const api = new GraphqlApi(this, 'GraphqlAPI', {
			name: `${props.appName.toLowerCase()}-${props.stage.toLowerCase()}`,
			schema: SchemaFile.fromAsset(path.join(__dirname, 'graphql/schema.graphql')),
			authorizationConfig: {
				defaultAuthorization: {
					authorizationType: AuthorizationType.USER_POOL,
					userPoolConfig: {
						userPool: props.userpool,
					},
				},
				additionalAuthorizationModes: [
					{ authorizationType: AuthorizationType.IAM },
				],
			},
			logConfig: {
				fieldLogLevel: FieldLogLevel.ALL,
			},
			xrayEnabled: false,
		});

		const NoteDataSource = api.addDynamoDbDataSource('NoteDataSource', props.noteTable);

		api.grantQuery(props.unauthenticatedRole, 'getNote', 'listNotes');

		NoteDataSource.createResolver('GetItemResolver', {
			typeName: 'Query',
			fieldName: 'getNote',
			requestMappingTemplate: MappingTemplate.dynamoDbGetItem('id', 'id'),
			responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
		});

		NoteDataSource.createResolver('CreateItemResolver', {
			typeName: 'Mutation',
			fieldName: 'createNote',
			requestMappingTemplate: MappingTemplate.dynamoDbPutItem(
				PrimaryKey.partition('id').auto(),
				Values.projecting('input')
			),
			responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
		});

		NoteDataSource.createResolver('UpdateItemResolver', {
			typeName: 'Mutation',
			fieldName: 'updateNote',
			requestMappingTemplate: MappingTemplate.dynamoDbPutItem(
				PrimaryKey.partition('id').is('input.id'),
				Values.projecting('input')
			),
			responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
		});
        
		NoteDataSource.createResolver('DeleteItemResolver', {
			typeName: 'Mutation',
			fieldName: 'deleteNote',
            requestMappingTemplate: MappingTemplate.dynamoDbDeleteItem('id', 'id'),
            responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
		});          

		NoteDataSource.createResolver('ListItemsResolver', {
			typeName: 'Query',
			fieldName: 'listNotes',
			requestMappingTemplate: MappingTemplate.dynamoDbScanTable(),
			responseMappingTemplate: MappingTemplate.dynamoDbResultList(),
		});

        NoteDataSource.createResolver('ListItemsTokenResolver', {
			typeName: 'Query',
			fieldName: 'listNotesToken',
			requestMappingTemplate: MappingTemplate.fromFile(
				path.join(__dirname, 'mappingTemplates/query-list-notes-token-req.vtl')
			),
			responseMappingTemplate: MappingTemplate.fromFile(
				path.join(__dirname, 'mappingTemplates/query-list-notes-token-res.vtl')
			),
		});



		const CategoryDataSource = api.addDynamoDbDataSource('CategoryDataSource', props.categoryTable);

		api.grantQuery(props.unauthenticatedRole, 'getCategory', 'listCategories');

		CategoryDataSource.createResolver('CategoryGetItemResolver', {
			typeName: 'Query',
			fieldName: 'getCategory',
			requestMappingTemplate: MappingTemplate.dynamoDbGetItem('id', 'id'),
			responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
		});

		CategoryDataSource.createResolver('CategoryCreateItemResolver', {
			typeName: 'Mutation',
			fieldName: 'createCategory',
			requestMappingTemplate: MappingTemplate.dynamoDbPutItem(
				PrimaryKey.partition('id').auto(),
				Values.projecting('input')
			),
			responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
		});

		CategoryDataSource.createResolver('CategoryUpdateItemResolver', {
			typeName: 'Mutation',
			fieldName: 'updateCategory',
			requestMappingTemplate: MappingTemplate.dynamoDbPutItem(
				PrimaryKey.partition('id').is('input.id'),
				Values.projecting('input')
			),
			responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
		});
        
		CategoryDataSource.createResolver('CategoryDeleteItemResolver', {
			typeName: 'Mutation',
			fieldName: 'deleteCategory',
            requestMappingTemplate: MappingTemplate.dynamoDbDeleteItem('id', 'id'),
            responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
		});          

		CategoryDataSource.createResolver('CategoryListItemsResolver', {
			typeName: 'Query',
			fieldName: 'listCategories',
			requestMappingTemplate: MappingTemplate.dynamoDbScanTable(),
			responseMappingTemplate: MappingTemplate.dynamoDbResultList(),
		});

		new CfnOutput(this, 'GraphQLAPIURL', {
			value: api.graphqlUrl,
		});

		new CfnOutput(this, 'GraphQLAPIID', {
			value: api.apiId,
		});
	}
}