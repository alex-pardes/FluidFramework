/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
/*
 * THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
 * Generated by fluid-type-validator in @fluidframework/build-tools.
 */
import * as old from "@fluidframework/sequence-previous";
import * as current from "../../index";

type TypeOnly<T> = {
    [P in keyof T]: TypeOnly<T[P]>;
};

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "TypeAliasDeclaration_DeserializeCallback": {"forwardCompat": false}
*/
declare function get_old_TypeAliasDeclaration_DeserializeCallback():
    TypeOnly<old.DeserializeCallback>;
declare function use_current_TypeAliasDeclaration_DeserializeCallback(
    use: TypeOnly<current.DeserializeCallback>);
use_current_TypeAliasDeclaration_DeserializeCallback(
    get_old_TypeAliasDeclaration_DeserializeCallback());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "TypeAliasDeclaration_DeserializeCallback": {"backCompat": false}
*/
declare function get_current_TypeAliasDeclaration_DeserializeCallback():
    TypeOnly<current.DeserializeCallback>;
declare function use_old_TypeAliasDeclaration_DeserializeCallback(
    use: TypeOnly<old.DeserializeCallback>);
use_old_TypeAliasDeclaration_DeserializeCallback(
    get_current_TypeAliasDeclaration_DeserializeCallback());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_IIntervalCollectionEvent": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_IIntervalCollectionEvent():
    TypeOnly<old.IIntervalCollectionEvent<any>>;
declare function use_current_InterfaceDeclaration_IIntervalCollectionEvent(
    use: TypeOnly<current.IIntervalCollectionEvent<any>>);
use_current_InterfaceDeclaration_IIntervalCollectionEvent(
    get_old_InterfaceDeclaration_IIntervalCollectionEvent());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_IIntervalCollectionEvent": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_IIntervalCollectionEvent():
    TypeOnly<current.IIntervalCollectionEvent<any>>;
declare function use_old_InterfaceDeclaration_IIntervalCollectionEvent(
    use: TypeOnly<old.IIntervalCollectionEvent<any>>);
use_old_InterfaceDeclaration_IIntervalCollectionEvent(
    get_current_InterfaceDeclaration_IIntervalCollectionEvent());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_IIntervalHelpers": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_IIntervalHelpers():
    TypeOnly<old.IIntervalHelpers<any>>;
declare function use_current_InterfaceDeclaration_IIntervalHelpers(
    use: TypeOnly<current.IIntervalHelpers<any>>);
use_current_InterfaceDeclaration_IIntervalHelpers(
    get_old_InterfaceDeclaration_IIntervalHelpers());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_IIntervalHelpers": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_IIntervalHelpers():
    TypeOnly<current.IIntervalHelpers<any>>;
declare function use_old_InterfaceDeclaration_IIntervalHelpers(
    use: TypeOnly<old.IIntervalHelpers<any>>);
use_old_InterfaceDeclaration_IIntervalHelpers(
    get_current_InterfaceDeclaration_IIntervalHelpers());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_IJSONRunSegment": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_IJSONRunSegment():
    TypeOnly<old.IJSONRunSegment<any>>;
declare function use_current_InterfaceDeclaration_IJSONRunSegment(
    use: TypeOnly<current.IJSONRunSegment<any>>);
use_current_InterfaceDeclaration_IJSONRunSegment(
    get_old_InterfaceDeclaration_IJSONRunSegment());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_IJSONRunSegment": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_IJSONRunSegment():
    TypeOnly<current.IJSONRunSegment<any>>;
declare function use_old_InterfaceDeclaration_IJSONRunSegment(
    use: TypeOnly<old.IJSONRunSegment<any>>);
use_old_InterfaceDeclaration_IJSONRunSegment(
    get_current_InterfaceDeclaration_IJSONRunSegment());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_Interval": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_Interval():
    TypeOnly<old.Interval>;
declare function use_current_ClassDeclaration_Interval(
    use: TypeOnly<current.Interval>);
use_current_ClassDeclaration_Interval(
    get_old_ClassDeclaration_Interval());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_Interval": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_Interval():
    TypeOnly<current.Interval>;
declare function use_old_ClassDeclaration_Interval(
    use: TypeOnly<old.Interval>);
