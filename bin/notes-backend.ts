#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
//import { NotesBackendStack } from '../lib/notes-backend-stack';
import { AuthStack } from '../lib/auth-stack';
import { FileStorageStack } from '../lib/file-storage-stack';
import { DatabaseStack } from '../lib/database-stack';
import { IdentityStack } from '../lib/identity-stack';
import { APIStack } from '../lib/api-stack';
import config from '../config.json';


const app = new cdk.App();

// new NotesBackendStack(app, 'NotesBackendStack', {});

const authStack = new AuthStack(app, 'AuthStack', {
  appName: config.appName,
  stage: config.stage,
})

const identityStack = new IdentityStack(app, 'IdentityStack', {
  appName: config.appName,
  stage: config.stage,
	userpool: authStack.userpool,
	userpoolClient: authStack.userPoolClient,
})

const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  appName: config.appName,
  stage: config.stage,
})

const apiStack = new APIStack(app, 'AppSyncAPIStack', {
  appName: config.appName,
  stage: config.stage,
	userpool: authStack.userpool,
	noteTable: databaseStack.noteTable,
  categoryTable: databaseStack.categoryTable,
	unauthenticatedRole: identityStack.unauthenticatedRole,
	identityPool: identityStack.identityPool,
})

/*

const fileStorageStack = new FileStorageStack(app, 'FileStorageStack', {
  appName: config.appName,
  stage: config.stage,
	authenticatedRole: identityStack.authenticatedRole,
	unauthenticatedRole: identityStack.unauthenticatedRole,
	allowedOrigins: ['http://localhost:3000'],
})

*/