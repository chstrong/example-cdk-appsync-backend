import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import {
	AccountRecovery,
	UserPool,
	UserPoolClient,
	VerificationEmailStyle,
} from 'aws-cdk-lib/aws-cognito'

import { Construct } from 'constructs'

interface AuthStackProps extends StackProps {
    appName: String,
    stage: String,
}

export class AuthStack extends Stack {
	public readonly userpool: UserPool
	public readonly userPoolClient: UserPoolClient

	constructor(scope: Construct, id: string, props: AuthStackProps) {
		super(scope, id, props)

		const userPool = new UserPool(this, `Userpool`, {
            userPoolName: `${props.appName.toLowerCase()}-userpool-${props.stage.toLowerCase()} `,
			selfSignUpEnabled: true,
			accountRecovery: AccountRecovery.EMAIL_ONLY,
            signInAliases: { email: true },
			userVerification: {emailStyle: VerificationEmailStyle.CODE},
			autoVerify: {email: true},
            passwordPolicy: {
                minLength: 6,
                requireLowercase: false,
                requireDigits: false,
                requireUppercase: false,
                requireSymbols: false,
            },
			standardAttributes: {
				email: {
					required: true,
					mutable: true,
				},
			},
            removalPolicy: RemovalPolicy.DESTROY,
		})

		const userPoolClient = new UserPoolClient(this, `UserpoolClient`, {
            userPoolClientName: `${props.appName.toLowerCase()}-userpoolclient-${props.stage.toLowerCase()} `,
			userPool,
		})

		this.userpool = userPool
		this.userPoolClient = userPoolClient

		new CfnOutput(this, 'UserPoolId', {
			value: userPool.userPoolId,
		})

		new CfnOutput(this, 'UserPoolClientId', {
			value: userPoolClient.userPoolClientId,
		})
	}
}