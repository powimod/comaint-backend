/* Comaint Single Page Application frontend (Single page application frontend of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * offer-object-helper.mjs
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

const titleMin = 1
const titleMax = 64
const descriptionMax = 256

function dumpError(error, infos = null) {
        return `${error} : ${JSON.stringify(infos)}`
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

//============ Property [title]
// - type = string
// - mandatory = true
// - minimum = 1
// - maximum = 64
//

const controlPropertyTitle = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'title'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'title'})
	if (typeof(value) !== 'string' )
		return i18n_t('error.prop.is_not_a_string', {property: 'title'})
	if (value.length < titleMin)
		return i18n_t('error.prop.is_too_short', {property: 'title', minLength:titleMin})
	if (value.length > titleMax)
		return i18n_t('error.prop.is_too_long', {property: 'title', maxLength:titleMax})
	return false // no error
}

//============ Property [description]
// - type = text
// - mandatory = true
// - maximum = 256
//

const controlPropertyDescription = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'description'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'description'})
	if (typeof(value) !== 'string' )
		return i18n_t('error.prop.is_not_a_string', {property: 'description'})
	if (value.length > descriptionMax)
		return i18n_t('error.prop.is_too_long', {property: 'description', maxLength:descriptionMax})
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

//============ Property [duration]
// - type = integer
// - mandatory = true
//

const controlPropertyDuration = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'duration'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'duration'})
	if (isNaN(value))
		return i18n_t('error.prop.is_not_an_integer', {property: 'duration'})
	value = parseInt(value)
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

//============ Property [userLimit]
// - type = integer
// - mandatory = true
//

const controlPropertyUserLimit = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'userLimit'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'userLimit'})
	if (isNaN(value))
		return i18n_t('error.prop.is_not_an_integer', {property: 'userLimit'})
	value = parseInt(value)
	return false // no error
}

//============ Property [equipmentLimit]
// - type = integer
// - mandatory = true
//

const controlPropertyEquipmentLimit = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'equipmentLimit'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'equipmentLimit'})
	if (isNaN(value))
		return i18n_t('error.prop.is_not_an_integer', {property: 'equipmentLimit'})
	value = parseInt(value)
	return false // no error
}

//============ Property [articleLimit]
// - type = integer
// - mandatory = true
//

const controlPropertyArticleLimit = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'articleLimit'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'articleLimit'})
	if (isNaN(value))
		return i18n_t('error.prop.is_not_an_integer', {property: 'articleLimit'})
	value = parseInt(value)
	return false // no error
}

//============ Property [interventionLimit]
// - type = integer
// - mandatory = true
//

const controlPropertyInterventionLimit = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'interventionLimit'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'interventionLimit'})
	if (isNaN(value))
		return i18n_t('error.prop.is_not_an_integer', {property: 'interventionLimit'})
	value = parseInt(value)
	return false // no error
}

//============ Property [storageLimit]
// - type = integer
// - mandatory = true
//

const controlPropertyStorageLimit = (value, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (value === undefined)
		return i18n_t('error.prop.is_not_defined', {property: 'storageLimit'})
	if (value === null)
		return i18n_t('error.prop.is_null', {property: 'storageLimit'})
	if (isNaN(value))
		return i18n_t('error.prop.is_not_an_integer', {property: 'storageLimit'})
	value = parseInt(value)
	return false // no error
}


const controlObjectOffer = (offer, fullCheck = false, checkId = false, i18n_t = null ) => {
	if (i18n_t === null) i18n_t = dumpError
	if (offer === undefined) 
		return `Object Offer is not defined`
	if (offer === null)
		return `Object Offer is null`
	if (typeof(offer) !== 'object')
		return `Object Offer is not an object`

	let error;
	if (checkId) {
		error = controlPropertyId(offer.id)
		if (error) return error
	}
	if (offer.title !== undefined || fullCheck ){
		error = controlPropertyTitle(offer.title)
		if (error) return error
	}
	if (offer.description !== undefined || fullCheck ){
		error = controlPropertyDescription(offer.description)
		if (error) return error
	}
	if (offer.active === undefined)
		offer.active = true
	if (offer.active !== undefined || fullCheck ){
		error = controlPropertyActive(offer.active)
		if (error) return error
	}
	if (offer.duration === undefined)
		offer.duration = 0
	if (offer.duration !== undefined || fullCheck ){
		error = controlPropertyDuration(offer.duration)
		if (error) return error
	}
	if (offer.price === undefined)
		offer.price = 0
	if (offer.price !== undefined || fullCheck ){
		error = controlPropertyPrice(offer.price)
		if (error) return error
	}
	if (offer.userLimit === undefined)
		offer.userLimit = 0
	if (offer.userLimit !== undefined || fullCheck ){
		error = controlPropertyUserLimit(offer.userLimit)
		if (error) return error
	}
	if (offer.equipmentLimit === undefined)
		offer.equipmentLimit = 0
	if (offer.equipmentLimit !== undefined || fullCheck ){
		error = controlPropertyEquipmentLimit(offer.equipmentLimit)
		if (error) return error
	}
	if (offer.articleLimit === undefined)
		offer.articleLimit = 0
	if (offer.articleLimit !== undefined || fullCheck ){
		error = controlPropertyArticleLimit(offer.articleLimit)
		if (error) return error
	}
	if (offer.interventionLimit === undefined)
		offer.interventionLimit = 0
	if (offer.interventionLimit !== undefined || fullCheck ){
		error = controlPropertyInterventionLimit(offer.interventionLimit)
		if (error) return error
	}
	if (offer.storageLimit === undefined)
		offer.storageLimit = 0
	if (offer.storageLimit !== undefined || fullCheck ){
		error = controlPropertyStorageLimit(offer.storageLimit)
		if (error) return error
	}

	return false // no error
}


const convertOfferFromDb = (record, filter = true) => {
	if (record === undefined)
		throw new Error('Argument [record] is missing')
	let offer = { 
		id: record.id, 
		title: record.title, 
		description: record.description, 
		active: record.active == 1, 
		duration: record.duration, 
		price: record.price, 
		userLimit: record.user_limit, 
		equipmentLimit: record.equipment_limit, 
		articleLimit: record.article_limit, 
		interventionLimit: record.intervention_limit, 
		storageLimit: record.storage_limit,
	};
	// no secret property to filter in this object
	return offer 
}

const convertOfferToDb = (offer) => {
	if (offer=== undefined)
		throw new Error('Argument [record] is missing')
	const offerRecord = {
		title: offer.title,
		description: offer.description,
		active: offer.active,
		duration: offer.duration,
		price: offer.price,
		user_limit: offer.userLimit,
		equipment_limit: offer.equipmentLimit,
		article_limit: offer.articleLimit,
		intervention_limit: offer.interventionLimit,
		storage_limit: offer.storageLimit,
	};

	if (offer.id !== undefined)
		offerRecord.id = offer.id
	return offerRecord 
}



module.exports = {
	controlPropertyId,
	controlPropertyTitle,
	controlPropertyDescription,
	controlPropertyActive,
	controlPropertyDuration,
	controlPropertyPrice,
	controlPropertyUserLimit,
	controlPropertyEquipmentLimit,
	controlPropertyArticleLimit,
	controlPropertyInterventionLimit,
	controlPropertyStorageLimit,
	controlObjectOffer,
	convertOfferFromDb,
	convertOfferToDb
}