use_old_ClassDeclaration_Interval(
    get_current_ClassDeclaration_Interval());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_IntervalCollection": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_IntervalCollection():
    TypeOnly<old.IntervalCollection<any>>;
declare function use_current_ClassDeclaration_IntervalCollection(
    use: TypeOnly<current.IntervalCollection<any>>);
use_current_ClassDeclaration_IntervalCollection(
    // @ts-expect-error compatibility expected to be broken
    get_old_ClassDeclaration_IntervalCollection());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_IntervalCollection": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_IntervalCollection():
    TypeOnly<current.IntervalCollection<any>>;
declare function use_old_ClassDeclaration_IntervalCollection(
    use: TypeOnly<old.IntervalCollection<any>>);
use_old_ClassDeclaration_IntervalCollection(
    get_current_ClassDeclaration_IntervalCollection());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_IntervalCollectionIterator": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_IntervalCollectionIterator():
    TypeOnly<old.IntervalCollectionIterator<any>>;
declare function use_current_ClassDeclaration_IntervalCollectionIterator(
    use: TypeOnly<current.IntervalCollectionIterator<any>>);
use_current_ClassDeclaration_IntervalCollectionIterator(
    get_old_ClassDeclaration_IntervalCollectionIterator());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_IntervalCollectionIterator": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_IntervalCollectionIterator():
    TypeOnly<current.IntervalCollectionIterator<any>>;
declare function use_old_ClassDeclaration_IntervalCollectionIterator(
    use: TypeOnly<old.IntervalCollectionIterator<any>>);
use_old_ClassDeclaration_IntervalCollectionIterator(
    get_current_ClassDeclaration_IntervalCollectionIterator());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "EnumDeclaration_IntervalType": {"forwardCompat": false}
*/
declare function get_old_EnumDeclaration_IntervalType():
    TypeOnly<old.IntervalType>;
declare function use_current_EnumDeclaration_IntervalType(
    use: TypeOnly<current.IntervalType>);
use_current_EnumDeclaration_IntervalType(
    get_old_EnumDeclaration_IntervalType());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "EnumDeclaration_IntervalType": {"backCompat": false}
*/
declare function get_current_EnumDeclaration_IntervalType():
    TypeOnly<current.IntervalType>;
declare function use_old_EnumDeclaration_IntervalType(
    use: TypeOnly<old.IntervalType>);
use_old_EnumDeclaration_IntervalType(
    get_current_EnumDeclaration_IntervalType());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_ISequenceDeltaRange": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_ISequenceDeltaRange():
    TypeOnly<old.ISequenceDeltaRange>;
declare function use_current_InterfaceDeclaration_ISequenceDeltaRange(
    use: TypeOnly<current.ISequenceDeltaRange>);
use_current_InterfaceDeclaration_ISequenceDeltaRange(
    get_old_InterfaceDeclaration_ISequenceDeltaRange());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_ISequenceDeltaRange": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_ISequenceDeltaRange():
    TypeOnly<current.ISequenceDeltaRange>;
declare function use_old_InterfaceDeclaration_ISequenceDeltaRange(
    use: TypeOnly<old.ISequenceDeltaRange>);
use_old_InterfaceDeclaration_ISequenceDeltaRange(
    get_current_InterfaceDeclaration_ISequenceDeltaRange());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_ISerializableInterval": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_ISerializableInterval():
    TypeOnly<old.ISerializableInterval>;
declare function use_current_InterfaceDeclaration_ISerializableInterval(
    use: TypeOnly<current.ISerializableInterval>);
use_current_InterfaceDeclaration_ISerializableInterval(
    get_old_InterfaceDeclaration_ISerializableInterval());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_ISerializableInterval": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_ISerializableInterval():
    TypeOnly<current.ISerializableInterval>;
declare function use_old_InterfaceDeclaration_ISerializableInterval(
    use: TypeOnly<old.ISerializableInterval>);
use_old_InterfaceDeclaration_ISerializableInterval(
    get_current_InterfaceDeclaration_ISerializableInterval());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_ISerializedInterval": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_ISerializedInterval():
    TypeOnly<old.ISerializedInterval>;
declare function use_current_InterfaceDeclaration_ISerializedInterval(
    use: TypeOnly<current.ISerializedInterval>);
