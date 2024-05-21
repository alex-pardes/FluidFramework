/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
 * Generated by flub generate:typetests in @fluid-tools/build-cli.
 */

import type * as old from "@fluidframework/synthesize-previous/internal";

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
 * "TypeAliasDeclaration_AsyncFluidObjectProvider": {"forwardCompat": false}
 */
declare function get_old_TypeAliasDeclaration_AsyncFluidObjectProvider():
    TypeOnly<old.AsyncFluidObjectProvider<any>>;
declare function use_current_TypeAliasDeclaration_AsyncFluidObjectProvider(
    use: TypeOnly<current.AsyncFluidObjectProvider<any>>): void;
use_current_TypeAliasDeclaration_AsyncFluidObjectProvider(
    get_old_TypeAliasDeclaration_AsyncFluidObjectProvider());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_AsyncFluidObjectProvider": {"backCompat": false}
 */
declare function get_current_TypeAliasDeclaration_AsyncFluidObjectProvider():
    TypeOnly<current.AsyncFluidObjectProvider<any>>;
declare function use_old_TypeAliasDeclaration_AsyncFluidObjectProvider(
    use: TypeOnly<old.AsyncFluidObjectProvider<any>>): void;
use_old_TypeAliasDeclaration_AsyncFluidObjectProvider(
    get_current_TypeAliasDeclaration_AsyncFluidObjectProvider());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_AsyncOptionalFluidObjectProvider": {"forwardCompat": false}
 */
declare function get_old_TypeAliasDeclaration_AsyncOptionalFluidObjectProvider():
    TypeOnly<old.AsyncOptionalFluidObjectProvider<any>>;
declare function use_current_TypeAliasDeclaration_AsyncOptionalFluidObjectProvider(
    use: TypeOnly<current.AsyncOptionalFluidObjectProvider<any>>): void;
use_current_TypeAliasDeclaration_AsyncOptionalFluidObjectProvider(
    get_old_TypeAliasDeclaration_AsyncOptionalFluidObjectProvider());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_AsyncOptionalFluidObjectProvider": {"backCompat": false}
 */
declare function get_current_TypeAliasDeclaration_AsyncOptionalFluidObjectProvider():
    TypeOnly<current.AsyncOptionalFluidObjectProvider<any>>;
declare function use_old_TypeAliasDeclaration_AsyncOptionalFluidObjectProvider(
    use: TypeOnly<old.AsyncOptionalFluidObjectProvider<any>>): void;
use_old_TypeAliasDeclaration_AsyncOptionalFluidObjectProvider(
    get_current_TypeAliasDeclaration_AsyncOptionalFluidObjectProvider());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_AsyncRequiredFluidObjectProvider": {"forwardCompat": false}
 */
declare function get_old_TypeAliasDeclaration_AsyncRequiredFluidObjectProvider():
    TypeOnly<old.AsyncRequiredFluidObjectProvider<any>>;
declare function use_current_TypeAliasDeclaration_AsyncRequiredFluidObjectProvider(
    use: TypeOnly<current.AsyncRequiredFluidObjectProvider<any>>): void;
use_current_TypeAliasDeclaration_AsyncRequiredFluidObjectProvider(
    get_old_TypeAliasDeclaration_AsyncRequiredFluidObjectProvider());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_AsyncRequiredFluidObjectProvider": {"backCompat": false}
 */
declare function get_current_TypeAliasDeclaration_AsyncRequiredFluidObjectProvider():
    TypeOnly<current.AsyncRequiredFluidObjectProvider<any>>;
declare function use_old_TypeAliasDeclaration_AsyncRequiredFluidObjectProvider(
    use: TypeOnly<old.AsyncRequiredFluidObjectProvider<any>>): void;
use_old_TypeAliasDeclaration_AsyncRequiredFluidObjectProvider(
    get_current_TypeAliasDeclaration_AsyncRequiredFluidObjectProvider());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_DependencyContainer": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_DependencyContainer():
    TypeOnly<old.DependencyContainer<any>>;
declare function use_current_ClassDeclaration_DependencyContainer(
    use: TypeOnly<current.DependencyContainer<any>>): void;
use_current_ClassDeclaration_DependencyContainer(
    get_old_ClassDeclaration_DependencyContainer());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_DependencyContainer": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_DependencyContainer():
    TypeOnly<current.DependencyContainer<any>>;
declare function use_old_ClassDeclaration_DependencyContainer(
    use: TypeOnly<old.DependencyContainer<any>>): void;
use_old_ClassDeclaration_DependencyContainer(
    get_current_ClassDeclaration_DependencyContainer());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_FluidObjectProvider": {"forwardCompat": false}
 */
declare function get_old_TypeAliasDeclaration_FluidObjectProvider():
    TypeOnly<old.FluidObjectProvider<any>>;
declare function use_current_TypeAliasDeclaration_FluidObjectProvider(
    use: TypeOnly<current.FluidObjectProvider<any>>): void;
