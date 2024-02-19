/* Comaint Single Page Application frontend (Single page application frontend of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * object-util.cjs
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the 
 * GNU General Public License as published by the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied 
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
'use strict'

/*
 * @module object-util
 */

function rawError(error, infos = null) {
        return `${error} : ${JSON.stringify(infos)}`
}

/**
 * Control an object property according to the object definition passed as the objDef parameter.
 * The property name and its value are passed as argument.
 * Returns false if the property value is OK, otherwise returns a message explaining what constraint was violated.
 *
 * @function
 * @param {Object} objDef - object definition containing the property to control.
 * @param {string} propName - name of the property to control (will be searched in object definition).
 * @param {variant} propValue - the value of the property.
 * @param {function} - I18next function called to translate the error message ID into a translated string
 *                  (if this function is null the error string ID will be return).
 * @returns {boolean} - returns false if all properties are correct (never return true)
 * @returns {string} - returns a error message with the violated constraint.
 *
 * @example
 *	const errorMessage = objectUtil.controlProperty(userDef, 'password', myPassword, t)
 *	if (errorMessage)
 *		throw new Error(errorMessage)
 *
 */
const controlObjectProperty = (objDef, propName, propValue, i18n_t = null) => {
	if (i18n_t === null) i18n_t = rawError
	if (objDef === undefined)
		throw new Error('objDef argument is missing')
	if (typeof(objDef) != 'object')
		throw new Error('objDef argument is not an object')
	if (propName === undefined)
		throw new Error('propName argument is missing')
	if (typeof(propName) != 'string')
		throw new Error('propName argument is not a string')
	const propDef = objDef[propName]
	if (propDef === undefined)
		throw new Error(`Invalid property name [${propName}]`)

	if (propValue === undefined)
		return i18n_t('error.prop.is_not_defined', {property: propName})

	if (propValue === null) {
		if (propDef.mandatory)
			return i18n_t('error.prop.is_null', {property: propName})
		else
			return null
	}

	if (propDef.secret) {
		// FIXME secret property is only supported for string properties
		// (replace "secret" property by a "password" property type
		if (typeof(propValue) !== 'string' )
			return i18n_t('error.prop.is_not_a_string', {property: propName})
		if (propDef.minimum && propValue.length < propDef.minimum )
			return i18n_t('error.prop.password_to_small', {property: propName, size: propDef.minimum})
		let nLower = 0
		let nUpper = 0
		let nDigit = 0
		let nSpec = 0
		for (const c of propValue) {
			if (c >= 'a' && c <= 'z') nLower++
			else if (c >= 'A' && c <= 'Z') nUpper++
			else if (c >= '0' && c <= '9') nDigit++
			else nSpec++ 
		}
		if (nLower == 0)
			return i18n_t('error.prop.password_no_lowercase_letter', {property: propName})
		if (nUpper == 0)
			return i18n_t('error.prop.password_no_uppercase_letter', {property: propName})
		if (nDigit == 0)
			return i18n_t('error.prop.password_no_digit_character', {property: propName})
		if (nSpec == 0)
			return i18n_t('error.prop.password_no_special_character', {property: propName})
		return false // no error
	}
	
	switch (propDef.type) {

		case 'id':
		case 'integer':
			if (typeof(propValue) !== 'number' )
				return i18n_t('error.prop.is_not_an_integer', {property: propName})
			if (propDef.minimum && propValue < propDef.minimum )
				return i18n_t('error.prop.is_too_small', {property: propName, size: propDef.minimum})
			if (propDef.maximum && propValue > propDef.maximum )
				return i18n_t('error.prop.is_too_large', {property: propName, size: propDef.maximum})
			return false // no error

		case 'price':
			if (typeof(propValue) !== 'number' )
				return i18n_t('error.prop.is_not_an_integer', {property: propName})
			if ( isNaN(propValue) )
				return i18n_t('error.prop.is_not_an_integer', {property: propName})
			if (propDef.minimum && propValue < propDef.minimum )
				return i18n_t('error.prop.is_too_small', {property: propName, size: propDef.minimum})
			if (propDef.maximum && propValue > propDef.maximum )
				return i18n_t('error.prop.is_too_large', {property: propName, size: propDef.maximum})
			return false // no error


		case 'string':
		case 'text':
			if (typeof(propValue) !== 'string' )
				return i18n_t('error.prop.is_not_a_string', {property: propName})
			if (propDef.minimum && propValue.length < propDef.minimum )
				return i18n_t('error.prop.is_too_short', {property: propName, size: propDef.minimum})
			if (propDef.maximum && propValue.length > propDef.maximum )
				return i18n_t('error.prop.is_too_long',  {property: propName, size: propDef.maximum})
			if (propDef.type !== 'text' && propValue.includes('\n'))
				return i18n_t('error.prop.string_contains_line_feeds',  {property: propName, size: propDef.maximum})
			return false // no error

		case 'email':
			if (typeof(propValue) !== 'string' )
				return i18n_t('error.prop.is_not_a_string', {property: propName})
			if (propDef.minimum && propValue.length < propDef.minimum )
				return i18n_t('error.prop.is_too_short', {property: propName, size: propDef.minimum})
			if (propDef.maximum && propValue.length > propDef.maximum )
				return i18n_t('error.prop.is_too_long',  {property: propName, size: propDef.maximum})
			if (value.match(/\S+@\S+\.\S+/) === null)
				return i18n_t('error.prop.is_malformed_email', {property: 'email'})
			return false // no error

		case 'date':
		case 'datetime':
			if (typeof(propValue) !== 'object')
				return i18n_t('error.prop.is_not_a_date', {property: propName})
			if (propValue.constructor.name !== 'date')
				return i18n_t('error.prop.is_not_a_date', {property: propName})
			return false // no error

		case 'boolean':
			if (typeof(propValue) !== 'boolean')
				return i18n_t('error.prop.is_not_a_boolean', {property: propName})
			return false // no error

		default:
			throw new Error(`Property type [${propDef.type}] not supported`)
	}
}

