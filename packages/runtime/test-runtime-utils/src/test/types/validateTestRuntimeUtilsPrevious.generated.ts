/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
 * Generated by flub generate:typetests in @fluid-tools/build-cli.
 */

import type * as old from "@fluidframework/test-runtime-utils-previous/internal";

import type * as current from "../../index.js";

type ValueOf<T> = T[keyof T];
type OnlySymbols<T> = T extends symbol ? T : never;
type WellKnownSymbols = OnlySymbols<ValueOf<typeof Symbol>>;
/**
 * Omit (replace with never) a key if it is a custom symbol,
 * not just symbol or a well known symbol from the global Symbol.
 */
type SkipUniqueSymbols<Key> = symbol extends Key
	? Key // Key is symbol or a generalization of symbol, so leave it as is.
	: Key extends symbol
		? Key extends WellKnownSymbols
			? Key // Key is a well known symbol from the global Symbol object. These are shared between packages, so they are fine and kept as is.
			: never // Key is most likely some specialized symbol, typically a unique symbol. These break type comparisons so are removed by replacing them with never.
		: Key; // Key is not a symbol (for example its a string or number), so leave it as is.
/**
 * Remove details of T which are incompatible with type testing while keeping as much as is practical.
 *
 * See 'build-tools/packages/build-tools/src/typeValidator/compatibility.ts' for more information.
 */
type TypeOnly<T> = T extends number
	? number
	: T extends boolean | bigint | string
		? T
		: T extends symbol
			? SkipUniqueSymbols<T>
			: {
					[P in keyof T as SkipUniqueSymbols<P>]: TypeOnly<T[P]>;
				};

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IInsecureUser": {"forwardCompat": false}
 */
declare function get_old_InterfaceDeclaration_IInsecureUser():
    TypeOnly<old.IInsecureUser>;
declare function use_current_InterfaceDeclaration_IInsecureUser(
    use: TypeOnly<current.IInsecureUser>): void;
use_current_InterfaceDeclaration_IInsecureUser(
    get_old_InterfaceDeclaration_IInsecureUser());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IInsecureUser": {"backCompat": false}
 */
declare function get_current_InterfaceDeclaration_IInsecureUser():
    TypeOnly<current.IInsecureUser>;
declare function use_old_InterfaceDeclaration_IInsecureUser(
    use: TypeOnly<old.IInsecureUser>): void;
use_old_InterfaceDeclaration_IInsecureUser(
    get_current_InterfaceDeclaration_IInsecureUser());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IInternalMockRuntimeMessage": {"forwardCompat": false}
 */
declare function get_old_InterfaceDeclaration_IInternalMockRuntimeMessage():
    TypeOnly<old.IInternalMockRuntimeMessage>;
declare function use_current_InterfaceDeclaration_IInternalMockRuntimeMessage(
    use: TypeOnly<current.IInternalMockRuntimeMessage>): void;
use_current_InterfaceDeclaration_IInternalMockRuntimeMessage(
    get_old_InterfaceDeclaration_IInternalMockRuntimeMessage());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IInternalMockRuntimeMessage": {"backCompat": false}
 */
declare function get_current_InterfaceDeclaration_IInternalMockRuntimeMessage():
    TypeOnly<current.IInternalMockRuntimeMessage>;
declare function use_old_InterfaceDeclaration_IInternalMockRuntimeMessage(
    use: TypeOnly<old.IInternalMockRuntimeMessage>): void;
use_old_InterfaceDeclaration_IInternalMockRuntimeMessage(
    get_current_InterfaceDeclaration_IInternalMockRuntimeMessage());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IMockContainerRuntimeOptions": {"forwardCompat": false}
 */
declare function get_old_InterfaceDeclaration_IMockContainerRuntimeOptions():
    TypeOnly<old.IMockContainerRuntimeOptions>;
declare function use_current_InterfaceDeclaration_IMockContainerRuntimeOptions(
    use: TypeOnly<current.IMockContainerRuntimeOptions>): void;
use_current_InterfaceDeclaration_IMockContainerRuntimeOptions(
    get_old_InterfaceDeclaration_IMockContainerRuntimeOptions());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IMockContainerRuntimeOptions": {"backCompat": false}
 */
