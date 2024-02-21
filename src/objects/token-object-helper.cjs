/* Comaint Single Page Application frontend (Single page application frontend of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * token-object-helper.mjs
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


function dumpError(error, infos = null) {
        return `${error} : ${JSON.stringify(infos)}`
}


//============ Link [user]
// - mandatory = true
//
const controlLinkUser = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return `Value of 'userId' is not defined`
	if (value === null)
		return `Value of 'userId' is null`
	if (isNaN(value))
		return `Value of 'userId' is not numeric`
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

//============ Property [expiresAt]
// - type = datetime
// - mandatory = true
//

const controlPropertyExpiresAt = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'expiresAt'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'expiresAt'})
	if (! (value instanceof Date))
		return i18n_t('error.prop.is_not_a_datetime', {property: 'expiresAt'})
	return false // no error
}


const controlObjectToken = (token, fullCheck = false, checkId = false, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (token === undefined) 
		return `Object Token is not defined`
	if (token === null)
		return `Object Token is null`
	if (typeof(token) !== 'object')
		return `Object Token is not an object`

	let error;
	if (checkId) {
		error = controlPropertyId(token.id)
		if (error) return error
	}
	if (token.expiresAt !== undefined || fullCheck ){
		error = controlPropertyExpiresAt(token.expiresAt)
		if (error) return error
	}
	if (token.userId !== undefined || fullCheck ){
		error = controlLinkUser(token.userId)
		if (error) return error
	}

	return false // no error
}


const convertTokenFromDb = (record, filter = true) => {
	if (record === undefined)
		throw new Error('Argument [record] is missing')
	let token = { 
		id: record.id, 
		expiresAt: record.expires_at, 
		userId: record.id_user,
	};
	// no secret property to filter in this object
	return token 
}

const convertTokenToDb = (token) => {
	if (token=== undefined)
		throw new Error('Argument [record] is missing')
	const tokenRecord = {
		expires_at: token.expiresAt, 
		id_user: token.userId,
	};

	if (token.id !== undefined)
		tokenRecord.id = token.id
	return tokenRecord 
}



module.exports = {
	controlPropertyId,
	controlPropertyExpiresAt,
	controlLinkUser,
	controlObjectToken,
	convertTokenFromDb,
	convertTokenToDb
}