use_current_InterfaceDeclaration_ISerializedInterval(
    get_old_InterfaceDeclaration_ISerializedInterval());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_ISerializedInterval": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_ISerializedInterval():
    TypeOnly<current.ISerializedInterval>;
declare function use_old_InterfaceDeclaration_ISerializedInterval(
    use: TypeOnly<old.ISerializedInterval>);
use_old_InterfaceDeclaration_ISerializedInterval(
    get_current_InterfaceDeclaration_ISerializedInterval());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_ISharedIntervalCollection": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_ISharedIntervalCollection():
    TypeOnly<old.ISharedIntervalCollection<any>>;
declare function use_current_InterfaceDeclaration_ISharedIntervalCollection(
    use: TypeOnly<current.ISharedIntervalCollection<any>>);
use_current_InterfaceDeclaration_ISharedIntervalCollection(
    get_old_InterfaceDeclaration_ISharedIntervalCollection());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_ISharedIntervalCollection": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_ISharedIntervalCollection():
    TypeOnly<current.ISharedIntervalCollection<any>>;
declare function use_old_InterfaceDeclaration_ISharedIntervalCollection(
    use: TypeOnly<old.ISharedIntervalCollection<any>>);
use_old_InterfaceDeclaration_ISharedIntervalCollection(
    get_current_InterfaceDeclaration_ISharedIntervalCollection());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_ISharedSegmentSequenceEvents": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_ISharedSegmentSequenceEvents():
    TypeOnly<old.ISharedSegmentSequenceEvents>;
declare function use_current_InterfaceDeclaration_ISharedSegmentSequenceEvents(
    use: TypeOnly<current.ISharedSegmentSequenceEvents>);
use_current_InterfaceDeclaration_ISharedSegmentSequenceEvents(
    get_old_InterfaceDeclaration_ISharedSegmentSequenceEvents());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_ISharedSegmentSequenceEvents": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_ISharedSegmentSequenceEvents():
    TypeOnly<current.ISharedSegmentSequenceEvents>;
declare function use_old_InterfaceDeclaration_ISharedSegmentSequenceEvents(
    use: TypeOnly<old.ISharedSegmentSequenceEvents>);
use_old_InterfaceDeclaration_ISharedSegmentSequenceEvents(
    get_current_InterfaceDeclaration_ISharedSegmentSequenceEvents());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_ISharedString": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_ISharedString():
    TypeOnly<old.ISharedString>;
declare function use_current_InterfaceDeclaration_ISharedString(
    use: TypeOnly<current.ISharedString>);
use_current_InterfaceDeclaration_ISharedString(
    get_old_InterfaceDeclaration_ISharedString());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_ISharedString": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_ISharedString():
    TypeOnly<current.ISharedString>;
declare function use_old_InterfaceDeclaration_ISharedString(
    use: TypeOnly<old.ISharedString>);
use_old_InterfaceDeclaration_ISharedString(
    get_current_InterfaceDeclaration_ISharedString());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_IValueOpEmitter": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_IValueOpEmitter():
    TypeOnly<old.IValueOpEmitter>;
declare function use_current_InterfaceDeclaration_IValueOpEmitter(
    use: TypeOnly<current.IValueOpEmitter>);
use_current_InterfaceDeclaration_IValueOpEmitter(
    get_old_InterfaceDeclaration_IValueOpEmitter());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "InterfaceDeclaration_IValueOpEmitter": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_IValueOpEmitter():
    TypeOnly<current.IValueOpEmitter>;
declare function use_old_InterfaceDeclaration_IValueOpEmitter(
    use: TypeOnly<old.IValueOpEmitter>);
use_old_InterfaceDeclaration_IValueOpEmitter(
    get_current_InterfaceDeclaration_IValueOpEmitter());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedTypeAliasDeclaration_MatrixSegment": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedTypeAliasDeclaration_MatrixSegment": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedVariableDeclaration_maxCellPosition": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedVariableDeclaration_maxCellPosition": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedVariableDeclaration_maxCol": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedVariableDeclaration_maxCol": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedVariableDeclaration_maxCols": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedVariableDeclaration_maxCols": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedVariableDeclaration_maxRow": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedVariableDeclaration_maxRow": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedVariableDeclaration_maxRows": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedVariableDeclaration_maxRows": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_PaddingSegment": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_PaddingSegment": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedFunctionDeclaration_positionToRowCol": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedFunctionDeclaration_positionToRowCol": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedVariableDeclaration_rowColToPosition": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedVariableDeclaration_rowColToPosition": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_RunSegment": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_RunSegment": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SequenceDeltaEvent": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_SequenceDeltaEvent():
    TypeOnly<old.SequenceDeltaEvent>;