declare function get_current_InterfaceDeclaration_IMockContainerRuntimeOptions():
    TypeOnly<current.IMockContainerRuntimeOptions>;
declare function use_old_InterfaceDeclaration_IMockContainerRuntimeOptions(
    use: TypeOnly<old.IMockContainerRuntimeOptions>): void;
use_old_InterfaceDeclaration_IMockContainerRuntimeOptions(
    get_current_InterfaceDeclaration_IMockContainerRuntimeOptions());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IMockContainerRuntimePendingMessage": {"forwardCompat": false}
 */
declare function get_old_InterfaceDeclaration_IMockContainerRuntimePendingMessage():
    TypeOnly<old.IMockContainerRuntimePendingMessage>;
declare function use_current_InterfaceDeclaration_IMockContainerRuntimePendingMessage(
    use: TypeOnly<current.IMockContainerRuntimePendingMessage>): void;
use_current_InterfaceDeclaration_IMockContainerRuntimePendingMessage(
    get_old_InterfaceDeclaration_IMockContainerRuntimePendingMessage());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IMockContainerRuntimePendingMessage": {"backCompat": false}
 */
declare function get_current_InterfaceDeclaration_IMockContainerRuntimePendingMessage():
    TypeOnly<current.IMockContainerRuntimePendingMessage>;
declare function use_old_InterfaceDeclaration_IMockContainerRuntimePendingMessage(
    use: TypeOnly<old.IMockContainerRuntimePendingMessage>): void;
use_old_InterfaceDeclaration_IMockContainerRuntimePendingMessage(
    get_current_InterfaceDeclaration_IMockContainerRuntimePendingMessage());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_InsecureTokenProvider": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_InsecureTokenProvider():
    TypeOnly<old.InsecureTokenProvider>;
declare function use_current_ClassDeclaration_InsecureTokenProvider(
    use: TypeOnly<current.InsecureTokenProvider>): void;
use_current_ClassDeclaration_InsecureTokenProvider(
    get_old_ClassDeclaration_InsecureTokenProvider());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_InsecureTokenProvider": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_InsecureTokenProvider():
    TypeOnly<current.InsecureTokenProvider>;
declare function use_old_ClassDeclaration_InsecureTokenProvider(
    use: TypeOnly<old.InsecureTokenProvider>): void;
use_old_ClassDeclaration_InsecureTokenProvider(
    get_current_ClassDeclaration_InsecureTokenProvider());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockAudience": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_MockAudience():
    TypeOnly<old.MockAudience>;
declare function use_current_ClassDeclaration_MockAudience(
    use: TypeOnly<current.MockAudience>): void;
use_current_ClassDeclaration_MockAudience(
    get_old_ClassDeclaration_MockAudience());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockAudience": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_MockAudience():
    TypeOnly<current.MockAudience>;
declare function use_old_ClassDeclaration_MockAudience(
    use: TypeOnly<old.MockAudience>): void;
use_old_ClassDeclaration_MockAudience(
    get_current_ClassDeclaration_MockAudience());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockContainerRuntime": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_MockContainerRuntime():
    TypeOnly<old.MockContainerRuntime>;
declare function use_current_ClassDeclaration_MockContainerRuntime(
    use: TypeOnly<current.MockContainerRuntime>): void;
use_current_ClassDeclaration_MockContainerRuntime(
    get_old_ClassDeclaration_MockContainerRuntime());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockContainerRuntime": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_MockContainerRuntime():
    TypeOnly<current.MockContainerRuntime>;
declare function use_old_ClassDeclaration_MockContainerRuntime(
    use: TypeOnly<old.MockContainerRuntime>): void;
use_old_ClassDeclaration_MockContainerRuntime(
    get_current_ClassDeclaration_MockContainerRuntime());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockContainerRuntimeFactory": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_MockContainerRuntimeFactory():
    TypeOnly<old.MockContainerRuntimeFactory>;
declare function use_current_ClassDeclaration_MockContainerRuntimeFactory(
    use: TypeOnly<current.MockContainerRuntimeFactory>): void;
use_current_ClassDeclaration_MockContainerRuntimeFactory(
    get_old_ClassDeclaration_MockContainerRuntimeFactory());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockContainerRuntimeFactory": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_MockContainerRuntimeFactory():
    TypeOnly<current.MockContainerRuntimeFactory>;