/**
 * Control each properties of the object passed as argument according to the object definition passed as the objDef parameter.
 * Returns false if no error was detected, otherwise a message explaining the encountred error for the first property which
 * do not respect its contraints in object definition.
 *
 * @function
 * @param {Object} objDef - object containing definition of each properties of the object.
 * @param {Object} object - object to control.
 * @param {boolean fullCheck - indicates if all properties must be present or not.
 * @param {boolean} controlId - indicates if object ID property should be controlled or not
 *                  (useful for a newly created object for which the ID is not yet valued).
 * @param {function} - I18next function called to translate the error message ID into a translated string
 *                  (if this function is null the error string ID will be return).
 * @returns {boolean} - returns false if all properties are correct (never return true)
 * @returns {string} - returns a error message for the first property does not respect its definition in objectDef.
 *
 * @example
 *	const myUser = {
 *		email = 'a@b.c',
 *		firstname = 'John',
 *		lastname = 'Do',
 *		// ...
 *	}
 *	const errorMessage = objectUtil.controlObject(userDef, myUser, true, true, t)
 *	if (errorMessage)
 *		throw new Error(errorMessage)
 *
 */
const controlObject = (objDef, object, fullCheck = false, controlId = true, i18n_t = null) => {
	if (objDef === undefined)
		throw new Error('objDef argument is missing')
	if (typeof(objDef) != 'object')
		throw new Error('objDef argument is not an object')
	if (object === undefined)
		throw new Error('object argument is missing')
	if (typeof(object) != 'object')
		throw new Error('object argument is not an object')

	if (typeof(fullCheck) != 'boolean')
		throw new Error('fullCheck argument is not an boolean')
	if (typeof(controlId) != 'boolean')
		throw new Error('controlId argument is not an boolean')

	if (i18n_t === null) i18n_t = rawError
	if (typeof(i18n_t) != 'function')
		throw new Error('i18n_t argument is not an function')

	for (const [propName, propDef] of Object.entries(objDef)) {
		if (propDef.type === 'id' && controlId === false)
			continue
		if (fullCheck || object[propName] !== undefined) {
			const error = controlObjectProperty (objDef, propName, object[propName], i18n_t)
			if (error)
				return error
		}
	}
	return false // no error
}