declare function use_current_ClassDeclaration_SequenceDeltaEvent(
    use: TypeOnly<current.SequenceDeltaEvent>);
use_current_ClassDeclaration_SequenceDeltaEvent(
    get_old_ClassDeclaration_SequenceDeltaEvent());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SequenceDeltaEvent": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_SequenceDeltaEvent():
    TypeOnly<current.SequenceDeltaEvent>;
declare function use_old_ClassDeclaration_SequenceDeltaEvent(
    use: TypeOnly<old.SequenceDeltaEvent>);
use_old_ClassDeclaration_SequenceDeltaEvent(
    get_current_ClassDeclaration_SequenceDeltaEvent());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SequenceEvent": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_SequenceEvent():
    TypeOnly<old.SequenceEvent>;
declare function use_current_ClassDeclaration_SequenceEvent(
    use: TypeOnly<current.SequenceEvent>);
use_current_ClassDeclaration_SequenceEvent(
    get_old_ClassDeclaration_SequenceEvent());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SequenceEvent": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_SequenceEvent():
    TypeOnly<current.SequenceEvent>;
declare function use_old_ClassDeclaration_SequenceEvent(
    use: TypeOnly<old.SequenceEvent>);
use_old_ClassDeclaration_SequenceEvent(
    get_current_ClassDeclaration_SequenceEvent());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SequenceInterval": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_SequenceInterval():
    TypeOnly<old.SequenceInterval>;
declare function use_current_ClassDeclaration_SequenceInterval(
    use: TypeOnly<current.SequenceInterval>);
use_current_ClassDeclaration_SequenceInterval(
    // @ts-expect-error compatibility expected to be broken
    get_old_ClassDeclaration_SequenceInterval());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SequenceInterval": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_SequenceInterval():
    TypeOnly<current.SequenceInterval>;
declare function use_old_ClassDeclaration_SequenceInterval(
    use: TypeOnly<old.SequenceInterval>);
use_old_ClassDeclaration_SequenceInterval(
    get_current_ClassDeclaration_SequenceInterval());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SequenceMaintenanceEvent": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_SequenceMaintenanceEvent():
    TypeOnly<old.SequenceMaintenanceEvent>;
declare function use_current_ClassDeclaration_SequenceMaintenanceEvent(
    use: TypeOnly<current.SequenceMaintenanceEvent>);
use_current_ClassDeclaration_SequenceMaintenanceEvent(
    get_old_ClassDeclaration_SequenceMaintenanceEvent());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SequenceMaintenanceEvent": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_SequenceMaintenanceEvent():
    TypeOnly<current.SequenceMaintenanceEvent>;
declare function use_old_ClassDeclaration_SequenceMaintenanceEvent(
    use: TypeOnly<old.SequenceMaintenanceEvent>);
use_old_ClassDeclaration_SequenceMaintenanceEvent(
    get_current_ClassDeclaration_SequenceMaintenanceEvent());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_SharedIntervalCollection": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_SharedIntervalCollection": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_SharedIntervalCollectionFactory": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_SharedIntervalCollectionFactory": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_SharedNumberSequence": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_SharedNumberSequence": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_SharedNumberSequenceFactory": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_SharedNumberSequenceFactory": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_SharedObjectSequence": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_SharedObjectSequence": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_SharedObjectSequenceFactory": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_SharedObjectSequenceFactory": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SharedSegmentSequence": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_SharedSegmentSequence():
    TypeOnly<old.SharedSegmentSequence<any>>;
declare function use_current_ClassDeclaration_SharedSegmentSequence(
    use: TypeOnly<current.SharedSegmentSequence<any>>);
