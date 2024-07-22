/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
 * Generated by flub generate:typetests in @fluid-tools/build-cli.
 */

import type { TypeOnly, MinimalType, FullType, requireAssignableTo } from "@fluidframework/build-tools";
import type * as old from "@fluidframework/register-collection-previous/internal";

import type * as current from "../../index.js";

declare type MakeUnusedImportErrorsGoAway<T> = TypeOnly<T> | MinimalType<T> | FullType<T> | typeof old | typeof current | requireAssignableTo<true, true>;

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Variable_ConsensusRegisterCollection": {"backCompat": false}
 */
declare type current_as_old_for_Variable_ConsensusRegisterCollection = requireAssignableTo<TypeOnly<typeof current.ConsensusRegisterCollection>, TypeOnly<typeof old.ConsensusRegisterCollection>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAlias_ConsensusRegisterCollection": {"forwardCompat": false}
 */
declare type old_as_current_for_TypeAlias_ConsensusRegisterCollection = requireAssignableTo<TypeOnly<old.ConsensusRegisterCollection<any>>, TypeOnly<current.ConsensusRegisterCollection<any>>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAlias_ConsensusRegisterCollection": {"backCompat": false}
 */
declare type current_as_old_for_TypeAlias_ConsensusRegisterCollection = requireAssignableTo<TypeOnly<current.ConsensusRegisterCollection<any>>, TypeOnly<old.ConsensusRegisterCollection<any>>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_ConsensusRegisterCollectionClass": {"forwardCompat": false}
 */
declare type old_as_current_for_Class_ConsensusRegisterCollectionClass = requireAssignableTo<TypeOnly<old.ConsensusRegisterCollectionClass<any>>, TypeOnly<current.ConsensusRegisterCollectionClass<any>>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_ConsensusRegisterCollectionClass": {"backCompat": false}
 */
declare type current_as_old_for_Class_ConsensusRegisterCollectionClass = requireAssignableTo<TypeOnly<current.ConsensusRegisterCollectionClass<any>>, TypeOnly<old.ConsensusRegisterCollectionClass<any>>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_ConsensusRegisterCollectionClass": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_ConsensusRegisterCollectionClass = requireAssignableTo<TypeOnly<typeof current.ConsensusRegisterCollectionClass>, TypeOnly<typeof old.ConsensusRegisterCollectionClass>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_ConsensusRegisterCollectionFactory": {"forwardCompat": false}
 */
declare type old_as_current_for_Class_ConsensusRegisterCollectionFactory = requireAssignableTo<TypeOnly<old.ConsensusRegisterCollectionFactory>, TypeOnly<current.ConsensusRegisterCollectionFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Class_ConsensusRegisterCollectionFactory": {"backCompat": false}
 */
declare type current_as_old_for_Class_ConsensusRegisterCollectionFactory = requireAssignableTo<TypeOnly<current.ConsensusRegisterCollectionFactory>, TypeOnly<old.ConsensusRegisterCollectionFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassStatics_ConsensusRegisterCollectionFactory": {"backCompat": false}
 */
declare type current_as_old_for_ClassStatics_ConsensusRegisterCollectionFactory = requireAssignableTo<TypeOnly<typeof current.ConsensusRegisterCollectionFactory>, TypeOnly<typeof old.ConsensusRegisterCollectionFactory>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_IConsensusRegisterCollection": {"forwardCompat": false}
 */
declare type old_as_current_for_Interface_IConsensusRegisterCollection = requireAssignableTo<TypeOnly<old.IConsensusRegisterCollection>, TypeOnly<current.IConsensusRegisterCollection>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_IConsensusRegisterCollection": {"backCompat": false}
 */
declare type current_as_old_for_Interface_IConsensusRegisterCollection = requireAssignableTo<TypeOnly<current.IConsensusRegisterCollection>, TypeOnly<old.IConsensusRegisterCollection>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_IConsensusRegisterCollectionEvents": {"forwardCompat": false}
 */
declare type old_as_current_for_Interface_IConsensusRegisterCollectionEvents = requireAssignableTo<TypeOnly<old.IConsensusRegisterCollectionEvents>, TypeOnly<current.IConsensusRegisterCollectionEvents>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_IConsensusRegisterCollectionEvents": {"backCompat": false}
 */
declare type current_as_old_for_Interface_IConsensusRegisterCollectionEvents = requireAssignableTo<TypeOnly<current.IConsensusRegisterCollectionEvents>, TypeOnly<old.IConsensusRegisterCollectionEvents>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAlias_IConsensusRegisterCollectionFactory": {"forwardCompat": false}
 */
declare type old_as_current_for_TypeAlias_IConsensusRegisterCollectionFactory = requireAssignableTo<TypeOnly<old.IConsensusRegisterCollectionFactory>, TypeOnly<current.IConsensusRegisterCollectionFactory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAlias_IConsensusRegisterCollectionFactory": {"backCompat": false}
 */
declare type current_as_old_for_TypeAlias_IConsensusRegisterCollectionFactory = requireAssignableTo<TypeOnly<current.IConsensusRegisterCollectionFactory>, TypeOnly<old.IConsensusRegisterCollectionFactory>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Enum_ReadPolicy": {"forwardCompat": false}
 */
declare type old_as_current_for_Enum_ReadPolicy = requireAssignableTo<TypeOnly<old.ReadPolicy>, TypeOnly<current.ReadPolicy>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Enum_ReadPolicy": {"backCompat": false}
 */
declare type current_as_old_for_Enum_ReadPolicy = requireAssignableTo<TypeOnly<current.ReadPolicy>, TypeOnly<old.ReadPolicy>>
