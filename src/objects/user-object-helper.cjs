/* Comaint Single Page Application frontend (Single page application frontend of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * user-object-helper.mjs
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

const emailMin = 3
const emailMax = 128
const passwordMin = 8
const passwordMax = 70
const firstnameMax = 30
const lastnameMax = 30
const validationCodeMin = 10000
const validationCodeMax = 99999
const phoneMax = 25
const stockRoleMin = 0
const stockRoleMax = 4
const parkRoleMin = 0
const parkRoleMax = 4

function dumpError(error, infos = null) {
        return `${error} : ${JSON.stringify(infos)}`
}


//============ Link [company]
// - mandatory = false
//
const controlLinkCompany = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return `Value of 'companyId' is not defined`
	if (value === null) 
		return false // no error because not mandatory
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

//============ Property [email]
// - type = email
// - mandatory = true
// - minimum = 3
// - maximum = 128
//

const controlPropertyEmail = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'email'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'email'})
	if (typeof(value) !== 'string' )
		return i18n_t('error.prop.is_not_a_string', {property: 'email'})
	if (value.length < emailMin)
		return i18n_t('error.prop.is_too_short', {property: 'email', minLength:emailMin})
	if (value.length > emailMax)
		return i18n_t('error.prop.is_too_long', {property: 'email', maxLength:emailMax})
	if (value.match(/\S+@\S+\.\S+/) === null)
		return i18n_t('error.prop.is_malformed_email', {property: 'email'})
	return false // no error
}

//============ Property [password]
// - type = string
// - mandatory = true
// - minimum = 8
// - maximum = 70
//

const controlPropertyPassword = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'password'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'password'})
	if (typeof(value) !== 'string' )
		return i18n_t('error.prop.is_not_a_string', {property: 'password'})
	if (value.length < passwordMin)
		return i18n_t('error.prop.is_too_short', {property: 'password', minLength:passwordMin})
	if (value.length > passwordMax)
		return i18n_t('error.prop.is_too_long', {property: 'password', maxLength:passwordMax})
	const passwordMinLength = 6
	if (value.length < passwordMinLength) 
		return i18n_t('error.prop.password_to_small', {property: 'password', minLength: passwordMinLength})
	let nLower = 0
	let nUpper = 0
	let nDigit = 0
	let nSpec = 0
	for (const c of value) {
		if (c >= 'a' && c <= 'z') nLower++
		else if (c >= 'A' && c <= 'Z') nUpper++
		else if (c >= '0' && c <= '9') nDigit++
		else nSpec++ 
	}
	if (nLower == 0)
		return i18n_t('error.prop.password_no_lowercase_letter', {property: 'password'})
	if (nUpper == 0)
		return i18n_t('error.prop.password_no_uppercase_letter', {property: 'password'})
	if (nDigit == 0)
		return i18n_t('error.prop.password_no_digit_character', {property: 'password'})
	if (nSpec == 0)
		return i18n_t('error.prop.password_no_special_character', {property: 'password'})
	return false // no error
}

//============ Property [firstname]
// - type = string
// - mandatory = true
// - maximum = 30
//

const controlPropertyFirstname = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'firstname'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'firstname'})
	if (typeof(value) !== 'string' )
		return i18n_t('error.prop.is_not_a_string', {property: 'firstname'})
	if (value.length > firstnameMax)
		return i18n_t('error.prop.is_too_long', {property: 'firstname', maxLength:firstnameMax})
	return false // no error
}

//============ Property [lastname]
// - type = string
// - mandatory = true
// - maximum = 30
//

const controlPropertyLastname = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'lastname'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'lastname'})
	if (typeof(value) !== 'string' )
		return i18n_t('error.prop.is_not_a_string', {property: 'lastname'})
	if (value.length > lastnameMax)
		return i18n_t('error.prop.is_too_long', {property: 'lastname', maxLength:lastnameMax})
	return false // no error
}

//============ Property [accountLocked]
// - type = boolean
// - mandatory = true
//

const controlPropertyAccountLocked = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'accountLocked'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'accountLocked'})
	if (typeof(value) !== 'boolean')
		return i18n_t('error.prop.is_not_a_boolean', {property: 'accountLocked'})
	return false // no error
}

//============ Property [validationCode]
// - type = integer
// - mandatory = false
// - minimum = 10000
// - maximum = 99999
//

const controlPropertyValidationCode = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'validationCode'})
	if (value === null) 
		return false // no error because not mandatory
	if (isNaN(value))
		return i18n_t('error.prop.is_not_an_integer', {property: 'validationCode'})
	value = parseInt(value)
	if (value < validationCodeMin)
		return i18n_t('error.prop.is_too_small', {property: 'validationCode', minLength:validationCodeMin})
	if (value > validationCodeMax)
		return i18n_t('error.prop.is_too_large', {property: 'validationCode', maxLength:validationCodeMax})
	return false // no error
}

//============ Property [phone]
// - type = string
// - mandatory = false
// - maximum = 25
//

const controlPropertyPhone = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'phone'})
	if (value === null) 
		return false // no error because not mandatory
	if (typeof(value) !== 'string' )
		return i18n_t('error.prop.is_not_a_string', {property: 'phone'})
	if (value.length > phoneMax)
		return i18n_t('error.prop.is_too_long', {property: 'phone', maxLength:phoneMax})
	return false // no error
}

//============ Property [active]
// - type = boolean
// - mandatory = true
//

const controlPropertyActive = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'active'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'active'})
	if (typeof(value) !== 'boolean')
		return i18n_t('error.prop.is_not_a_boolean', {property: 'active'})
	return false // no error
}

//============ Property [lastUse]
// - type = datetime
// - mandatory = false
//

const controlPropertyLastUse = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'lastUse'})
	if (value === null) 
		return false // no error because not mandatory
	if (! (value instanceof Date))
		return i18n_t('error.prop.is_not_a_datetime', {property: 'lastUse'})
	return false // no error
}

//============ Property [administrator]
// - type = boolean
// - mandatory = true
//

const controlPropertyAdministrator = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'administrator'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'administrator'})
	if (typeof(value) !== 'boolean')
		return i18n_t('error.prop.is_not_a_boolean', {property: 'administrator'})
	return false // no error
}

//============ Property [stockRole]
// - type = integer
// - mandatory = false
// - minimum = 0
// - maximum = 4
//

const controlPropertyStockRole = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'stockRole'})
	if (value === null) 
		return false // no error because not mandatory
	if (isNaN(value))
		return i18n_t('error.prop.is_not_an_integer', {property: 'stockRole'})
	value = parseInt(value)
	if (value < stockRoleMin)
		return i18n_t('error.prop.is_too_small', {property: 'stockRole', minLength:stockRoleMin})
	if (value > stockRoleMax)
		return i18n_t('error.prop.is_too_large', {property: 'stockRole', maxLength:stockRoleMax})
	return false // no error
}

//============ Property [parkRole]
// - type = integer
// - mandatory = false
// - minimum = 0
// - maximum = 4
//

const controlPropertyParkRole = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'parkRole'})
	if (value === null) 
		return false // no error because not mandatory
	if (isNaN(value))
		return i18n_t('error.prop.is_not_an_integer', {property: 'parkRole'})
	value = parseInt(value)
	if (value < parkRoleMin)
		return i18n_t('error.prop.is_too_small', {property: 'parkRole', minLength:parkRoleMin})
	if (value > parkRoleMax)
		return i18n_t('error.prop.is_too_large', {property: 'parkRole', maxLength:parkRoleMax})
	return false // no error
}


const controlObjectUser = (user, fullCheck = false, checkId = false, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (user === undefined) 
		return `Object User is not defined`
	if (user === null)
		return `Object User is null`
	if (typeof(user) !== 'object')
		return `Object User is not an object`

	let error;
	if (checkId) {
		error = controlPropertyId(user.id)
		if (error) return error
	}
	if (user.email !== undefined || fullCheck ){
		error = controlPropertyEmail(user.email)
		if (error) return error
	}
	if (user.password !== undefined || fullCheck ){
		error = controlPropertyPassword(user.password)
		if (error) return error
	}
	if (user.firstname !== undefined || fullCheck ){
		error = controlPropertyFirstname(user.firstname)
		if (error) return error
	}
	if (user.lastname !== undefined || fullCheck ){
		error = controlPropertyLastname(user.lastname)
		if (error) return error
	}
	if (user.accountLocked === undefined)
		user.accountLocked = false
	if (user.accountLocked !== undefined || fullCheck ){
		error = controlPropertyAccountLocked(user.accountLocked)
		if (error) return error
	}
	if (user.validationCode === undefined)
		user.validationCode = 10000
	if (user.validationCode !== undefined){
		error = controlPropertyValidationCode(user.validationCode)
		if (error) return error
	}
	if (user.phone === undefined)
		user.phone = ""
	if (user.phone !== undefined){
		error = controlPropertyPhone(user.phone)
		if (error) return error
	}
	if (user.active === undefined)
		user.active = true
	if (user.active !== undefined || fullCheck ){
		error = controlPropertyActive(user.active)
		if (error) return error
	}
	if (user.lastUse !== undefined){
		error = controlPropertyLastUse(user.lastUse)
		if (error) return error
	}
	if (user.administrator === undefined)
		user.administrator = false
	if (user.administrator !== undefined || fullCheck ){
		error = controlPropertyAdministrator(user.administrator)
		if (error) return error
	}
	if (user.stockRole === undefined)
		user.stockRole = 0
	if (user.stockRole !== undefined){
		error = controlPropertyStockRole(user.stockRole)
		if (error) return error
	}
	if (user.parkRole === undefined)
		user.parkRole = 0
	if (user.parkRole !== undefined){
		error = controlPropertyParkRole(user.parkRole)
		if (error) return error
	}
	if (user.companyId !== undefined){
		error = controlLinkCompany(user.companyId)
		if (error) return error
	}

	return false // no error
}


const convertUserFromDb = (record, filter = true) => {
	if (record === undefined)
		throw new Error('Argument [record] is missing')
	let user = { 
		id: record.id, 
		email: record.email, 
		password: record.password, 
		firstname: record.firstname, 
		lastname: record.lastname, 
		accountLocked: record.account_locked == 1, 
		validationCode: record.validation_code, 
		phone: record.phone, 
		active: record.active == 1, 
		lastUse: record.last_use, 
		administrator: record.administrator == 1, 
		stockRole: record.stock_role, 
		parkRole: record.park_role, 
		companyId: record.id_company,
	};
	if (filter) {
		delete user.password
	}
	return user 
}

const convertUserToDb = (user) => {
	if (user=== undefined)
		throw new Error('Argument [record] is missing')
	const userRecord = {
		email: user.email,
		password: user.password,
		firstname: user.firstname,
		lastname: user.lastname,
		account_locked: user.accountLocked,
		validation_code: user.validationCode,
		phone: user.phone,
		active: user.active,
		last_use: user.lastUse,
		administrator: user.administrator,
		stock_role: user.stockRole,
		park_role: user.parkRole, 
		id_company: user.companyId,
	};

	if (user.id !== undefined)
		userRecord.id = user.id
	return userRecord 
}



module.exports = {
	controlPropertyId,
	controlPropertyEmail,
	controlPropertyPassword,
	controlPropertyFirstname,
	controlPropertyLastname,
	controlPropertyAccountLocked,
	controlPropertyValidationCode,
	controlPropertyPhone,
	controlPropertyActive,
	controlPropertyLastUse,
	controlPropertyAdministrator,
	controlPropertyStockRole,
	controlPropertyParkRole,
	controlLinkCompany,
	controlObjectUser,
	convertUserFromDb,
	convertUserToDb
}