use_current_ClassDeclaration_SharedSegmentSequence(
    get_old_ClassDeclaration_SharedSegmentSequence());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SharedSegmentSequence": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_SharedSegmentSequence():
    TypeOnly<current.SharedSegmentSequence<any>>;
declare function use_old_ClassDeclaration_SharedSegmentSequence(
    use: TypeOnly<old.SharedSegmentSequence<any>>);
use_old_ClassDeclaration_SharedSegmentSequence(
    get_current_ClassDeclaration_SharedSegmentSequence());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SharedSequence": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_SharedSequence():
    TypeOnly<old.SharedSequence<any>>;
declare function use_current_ClassDeclaration_SharedSequence(
    use: TypeOnly<current.SharedSequence<any>>);
use_current_ClassDeclaration_SharedSequence(
    get_old_ClassDeclaration_SharedSequence());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SharedSequence": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_SharedSequence():
    TypeOnly<current.SharedSequence<any>>;
declare function use_old_ClassDeclaration_SharedSequence(
    use: TypeOnly<old.SharedSequence<any>>);
use_old_ClassDeclaration_SharedSequence(
    get_current_ClassDeclaration_SharedSequence());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SharedString": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_SharedString():
    TypeOnly<old.SharedString>;
declare function use_current_ClassDeclaration_SharedString(
    use: TypeOnly<current.SharedString>);
use_current_ClassDeclaration_SharedString(
    get_old_ClassDeclaration_SharedString());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SharedString": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_SharedString():
    TypeOnly<current.SharedString>;
declare function use_old_ClassDeclaration_SharedString(
    use: TypeOnly<old.SharedString>);
use_old_ClassDeclaration_SharedString(
    get_current_ClassDeclaration_SharedString());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SharedStringFactory": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_SharedStringFactory():
    TypeOnly<old.SharedStringFactory>;
declare function use_current_ClassDeclaration_SharedStringFactory(
    use: TypeOnly<current.SharedStringFactory>);
use_current_ClassDeclaration_SharedStringFactory(
    get_old_ClassDeclaration_SharedStringFactory());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SharedStringFactory": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_SharedStringFactory():
    TypeOnly<current.SharedStringFactory>;
declare function use_old_ClassDeclaration_SharedStringFactory(
    use: TypeOnly<old.SharedStringFactory>);
use_old_ClassDeclaration_SharedStringFactory(
    get_current_ClassDeclaration_SharedStringFactory());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "TypeAliasDeclaration_SharedStringSegment": {"forwardCompat": false}
*/
declare function get_old_TypeAliasDeclaration_SharedStringSegment():
    TypeOnly<old.SharedStringSegment>;
declare function use_current_TypeAliasDeclaration_SharedStringSegment(
    use: TypeOnly<current.SharedStringSegment>);
use_current_TypeAliasDeclaration_SharedStringSegment(
    get_old_TypeAliasDeclaration_SharedStringSegment());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "TypeAliasDeclaration_SharedStringSegment": {"backCompat": false}
*/
declare function get_current_TypeAliasDeclaration_SharedStringSegment():
    TypeOnly<current.SharedStringSegment>;
declare function use_old_TypeAliasDeclaration_SharedStringSegment(
    use: TypeOnly<old.SharedStringSegment>);
use_old_TypeAliasDeclaration_SharedStringSegment(
    get_current_TypeAliasDeclaration_SharedStringSegment());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_SparseMatrix": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_SparseMatrix": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_SparseMatrixFactory": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedClassDeclaration_SparseMatrixFactory": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedTypeAliasDeclaration_SparseMatrixItem": {"forwardCompat": false}
*/

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "RemovedTypeAliasDeclaration_SparseMatrixItem": {"backCompat": false}
*/

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SubSequence": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_SubSequence():
    TypeOnly<old.SubSequence<any>>;
declare function use_current_ClassDeclaration_SubSequence(
    use: TypeOnly<current.SubSequence<any>>);
use_current_ClassDeclaration_SubSequence(
    get_old_ClassDeclaration_SubSequence());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_SubSequence": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_SubSequence():
    TypeOnly<current.SubSequence<any>>;
declare function use_old_ClassDeclaration_SubSequence(
    use: TypeOnly<old.SubSequence<any>>);
use_old_ClassDeclaration_SubSequence(
    get_current_ClassDeclaration_SubSequence());