declare function use_old_ClassDeclaration_MockContainerRuntimeFactory(
    use: TypeOnly<old.MockContainerRuntimeFactory>): void;
use_old_ClassDeclaration_MockContainerRuntimeFactory(
    get_current_ClassDeclaration_MockContainerRuntimeFactory());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockContainerRuntimeFactoryForReconnection": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_MockContainerRuntimeFactoryForReconnection():
    TypeOnly<old.MockContainerRuntimeFactoryForReconnection>;
declare function use_current_ClassDeclaration_MockContainerRuntimeFactoryForReconnection(
    use: TypeOnly<current.MockContainerRuntimeFactoryForReconnection>): void;
use_current_ClassDeclaration_MockContainerRuntimeFactoryForReconnection(
    get_old_ClassDeclaration_MockContainerRuntimeFactoryForReconnection());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockContainerRuntimeFactoryForReconnection": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_MockContainerRuntimeFactoryForReconnection():
    TypeOnly<current.MockContainerRuntimeFactoryForReconnection>;
declare function use_old_ClassDeclaration_MockContainerRuntimeFactoryForReconnection(
    use: TypeOnly<old.MockContainerRuntimeFactoryForReconnection>): void;
use_old_ClassDeclaration_MockContainerRuntimeFactoryForReconnection(
    get_current_ClassDeclaration_MockContainerRuntimeFactoryForReconnection());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockContainerRuntimeForReconnection": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_MockContainerRuntimeForReconnection():
    TypeOnly<old.MockContainerRuntimeForReconnection>;
declare function use_current_ClassDeclaration_MockContainerRuntimeForReconnection(
    use: TypeOnly<current.MockContainerRuntimeForReconnection>): void;
use_current_ClassDeclaration_MockContainerRuntimeForReconnection(
    get_old_ClassDeclaration_MockContainerRuntimeForReconnection());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockContainerRuntimeForReconnection": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_MockContainerRuntimeForReconnection():
    TypeOnly<current.MockContainerRuntimeForReconnection>;
declare function use_old_ClassDeclaration_MockContainerRuntimeForReconnection(
    use: TypeOnly<old.MockContainerRuntimeForReconnection>): void;
use_old_ClassDeclaration_MockContainerRuntimeForReconnection(
    get_current_ClassDeclaration_MockContainerRuntimeForReconnection());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockDeltaConnection": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_MockDeltaConnection():
    TypeOnly<old.MockDeltaConnection>;
declare function use_current_ClassDeclaration_MockDeltaConnection(
    use: TypeOnly<current.MockDeltaConnection>): void;
use_current_ClassDeclaration_MockDeltaConnection(
    get_old_ClassDeclaration_MockDeltaConnection());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockDeltaConnection": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_MockDeltaConnection():
    TypeOnly<current.MockDeltaConnection>;
declare function use_old_ClassDeclaration_MockDeltaConnection(
    use: TypeOnly<old.MockDeltaConnection>): void;
use_old_ClassDeclaration_MockDeltaConnection(
    get_current_ClassDeclaration_MockDeltaConnection());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockDeltaManager": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_MockDeltaManager():
    TypeOnly<old.MockDeltaManager>;
declare function use_current_ClassDeclaration_MockDeltaManager(
    use: TypeOnly<current.MockDeltaManager>): void;
use_current_ClassDeclaration_MockDeltaManager(
    get_old_ClassDeclaration_MockDeltaManager());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockDeltaManager": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_MockDeltaManager():
    TypeOnly<current.MockDeltaManager>;
declare function use_old_ClassDeclaration_MockDeltaManager(
    use: TypeOnly<old.MockDeltaManager>): void;
use_old_ClassDeclaration_MockDeltaManager(
    get_current_ClassDeclaration_MockDeltaManager());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockDeltaQueue": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_MockDeltaQueue():
    TypeOnly<old.MockDeltaQueue<any>>;
declare function use_current_ClassDeclaration_MockDeltaQueue(
    use: TypeOnly<current.MockDeltaQueue<any>>): void;