use_current_TypeAliasDeclaration_FluidObjectProvider(
    get_old_TypeAliasDeclaration_FluidObjectProvider());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_FluidObjectProvider": {"backCompat": false}
 */
declare function get_current_TypeAliasDeclaration_FluidObjectProvider():
    TypeOnly<current.FluidObjectProvider<any>>;
declare function use_old_TypeAliasDeclaration_FluidObjectProvider(
    use: TypeOnly<old.FluidObjectProvider<any>>): void;
use_old_TypeAliasDeclaration_FluidObjectProvider(
    get_current_TypeAliasDeclaration_FluidObjectProvider());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_FluidObjectSymbolProvider": {"forwardCompat": false}
 */
declare function get_old_TypeAliasDeclaration_FluidObjectSymbolProvider():
    TypeOnly<old.FluidObjectSymbolProvider<any>>;
declare function use_current_TypeAliasDeclaration_FluidObjectSymbolProvider(
    use: TypeOnly<current.FluidObjectSymbolProvider<any>>): void;
use_current_TypeAliasDeclaration_FluidObjectSymbolProvider(
    get_old_TypeAliasDeclaration_FluidObjectSymbolProvider());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_FluidObjectSymbolProvider": {"backCompat": false}
 */
declare function get_current_TypeAliasDeclaration_FluidObjectSymbolProvider():
    TypeOnly<current.FluidObjectSymbolProvider<any>>;
declare function use_old_TypeAliasDeclaration_FluidObjectSymbolProvider(
    use: TypeOnly<old.FluidObjectSymbolProvider<any>>): void;
use_old_TypeAliasDeclaration_FluidObjectSymbolProvider(
    get_current_TypeAliasDeclaration_FluidObjectSymbolProvider());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "VariableDeclaration_IFluidDependencySynthesizer": {"forwardCompat": false}
 */
declare function get_old_VariableDeclaration_IFluidDependencySynthesizer():
    TypeOnly<typeof old.IFluidDependencySynthesizer>;
declare function use_current_VariableDeclaration_IFluidDependencySynthesizer(
    use: TypeOnly<typeof current.IFluidDependencySynthesizer>): void;
use_current_VariableDeclaration_IFluidDependencySynthesizer(
    get_old_VariableDeclaration_IFluidDependencySynthesizer());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "VariableDeclaration_IFluidDependencySynthesizer": {"backCompat": false}
 */
declare function get_current_VariableDeclaration_IFluidDependencySynthesizer():
    TypeOnly<typeof current.IFluidDependencySynthesizer>;
declare function use_old_VariableDeclaration_IFluidDependencySynthesizer(
    use: TypeOnly<typeof old.IFluidDependencySynthesizer>): void;
use_old_VariableDeclaration_IFluidDependencySynthesizer(
    get_current_VariableDeclaration_IFluidDependencySynthesizer());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IFluidDependencySynthesizer": {"forwardCompat": false}
 */
declare function get_old_InterfaceDeclaration_IFluidDependencySynthesizer():
    TypeOnly<old.IFluidDependencySynthesizer>;
declare function use_current_InterfaceDeclaration_IFluidDependencySynthesizer(
    use: TypeOnly<current.IFluidDependencySynthesizer>): void;
use_current_InterfaceDeclaration_IFluidDependencySynthesizer(
    get_old_InterfaceDeclaration_IFluidDependencySynthesizer());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IFluidDependencySynthesizer": {"backCompat": false}
 */
declare function get_current_InterfaceDeclaration_IFluidDependencySynthesizer():
    TypeOnly<current.IFluidDependencySynthesizer>;
declare function use_old_InterfaceDeclaration_IFluidDependencySynthesizer(
    use: TypeOnly<old.IFluidDependencySynthesizer>): void;
use_old_InterfaceDeclaration_IFluidDependencySynthesizer(
    get_current_InterfaceDeclaration_IFluidDependencySynthesizer());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IProvideFluidDependencySynthesizer": {"forwardCompat": false}
 */
declare function get_old_InterfaceDeclaration_IProvideFluidDependencySynthesizer():
    TypeOnly<old.IProvideFluidDependencySynthesizer>;
declare function use_current_InterfaceDeclaration_IProvideFluidDependencySynthesizer(
    use: TypeOnly<current.IProvideFluidDependencySynthesizer>): void;
use_current_InterfaceDeclaration_IProvideFluidDependencySynthesizer(
    get_old_InterfaceDeclaration_IProvideFluidDependencySynthesizer());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IProvideFluidDependencySynthesizer": {"backCompat": false}
 */
declare function get_current_InterfaceDeclaration_IProvideFluidDependencySynthesizer():
    TypeOnly<current.IProvideFluidDependencySynthesizer>;
declare function use_old_InterfaceDeclaration_IProvideFluidDependencySynthesizer(
    use: TypeOnly<old.IProvideFluidDependencySynthesizer>): void;
use_old_InterfaceDeclaration_IProvideFluidDependencySynthesizer(
    get_current_InterfaceDeclaration_IProvideFluidDependencySynthesizer());
