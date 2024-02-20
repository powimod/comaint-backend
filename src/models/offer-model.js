/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * offer-model.js
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
const assert = require('assert');

const { offerObjectDef } = require('../objects/offer-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class OfferModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getOfferIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(offerObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM offers ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findOfferCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(offerObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM offers ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findOfferList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(offerObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let resultsPerPage = params.resultsPerPage; 
		if (resultsPerPage === undefined || isNaN(resultsPerPage)) 
			resultsPerPage = 25; // TODO hard coded value
		else
			resultsPerPage = parseInt(resultsPerPage);
		if (resultsPerPage < 1) resultsPerPage = 1;
		fieldValues.push(resultsPerPage);

		let offset = params.offset; 
		if (offset=== undefined || isNaN(resultsPerPage)) 
			offset = 0
		else
			offset = parseInt(offset);
		if (offset < 0) offset = 0;
		fieldValues.push(offset);

		let sql = `SELECT * FROM offers ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const offerList = [];
		for (let offerRecord of result) 
			offerList.push( objectUtils.convertObjectFromDb(offerObjectDef, offerRecord, /*filter=*/true) )
		return offerList;
	}

	static async getOfferById(offerId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (offerId === undefined)
			throw new Error('Argument <offerId> required');
		if (isNaN(offerId) === undefined)
			throw new Error('Argument <offerId> is not a number');
		let sql = `SELECT * FROM offers WHERE id = ?`;
		const result = await db.query(sql, [offerId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const offer = objectUtils.convertObjectFromDb(offerObjectDef, result[0], /*filter=*/false)
		return offer;
	}
	
	static async getOfferByTitle(title) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (title === undefined)
			throw new Error('Argument <title> required');
		let sql = `SELECT * FROM offers WHERE title = ?`;
		const result = await db.query(sql, [title]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const offer = objectUtils.convertObjectFromDb(offerObjectDef, result[0], /*filter=*/false)
		return offer;
	}
	


	static async getChildrenCountList(offerId) {
		if (offerId === undefined)
			throw new Error('Argument <offerId> required');
		if (isNaN(offerId) === undefined)
			throw new Error('Argument <offerId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		
		sql = `
			SELECT COUNT(id) AS counter 
			FROM subscriptions
			WHERE id_offer = ?
			`
		result = await db.query(sql, [ offerId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Subscription'] = result[0].counter

		sql = `
			SELECT COUNT(companies.id) AS counter
			FROM subscriptions INNER JOIN companies 
				ON subscriptions.id_company = companies.id 
			WHERE id_offer = ?
			`
		result = await db.query(sql, [ offerId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Company'] = result[0].counter



		return childrenCounterList;
	}


	static async createOffer(offer, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(offerObjectDef, offer, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const offerDb = objectUtils.convertObjectToDb(offerObjectDef, offer)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(offerDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO offers(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const offerId = result.insertId;
		offer = this.getOfferById(offerId)
		return offer;
	}

	static async editOffer(offer, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(offerObjectDef, offer, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const offerDb = objectUtils.convertObjectToDb(offerObjectDef, offer)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(offerDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE offers
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(offer.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const offerId = offer.id
		offer = this.getOfferById(offerId)
		return offer;
	}

	
	static async deleteById(offerId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (offerId === undefined)
			throw new Error('Argument <offerId> required');
		if (isNaN(offerId) === undefined)
			throw new Error('Argument <offerId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(offerId))
				throw new Error(`Can not delete Offer ID <${ offerId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM offers WHERE id = ?`;
		const result = await db.query(sql, [offerId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	
	static async getSubscriptionCount(offerId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM subscriptions
			WHERE id_offer = ?
			`
		const result = await db.query(sql, [offerId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	

	static async hasChildren(offerId) {
		if (await this.getSubscriptionCount(offerId) > 0) 
			return true
		return false
	}
}

module.exports = () => {
	OfferModel.initialize();
	return OfferModel;
}