use_current_ClassDeclaration_MockDeltaQueue(
    get_old_ClassDeclaration_MockDeltaQueue());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockDeltaQueue": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_MockDeltaQueue():
    TypeOnly<current.MockDeltaQueue<any>>;
declare function use_old_ClassDeclaration_MockDeltaQueue(
    use: TypeOnly<old.MockDeltaQueue<any>>): void;
use_old_ClassDeclaration_MockDeltaQueue(
    get_current_ClassDeclaration_MockDeltaQueue());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockEmptyDeltaConnection": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_MockEmptyDeltaConnection():
    TypeOnly<old.MockEmptyDeltaConnection>;
declare function use_current_ClassDeclaration_MockEmptyDeltaConnection(
    use: TypeOnly<current.MockEmptyDeltaConnection>): void;
use_current_ClassDeclaration_MockEmptyDeltaConnection(
    get_old_ClassDeclaration_MockEmptyDeltaConnection());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockEmptyDeltaConnection": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_MockEmptyDeltaConnection():
    TypeOnly<current.MockEmptyDeltaConnection>;
declare function use_old_ClassDeclaration_MockEmptyDeltaConnection(
    use: TypeOnly<old.MockEmptyDeltaConnection>): void;
use_old_ClassDeclaration_MockEmptyDeltaConnection(
    get_current_ClassDeclaration_MockEmptyDeltaConnection());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockFluidDataStoreContext": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_MockFluidDataStoreContext():
    TypeOnly<old.MockFluidDataStoreContext>;
declare function use_current_ClassDeclaration_MockFluidDataStoreContext(
    use: TypeOnly<current.MockFluidDataStoreContext>): void;
use_current_ClassDeclaration_MockFluidDataStoreContext(
    // @ts-expect-error compatibility expected to be broken
    get_old_ClassDeclaration_MockFluidDataStoreContext());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockFluidDataStoreContext": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_MockFluidDataStoreContext():
    TypeOnly<current.MockFluidDataStoreContext>;
declare function use_old_ClassDeclaration_MockFluidDataStoreContext(
    use: TypeOnly<old.MockFluidDataStoreContext>): void;
use_old_ClassDeclaration_MockFluidDataStoreContext(
    // @ts-expect-error compatibility expected to be broken
    get_current_ClassDeclaration_MockFluidDataStoreContext());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockFluidDataStoreRuntime": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_MockFluidDataStoreRuntime():
    TypeOnly<old.MockFluidDataStoreRuntime>;
declare function use_current_ClassDeclaration_MockFluidDataStoreRuntime(
    use: TypeOnly<current.MockFluidDataStoreRuntime>): void;
use_current_ClassDeclaration_MockFluidDataStoreRuntime(
    // @ts-expect-error compatibility expected to be broken
    get_old_ClassDeclaration_MockFluidDataStoreRuntime());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockFluidDataStoreRuntime": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_MockFluidDataStoreRuntime():
    TypeOnly<current.MockFluidDataStoreRuntime>;
declare function use_old_ClassDeclaration_MockFluidDataStoreRuntime(
    use: TypeOnly<old.MockFluidDataStoreRuntime>): void;
use_old_ClassDeclaration_MockFluidDataStoreRuntime(
    get_current_ClassDeclaration_MockFluidDataStoreRuntime());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockHandle": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_MockHandle():
    TypeOnly<old.MockHandle<any>>;
declare function use_current_ClassDeclaration_MockHandle(
    use: TypeOnly<current.MockHandle<any>>): void;
use_current_ClassDeclaration_MockHandle(
    get_old_ClassDeclaration_MockHandle());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockHandle": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_MockHandle():
    TypeOnly<current.MockHandle<any>>;
declare function use_old_ClassDeclaration_MockHandle(
    use: TypeOnly<old.MockHandle<any>>): void;
use_old_ClassDeclaration_MockHandle(
    get_current_ClassDeclaration_MockHandle());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockObjectStorageService": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_MockObjectStorageService():
    TypeOnly<old.MockObjectStorageService>;
declare function use_current_ClassDeclaration_MockObjectStorageService(
    use: TypeOnly<current.MockObjectStorageService>): void;
use_current_ClassDeclaration_MockObjectStorageService(
    get_old_ClassDeclaration_MockObjectStorageService());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockObjectStorageService": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_MockObjectStorageService():
    TypeOnly<current.MockObjectStorageService>;
