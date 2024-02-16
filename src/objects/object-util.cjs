'use strict'

function rawError(error, infos = null) {
        return `${error} : ${JSON.stringify(infos)}`
}



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

const controlObject = (objDef, object, controlId = true, i18n_t = null) => {
	if (i18n_t === null) i18n_t = rawError
	if (objDef === undefined)
		throw new Error('objDef argument is missing')
	if (typeof(objDef) != 'object')
		throw new Error('objDef argument is not an object')
	if (object === undefined)
		throw new Error('object argument is missing')
	if (typeof(object) != 'object')
		throw new Error('object argument is not an object')

	for (const [propName, propDef] of Object.entries(objDef)) {
		if (propDef.type === 'id' && controlId === false)
			continue
		const error = controlObjectProperty (objDef, propName, object[propName], i18n_t)
		if (error)
			return error
	}
	return false // no error
}

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

/* FIXME not used
const convertObjectToDb = (objDef, object) => {
	if (objDef === undefined)
		throw new Error('objDef argument is missing')
	if (typeof(objDef) != 'object')
		throw new Error('objDef argument is not an object')
	if (object === undefined)
		throw new Error('object argument is missing')
	if (typeof(object) != 'object')
		throw new Error('object argument is not an object')

	const record = {}
	for (const [propName, propDef] of Object.entries(objDef)) {
	}

	throw new Error('not yet implemented')
	return record
}
*/


module.exports = {
	controlObjectProperty,
	controlObject,
	diffObjects,
	createObjectInstance,
	convertObjectFromDb,
	//convertObjectToDb, // FIXME not used 
}
