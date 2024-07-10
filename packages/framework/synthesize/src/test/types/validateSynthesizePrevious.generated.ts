/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
 * Generated by flub generate:typetests in @fluid-tools/build-cli.
 */

import type { TypeOnly, MinimalType, FullType, requireAssignableTo } from "@fluidframework/build-tools";
import type * as old from "@fluidframework/synthesize-previous/internal";

import type * as current from "../../index.js";

declare type MakeUnusedImportErrorsGoAway<T> = TypeOnly<T> | MinimalType<T> | FullType<T> | typeof old | typeof current | requireAssignableTo<true, true>;

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_AsyncFluidObjectProvider": {"forwardCompat": false}
 */
declare type old_as_current_for_TypeAliasDeclaration_AsyncFluidObjectProvider = requireAssignableTo<TypeOnly<old.AsyncFluidObjectProvider<any>>, TypeOnly<current.AsyncFluidObjectProvider<any>>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_AsyncFluidObjectProvider": {"backCompat": false}
 */
declare type current_as_old_for_TypeAliasDeclaration_AsyncFluidObjectProvider = requireAssignableTo<TypeOnly<current.AsyncFluidObjectProvider<any>>, TypeOnly<old.AsyncFluidObjectProvider<any>>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_AsyncOptionalFluidObjectProvider": {"forwardCompat": false}
 */
declare type old_as_current_for_TypeAliasDeclaration_AsyncOptionalFluidObjectProvider = requireAssignableTo<TypeOnly<old.AsyncOptionalFluidObjectProvider<any>>, TypeOnly<current.AsyncOptionalFluidObjectProvider<any>>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_AsyncOptionalFluidObjectProvider": {"backCompat": false}
 */
declare type current_as_old_for_TypeAliasDeclaration_AsyncOptionalFluidObjectProvider = requireAssignableTo<TypeOnly<current.AsyncOptionalFluidObjectProvider<any>>, TypeOnly<old.AsyncOptionalFluidObjectProvider<any>>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_AsyncRequiredFluidObjectProvider": {"forwardCompat": false}
 */
declare type old_as_current_for_TypeAliasDeclaration_AsyncRequiredFluidObjectProvider = requireAssignableTo<TypeOnly<old.AsyncRequiredFluidObjectProvider<any>>, TypeOnly<current.AsyncRequiredFluidObjectProvider<any>>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_AsyncRequiredFluidObjectProvider": {"backCompat": false}
 */
declare type current_as_old_for_TypeAliasDeclaration_AsyncRequiredFluidObjectProvider = requireAssignableTo<TypeOnly<current.AsyncRequiredFluidObjectProvider<any>>, TypeOnly<old.AsyncRequiredFluidObjectProvider<any>>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_DependencyContainer": {"forwardCompat": false}
 */
declare type old_as_current_for_ClassDeclaration_DependencyContainer = requireAssignableTo<TypeOnly<old.DependencyContainer<any>>, TypeOnly<current.DependencyContainer<any>>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_DependencyContainer": {"backCompat": false}
 */
declare type current_as_old_for_ClassDeclaration_DependencyContainer = requireAssignableTo<TypeOnly<current.DependencyContainer<any>>, TypeOnly<old.DependencyContainer<any>>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_FluidObjectProvider": {"forwardCompat": false}
 */
declare type old_as_current_for_TypeAliasDeclaration_FluidObjectProvider = requireAssignableTo<TypeOnly<old.FluidObjectProvider<any>>, TypeOnly<current.FluidObjectProvider<any>>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_FluidObjectProvider": {"backCompat": false}
 */
declare type current_as_old_for_TypeAliasDeclaration_FluidObjectProvider = requireAssignableTo<TypeOnly<current.FluidObjectProvider<any>>, TypeOnly<old.FluidObjectProvider<any>>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_FluidObjectSymbolProvider": {"forwardCompat": false}
 */
declare type old_as_current_for_TypeAliasDeclaration_FluidObjectSymbolProvider = requireAssignableTo<TypeOnly<old.FluidObjectSymbolProvider<any>>, TypeOnly<current.FluidObjectSymbolProvider<any>>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAliasDeclaration_FluidObjectSymbolProvider": {"backCompat": false}
 */
declare type current_as_old_for_TypeAliasDeclaration_FluidObjectSymbolProvider = requireAssignableTo<TypeOnly<current.FluidObjectSymbolProvider<any>>, TypeOnly<old.FluidObjectSymbolProvider<any>>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "VariableDeclaration_IFluidDependencySynthesizer": {"forwardCompat": false}
 */
declare type old_as_current_for_VariableDeclaration_IFluidDependencySynthesizer = requireAssignableTo<TypeOnly<typeof old.IFluidDependencySynthesizer>, TypeOnly<typeof current.IFluidDependencySynthesizer>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "VariableDeclaration_IFluidDependencySynthesizer": {"backCompat": false}
 */
declare type current_as_old_for_VariableDeclaration_IFluidDependencySynthesizer = requireAssignableTo<TypeOnly<typeof current.IFluidDependencySynthesizer>, TypeOnly<typeof old.IFluidDependencySynthesizer>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IFluidDependencySynthesizer": {"forwardCompat": false}
 */
declare type old_as_current_for_InterfaceDeclaration_IFluidDependencySynthesizer = requireAssignableTo<TypeOnly<old.IFluidDependencySynthesizer>, TypeOnly<current.IFluidDependencySynthesizer>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IFluidDependencySynthesizer": {"backCompat": false}
 */
declare type current_as_old_for_InterfaceDeclaration_IFluidDependencySynthesizer = requireAssignableTo<TypeOnly<current.IFluidDependencySynthesizer>, TypeOnly<old.IFluidDependencySynthesizer>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IProvideFluidDependencySynthesizer": {"forwardCompat": false}
 */
declare type old_as_current_for_InterfaceDeclaration_IProvideFluidDependencySynthesizer = requireAssignableTo<TypeOnly<old.IProvideFluidDependencySynthesizer>, TypeOnly<current.IProvideFluidDependencySynthesizer>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IProvideFluidDependencySynthesizer": {"backCompat": false}
 */
declare type current_as_old_for_InterfaceDeclaration_IProvideFluidDependencySynthesizer = requireAssignableTo<TypeOnly<current.IProvideFluidDependencySynthesizer>, TypeOnly<old.IProvideFluidDependencySynthesizer>>