/**
 * Create an object containing object properties according to the object definition passed as argument.
 * 
 * @function
 * @param {Object} objDef - object containing definition of each properties of the object.
 * @returns {Object} - the created object
 * 
 */
const createObjectInstance = (objDef) => {
	if (objDef === undefined)
		throw new Error('objDef argument is missing')
	if (typeof(objDef) != 'object')
		throw new Error('objDef argument is not an object')
	const object = {} 
	for (const [propName, propDef] of Object.entries(objDef)) {
		switch (propDef.type) {
			case 'id':
				object[propName] = null
				break;
			case 'integer':
			case 'price':
				if (object.defaultValue)
					object[propName] = parseInt(object.defaultValue) 
				else if (propDef.mandatory)
					object[propName] = 0 
				else
					object[propName] = null 
				break;
			case 'string':
			case 'text':
			case 'email':
				if (object.defaultValue)
					object[propName] = object.defaultValue
				else if (propDef.mandatory)
					object[propName] = ""
				else
					object[propName] = null
				break;
			case 'date':
			case 'datetime':
				if (propDef.mandatory)
					object[propName] = new Date()
				else
					object[propName] = null
				break;
			case 'boolean':
				if (object.defaultValue)
					object[propName] = object.defaultValue
				else if (propDef.mandatory)
					object[propName] = false 
				else
					object[propName] = null 
				break;
			default:
				throw new Error(`Property type [${propDef.type}] not supported`)
		}
	}
	return object
}

/**
 * Compare two object instances passed as parameters according to an object definition and
 * returns an array containing all properties for which value has changed.
 * Used to detect if an object has been changed in a dialog editor and to send the minimum field set
 * to the backend to be save in database.
 * 
 * @function
 * @param {Object} objDef - object containing definition of each properties of the object.
 * @param {Object} objectA - first instance of the object to compare (before edition)
 * @param {Object} objectB - second instance of the object (after edition)
 * @param {boolean} ignoreID - indicates if object ID should be controlled or not.
 *	If true, an error is thrown if objectA and objectB do not match.
 * @returns {Object} - the diff object with changed properties (name and value after edition)
 * 
 */
const diffObjects = (objDef, objectA, objectB, ignoreID = false) => {
	if (objDef === undefined)
		throw new Error('objDef argument is missing')
	if (typeof(objDef) != 'object')
		throw new Error('objDef argument is not an object')

	if (objectA === undefined)
		throw new Error('objectA argument is missing')
	if (typeof(objectA) != 'object')
		throw new Error('objectA argument is not an object')

	if (objectB === undefined)
		throw new Error('objectB argument is missing')
	if (typeof(objectA) != 'object')
		throw new Error('objectB argument is not an object')

	const delta = {}
	for (const [propName, propDef] of Object.entries(objDef)) {
		if (propDef.type === 'id') {
			if (ignoreID) 
				continue
			if (objectA.id === undefined)
				throw new Error('Object A has no ID')
			if (objectB.id === undefined)
				throw new Error('Object B has no ID')
			if (objectA.id !== objectB.id)
				throw new Error('Objects ID are different')
			delta[propName] = objectB[propName]
			continue
		}
		if (objectA[propName] == objectB[propName])
			continue
		delta[propName] = objectB[propName]
	}
	return delta
}
/**
 * Returns an object corresponding with the dbRecord argument according with the object definition passed as parameter.
 * Only properties included in object definition will be transfered from DB record to result object.
 * Boolean properties will be converted from integer (as returned by MySQL) in to Javascript boolean.
 * @function
 * @param {Object} objDef - object containing definition of each properties of the object.
 * @param {Object} dbRecord - object containing values issued from MySQL.
 */
