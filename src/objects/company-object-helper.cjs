/* Comaint Single Page Application frontend (Single page application frontend of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * company-object-helper.mjs
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
const nameMax = 64
const addressMax = 128
const cityMax = 64
const zipCodeMax = 16
const countryMax = 32

function dumpError(error, infos = null) {
        return `${error} : ${JSON.stringify(infos)}`
}


//============ Link [manager]
// - mandatory = false
//
const controlLinkManager = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return `Value of 'managerId' is not defined`
	if (value === null) 
		return false // no error because not mandatory
	if (isNaN(value))
		return `Value of 'managerId' is not numeric`
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
// - maximum = 64
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

//============ Property [locked]
// - type = boolean
// - mandatory = true
//

const controlPropertyLocked = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'locked'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'locked'})
	if (typeof(value) !== 'boolean')
		return i18n_t('error.prop.is_not_a_boolean', {property: 'locked'})
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

//============ Property [logoUid]
// - type = image
// - mandatory = true
//

const controlPropertyLogoUid = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'logoUid'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'logoUid'})
	if (typeof(value) !== 'string' )
		return i18n_t('error.prop.is_not_a_string', {property: 'logoUid'})
	return false // no error
}


const controlObjectCompany = (company, fullCheck = false, checkId = false, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (company === undefined) 
		return `Object Company is not defined`
	if (company === null)
		return `Object Company is null`
	if (typeof(company) !== 'object')
		return `Object Company is not an object`

	let error;
	if (checkId) {
		error = controlPropertyId(company.id)
		if (error) return error
	}
	if (company.name !== undefined || fullCheck ){
		error = controlPropertyName(company.name)
		if (error) return error
	}
	if (company.locked === undefined)
		company.locked = false
	if (company.locked !== undefined || fullCheck ){
		error = controlPropertyLocked(company.locked)
		if (error) return error
	}
	if (company.address === undefined)
		company.address = ""
	if (company.address !== undefined || fullCheck ){
		error = controlPropertyAddress(company.address)
		if (error) return error
	}
	if (company.city === undefined)
		company.city = ""
	if (company.city !== undefined || fullCheck ){
		error = controlPropertyCity(company.city)
		if (error) return error
	}
	if (company.zipCode === undefined)
		company.zipCode = ""
	if (company.zipCode !== undefined || fullCheck ){
		error = controlPropertyZipCode(company.zipCode)
		if (error) return error
	}
	if (company.country === undefined)
		company.country = ""
	if (company.country !== undefined || fullCheck ){
		error = controlPropertyCountry(company.country)
		if (error) return error
	}
	if (company.logoUid !== undefined || fullCheck ){
		error = controlPropertyLogoUid(company.logoUid)
		if (error) return error
	}
	if (company.managerId !== undefined){
		error = controlLinkManager(company.managerId)
		if (error) return error
	}

	return false // no error
}


const convertCompanyFromDb = (record, filter = true) => {
	if (record === undefined)
		throw new Error('Argument [record] is missing')
	let company = { 
		id: record.id, 
		name: record.name, 
		locked: record.locked == 1, 
		address: record.address, 
		city: record.city, 
		zipCode: record.zip_code, 
		country: record.country, 
		logoUid: record.logo_uid, 
		managerId: record.id_manager,
	};
	// no secret property to filter in this object
	return company 
}

const convertCompanyToDb = (company) => {
	if (company=== undefined)
		throw new Error('Argument [record] is missing')
	const companyRecord = {
		name: company.name,
		locked: company.locked,
		address: company.address,
		city: company.city,
		zip_code: company.zipCode,
		country: company.country,
		logo_uid: company.logoUid, 
		id_manager: company.managerId,
	};

	if (company.id !== undefined)
		companyRecord.id = company.id
	return companyRecord 
}



module.exports = {
	controlPropertyId,
	controlPropertyName,
	controlPropertyLocked,
	controlPropertyAddress,
	controlPropertyCity,
	controlPropertyZipCode,
	controlPropertyCountry,
	controlPropertyLogoUid,
	controlLinkManager,
	controlObjectCompany,
	convertCompanyFromDb,
	convertCompanyToDb
}
