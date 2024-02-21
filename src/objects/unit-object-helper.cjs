/* Comaint Single Page Application frontend (Single page application frontend of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * unit-object-helper.mjs
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

// common part of MJS and CJS object helper

const nameMin = 2
const nameMax = 32
const addressMax = 128
const cityMax = 64
const zipCodeMax = 16
const countryMax = 32

function dumpError(error, infos = null) {
        return `${error} : ${JSON.stringify(infos)}`
}


//============ Link [company]
// - mandatory = true
//
const controlLinkCompany = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return `Value of 'companyId' is not defined`
	if (value === null)
		return `Value of 'companyId' is null`
	if (isNaN(value))
		return `Value of 'companyId' is not numeric`
	return false // no error
}



//============ Property [id]
// - type = id
// - mandatory = true
//

const controlPropertyId = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'id'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'id'})
	if (isNaN(value))
		return i18n_t('error.prop.is_not_an_integer', {property: 'id'})
	return false // no error
}

//============ Property [name]
// - type = string
// - mandatory = true
// - minimum = 2
// - maximum = 32
//

const controlPropertyName = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'name'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'name'})
	if (typeof(value) !== 'string' )
		return i18n_t('error.prop.is_not_a_string', {property: 'name'})
	if (value.length < nameMin)
		return i18n_t('error.prop.is_too_short', {property: 'name', minLength:nameMin})
	if (value.length > nameMax)
		return i18n_t('error.prop.is_too_long', {property: 'name', maxLength:nameMax})
	return false // no error
}

//============ Property [description]
// - type = string
// - mandatory = false
//

const controlPropertyDescription = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'description'})
	if (value === null) 
		return false // no error because not mandatory
	if (typeof(value) !== 'string' )
		return i18n_t('error.prop.is_not_a_string', {property: 'description'})
	return false // no error
}

//============ Property [address]
// - type = text
// - mandatory = true
// - maximum = 128
//

const controlPropertyAddress = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'address'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'address'})
	if (typeof(value) !== 'string' )
		return i18n_t('error.prop.is_not_a_string', {property: 'address'})
	if (value.length > addressMax)
		return i18n_t('error.prop.is_too_long', {property: 'address', maxLength:addressMax})
	return false // no error
}

//============ Property [city]
// - type = text
// - mandatory = true
// - maximum = 64
//

const controlPropertyCity = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'city'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'city'})
	if (typeof(value) !== 'string' )
		return i18n_t('error.prop.is_not_a_string', {property: 'city'})
	if (value.length > cityMax)
		return i18n_t('error.prop.is_too_long', {property: 'city', maxLength:cityMax})
	return false // no error
}

//============ Property [zipCode]
// - type = text
// - mandatory = true
// - maximum = 16
//

const controlPropertyZipCode = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'zipCode'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'zipCode'})
	if (typeof(value) !== 'string' )
		return i18n_t('error.prop.is_not_a_string', {property: 'zipCode'})
	if (value.length > zipCodeMax)
		return i18n_t('error.prop.is_too_long', {property: 'zipCode', maxLength:zipCodeMax})
	return false // no error
}

//============ Property [country]
// - type = text
// - mandatory = true
// - maximum = 32
//

const controlPropertyCountry = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'country'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'country'})
	if (typeof(value) !== 'string' )
		return i18n_t('error.prop.is_not_a_string', {property: 'country'})
	if (value.length > countryMax)
		return i18n_t('error.prop.is_too_long', {property: 'country', maxLength:countryMax})
	return false // no error
}

//============ Property [planUid]
// - type = image
// - mandatory = true
//

const controlPropertyPlanUid = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'planUid'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'planUid'})
	if (typeof(value) !== 'string' )
		return i18n_t('error.prop.is_not_a_string', {property: 'planUid'})
	return false // no error
}


const controlObjectUnit = (unit, fullCheck = false, checkId = false, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (unit === undefined) 
		return `Object Unit is not defined`
	if (unit === null)
		return `Object Unit is null`
	if (typeof(unit) !== 'object')
		return `Object Unit is not an object`

	let error;
	if (checkId) {
		error = controlPropertyId(unit.id)
		if (error) return error
	}
	if (unit.name !== undefined || fullCheck ){
		error = controlPropertyName(unit.name)
		if (error) return error
	}
	if (unit.description !== undefined){
		error = controlPropertyDescription(unit.description)
		if (error) return error
	}
	if (unit.address === undefined)
		unit.address = ""
	if (unit.address !== undefined || fullCheck ){
		error = controlPropertyAddress(unit.address)
		if (error) return error
	}
	if (unit.city === undefined)
		unit.city = ""
	if (unit.city !== undefined || fullCheck ){
		error = controlPropertyCity(unit.city)
		if (error) return error
	}
	if (unit.zipCode === undefined)
		unit.zipCode = ""
	if (unit.zipCode !== undefined || fullCheck ){
		error = controlPropertyZipCode(unit.zipCode)
		if (error) return error
	}
	if (unit.country === undefined)
		unit.country = ""
	if (unit.country !== undefined || fullCheck ){
		error = controlPropertyCountry(unit.country)
		if (error) return error
	}
	if (unit.planUid !== undefined || fullCheck ){
		error = controlPropertyPlanUid(unit.planUid)
		if (error) return error
	}
	if (unit.companyId !== undefined || fullCheck ){
		error = controlLinkCompany(unit.companyId)
		if (error) return error
	}

	return false // no error
}


const convertUnitFromDb = (record, filter = true) => {
	if (record === undefined)
		throw new Error('Argument [record] is missing')
	let unit = { 
		id: record.id, 
		name: record.name, 
		description: record.description, 
		address: record.address, 
		city: record.city, 
		zipCode: record.zip_code, 
		country: record.country, 
		planUid: record.plan_uid, 
		companyId: record.id_company,
	};
	// no secret property to filter in this object
	return unit 
}

const convertUnitToDb = (unit) => {
	if (unit=== undefined)
		throw new Error('Argument [record] is missing')
	const unitRecord = {
		name: unit.name,
		description: unit.description,
		address: unit.address,
		city: unit.city,
		zip_code: unit.zipCode,
		country: unit.country,
		plan_uid: unit.planUid, 
		id_company: unit.companyId,
	};

	if (unit.id !== undefined)
		unitRecord.id = unit.id
	return unitRecord 
}



module.exports = {
	controlPropertyId,
	controlPropertyName,
	controlPropertyDescription,
	controlPropertyAddress,
	controlPropertyCity,
	controlPropertyZipCode,
	controlPropertyCountry,
	controlPropertyPlanUid,
	controlLinkCompany,
	controlObjectUnit,
	convertUnitFromDb,
	convertUnitToDb
}