const convertObjectFromDb = (objDef, dbRecord) => {
	if (objDef === undefined)
		throw new Error('objDef argument is missing')
	if (typeof(objDef) != 'object')
		throw new Error('objDef argument is not an object')

	if (dbRecord === undefined)
		throw new Error('dbRecord argument is missing')
	if (typeof(dbRecord) != 'object')
		throw new Error('dbRecord argument is not an object')

	const object = {}
	for (const [propName, propDef] of Object.entries(objDef)) {
		const fieldName = propDef.field ? propDef.field : propName
		let fieldValue = dbRecord[fieldName]
		if (fieldValue === undefined)  // should never happen
			throw new Error(`Property [${propName}] it not defined in DB record`)
		if (fieldValue !== null) {
			if (propDef.type === 'boolean') 
				fieldValue = (fieldValue === 1) ? true : false
			// FIXME remove this if no error is thrown
			if (propDef.type === 'date' || propDef.type === 'datetime') {
				if (typeof(fieldValue) !== 'object')
					throw new Error(`Property [${propName}] it not an object`)
				if (fieldValue.constructor.name !== 'date')
					throw new Error(`Property [${propName}] it not a date`)
			}
		}
		object[propName] = fieldValue
	}
	return object
}
/**
 * Returns an DB record object corresponding to the object argument according with the object definition passed as parameter.
 * Only properties included in object definition will be transfered from object to DB record.
 * It converts Object properties to DB field names.
 * @function
 * @param {Object} objDef - object containing definition of each properties of the object.
 * @param {Object} object - object to convert into a DB record 
 */
const convertObjectToDb = (objDef, object) => {
	if (objDef === undefined)
		throw new Error('objDef argument is missing')
	if (typeof(objDef) != 'object')
		throw new Error('objDef argument is not an object')

	if (object === undefined)
		throw new Error('object argument is missing')
	if (typeof(object) != 'object')
		throw new Error('object argument is not an object')

	const dbRecord = {}
	for (const [propName, propDef] of Object.entries(objDef)) {
		let propValue = object[propName]
		if (propValue === undefined)
			continue
		const fieldName = propDef.field ? propDef.field : propName
		dbRecord[fieldName] = propValue
	}
	return dbRecord
}
/**
 * Returns two arrays containing field names and field values for the properties which are present in 
 * the object passed as parameter.
 * For each properties of the given object, there will be an entry in each array.
 * This function is used to build WHERE clause from filters array argument in models (see example bellow).
 *
 * @function
 * @param {<Object>} objDef - object properties definition
 * @param {Array.<Object>} object - object containing filters
 * @returns {Array.<string>, Array.<string>} : two arrays, one with field names and one with field values.
 *
 * @example
 *
 *	const objectUtils = require('../objects/object-util.cjs')
 *
 * 	static async getUserList(filters) {
 *                const [ sqlValues, sqlFilters ] = objectUtils.buildFieldArrays(userObjectDef, filters)
 *                const whereClause = sqlFilters.length === 0 ? '' :
 *                        'WHERE ' + sqlFilters.map(f => `${f} = ?`).join(' AND ')
 *                let sql = `SELECT * FROM users ${whereClause}`
 *                const result = await db.query(sql, sqlValues)
 *
 */
const buildFieldArrays = (objDef, object) => {
	if (objDef === undefined)
		throw new Error('objDef argument is missing')
	if (typeof(objDef) != 'object')
		throw new Error('objDef argument is not an object')
	if (object === undefined)
		throw new Error('object argument is missing')
	if (typeof(object) != 'object')
		throw new Error('object argument is not an object')
	const fieldNames = []
	const fieldValues = []
	for (const [propName, propDef] of Object.entries(objDef)) {
		let fieldValue = object[propName]
		if (fieldValue === undefined)
			continue
		const fieldName = propDef.field ? propDef.field : propName
		fieldNames.push(fieldName)
		fieldValues.push(fieldValue)
	}
	return [fieldNames, fieldValues]
}


module.exports = {
	controlObjectProperty,
	controlObject,
	diffObjects,
	createObjectInstance,
	convertObjectFromDb,
	convertObjectToDb,
	buildFieldArrays
}