declare function use_old_ClassDeclaration_MockObjectStorageService(
    use: TypeOnly<old.MockObjectStorageService>): void;
use_old_ClassDeclaration_MockObjectStorageService(
    get_current_ClassDeclaration_MockObjectStorageService());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockQuorumClients": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_MockQuorumClients():
    TypeOnly<old.MockQuorumClients>;
declare function use_current_ClassDeclaration_MockQuorumClients(
    use: TypeOnly<current.MockQuorumClients>): void;
use_current_ClassDeclaration_MockQuorumClients(
    get_old_ClassDeclaration_MockQuorumClients());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockQuorumClients": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_MockQuorumClients():
    TypeOnly<current.MockQuorumClients>;
declare function use_old_ClassDeclaration_MockQuorumClients(
    use: TypeOnly<old.MockQuorumClients>): void;
use_old_ClassDeclaration_MockQuorumClients(
    get_current_ClassDeclaration_MockQuorumClients());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockSharedObjectServices": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_MockSharedObjectServices():
    TypeOnly<old.MockSharedObjectServices>;
declare function use_current_ClassDeclaration_MockSharedObjectServices(
    use: TypeOnly<current.MockSharedObjectServices>): void;
use_current_ClassDeclaration_MockSharedObjectServices(
    get_old_ClassDeclaration_MockSharedObjectServices());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockSharedObjectServices": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_MockSharedObjectServices():
    TypeOnly<current.MockSharedObjectServices>;
declare function use_old_ClassDeclaration_MockSharedObjectServices(
    use: TypeOnly<old.MockSharedObjectServices>): void;
use_old_ClassDeclaration_MockSharedObjectServices(
    get_current_ClassDeclaration_MockSharedObjectServices());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockStorage": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_MockStorage():
    TypeOnly<old.MockStorage>;
declare function use_current_ClassDeclaration_MockStorage(
    use: TypeOnly<current.MockStorage>): void;
use_current_ClassDeclaration_MockStorage(
    get_old_ClassDeclaration_MockStorage());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_MockStorage": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_MockStorage():
    TypeOnly<current.MockStorage>;
declare function use_old_ClassDeclaration_MockStorage(
    use: TypeOnly<old.MockStorage>): void;
use_old_ClassDeclaration_MockStorage(
    get_current_ClassDeclaration_MockStorage());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "FunctionDeclaration_deepFreeze": {"forwardCompat": false}
 */
declare function get_old_FunctionDeclaration_deepFreeze():
    TypeOnly<typeof old.deepFreeze>;
declare function use_current_FunctionDeclaration_deepFreeze(
    use: TypeOnly<typeof current.deepFreeze>): void;
use_current_FunctionDeclaration_deepFreeze(
    get_old_FunctionDeclaration_deepFreeze());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "FunctionDeclaration_deepFreeze": {"backCompat": false}
 */
declare function get_current_FunctionDeclaration_deepFreeze():
    TypeOnly<typeof current.deepFreeze>;
declare function use_old_FunctionDeclaration_deepFreeze(
    use: TypeOnly<typeof old.deepFreeze>): void;
use_old_FunctionDeclaration_deepFreeze(
    get_current_FunctionDeclaration_deepFreeze());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "FunctionDeclaration_validateAssertionError": {"forwardCompat": false}
 */
declare function get_old_FunctionDeclaration_validateAssertionError():
    TypeOnly<typeof old.validateAssertionError>;
declare function use_current_FunctionDeclaration_validateAssertionError(
    use: TypeOnly<typeof current.validateAssertionError>): void;
use_current_FunctionDeclaration_validateAssertionError(
    get_old_FunctionDeclaration_validateAssertionError());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "FunctionDeclaration_validateAssertionError": {"backCompat": false}
 */
declare function get_current_FunctionDeclaration_validateAssertionError():
    TypeOnly<typeof current.validateAssertionError>;
declare function use_old_FunctionDeclaration_validateAssertionError(
    use: TypeOnly<typeof old.validateAssertionError>): void;
use_old_FunctionDeclaration_validateAssertionError(
    get_current_FunctionDeclaration_validateAssertionError());
