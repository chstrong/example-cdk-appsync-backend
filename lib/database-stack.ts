import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

interface DatabaseStackProps extends StackProps {
    appName: String,
    stage: String,
}

export class DatabaseStack extends Stack {
	public readonly noteTable: Table
	constructor(scope: Construct, id: string, props: DatabaseStackProps) {
		super(scope, id, props)

		const noteTable = new Table(this, 'NoteTable', {
            tableName: `${props.appName.toLowerCase()}-note-${props.stage.toLowerCase()}`,
			removalPolicy: RemovalPolicy.DESTROY,
			billingMode: BillingMode.PAY_PER_REQUEST,
			partitionKey: { name: 'id', type: AttributeType.STRING },
		})

		this.noteTable = noteTable
	}
}