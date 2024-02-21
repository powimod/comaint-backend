/* Comaint Single Page Application frontend (Single page application frontend of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * subscription-object-helper.mjs
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

const statusMin = 1
const statusMax = 10

function dumpError(error, infos = null) {
        return `${error} : ${JSON.stringify(infos)}`
}


//============ Link [offer]
// - mandatory = true
//
const controlLinkOffer = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return `Value of 'offerId' is not defined`
	if (value === null)
		return `Value of 'offerId' is null`
	if (isNaN(value))
		return `Value of 'offerId' is not numeric`
	return false // no error
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

//============ Property [startDate]
// - type = date
// - mandatory = true
//

const controlPropertyStartDate = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'startDate'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'startDate'})
	if (! (value instanceof Date))
		return i18n_t('error.prop.is_not_a_date', {property: 'startDate'})
	// if (value.getUTCHours() !== 0 || value.getUTCMinutes() !== 0 || value.getUTCSeconds() !== 0)
	//	return i18n_t('error.prop.is_not_a_pure_date', {property: 'startDate'})
	return false // no error
}

//============ Property [endDate]
// - type = date
// - mandatory = true
//

const controlPropertyEndDate = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'endDate'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'endDate'})
	if (! (value instanceof Date))
		return i18n_t('error.prop.is_not_a_date', {property: 'endDate'})
	// if (value.getUTCHours() !== 0 || value.getUTCMinutes() !== 0 || value.getUTCSeconds() !== 0)
	//	return i18n_t('error.prop.is_not_a_pure_date', {property: 'endDate'})
	return false // no error
}

//============ Property [status]
// - type = integer
// - mandatory = true
// - minimum = 1
// - maximum = 10
//

const controlPropertyStatus = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'status'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'status'})
	if (isNaN(value))
		return i18n_t('error.prop.is_not_an_integer', {property: 'status'})
	value = parseInt(value)
	if (value < statusMin)
		return i18n_t('error.prop.is_too_small', {property: 'status', minLength:statusMin})
	if (value > statusMax)
		return i18n_t('error.prop.is_too_large', {property: 'status', maxLength:statusMax})
	return false // no error
}

//============ Property [price]
// - type = price
// - mandatory = true
//

const controlPropertyPrice = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'price'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'price'})
	return false // no error
}


const controlObjectSubscription = (subscription, fullCheck = false, checkId = false, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (subscription === undefined) 
		return `Object Subscription is not defined`
	if (subscription === null)
		return `Object Subscription is null`
	if (typeof(subscription) !== 'object')
		return `Object Subscription is not an object`

	let error;
	if (checkId) {
		error = controlPropertyId(subscription.id)
		if (error) return error
	}
	if (subscription.startDate !== undefined || fullCheck ){
		error = controlPropertyStartDate(subscription.startDate)
		if (error) return error
	}
	if (subscription.endDate !== undefined || fullCheck ){
		error = controlPropertyEndDate(subscription.endDate)
		if (error) return error
	}
	if (subscription.status !== undefined || fullCheck ){
		error = controlPropertyStatus(subscription.status)
		if (error) return error
	}
	if (subscription.price !== undefined || fullCheck ){
		error = controlPropertyPrice(subscription.price)
		if (error) return error
	}
	if (subscription.offerId !== undefined || fullCheck ){
		error = controlLinkOffer(subscription.offerId)
		if (error) return error
	}
	if (subscription.companyId !== undefined || fullCheck ){
		error = controlLinkCompany(subscription.companyId)
		if (error) return error
	}

	return false // no error
}


const convertSubscriptionFromDb = (record, filter = true) => {
	if (record === undefined)
		throw new Error('Argument [record] is missing')
	let subscription = { 
		id: record.id, 
		startDate: record.start_date, 
		endDate: record.end_date, 
		status: record.status, 
		price: record.price, 
		offerId: record.id_offer, 
		companyId: record.id_company,
	};
	// no secret property to filter in this object
	return subscription 
}

const convertSubscriptionToDb = (subscription) => {
	if (subscription=== undefined)
		throw new Error('Argument [record] is missing')
	const subscriptionRecord = {
		start_date: subscription.startDate,
		end_date: subscription.endDate,
		status: subscription.status,
		price: subscription.price, 
		id_offer: subscription.offerId, 
		id_company: subscription.companyId,
	};

	if (subscription.id !== undefined)
		subscriptionRecord.id = subscription.id
	return subscriptionRecord 
}



module.exports = {
	controlPropertyId,
	controlPropertyStartDate,
	controlPropertyEndDate,
	controlPropertyStatus,
	controlPropertyPrice,
	controlLinkOffer,
	controlLinkCompany,
	controlObjectSubscription,
	convertSubscriptionFromDb,
	convertSubscriptionToDb
}
