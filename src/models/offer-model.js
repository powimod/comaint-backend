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

const offerObjectHelper = require('../objects/offer-object-helper.cjs')

class OfferModel {

	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
	}

	static async getIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const sqlValues = [];
		const sqlFilters = [];
		const whereClause = sqlFilters.length === 0 ? '' : 'WHERE ' + sqlFilters.join(' AND ')

		let sql = `SELECT id FROM offers ${whereClause}`
		const result = await db.query(sql, sqlValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}


	static async getList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const sqlValues = [];
		const sqlFilters = [];
		const whereClause = sqlFilters.length === 0 ? '' : 'WHERE ' + sqlFilters.join(' AND ');

		let resultsPerPage = params.resultsPerPage; 
		if (resultsPerPage === undefined || isNaN(resultsPerPage)) 
			resultsPerPage = 25; // TODO hard coded value
		else
			resultsPerPage = parseInt(resultsPerPage);
		if (resultsPerPage < 1) resultsPerPage = 1;
		sqlValues.push(resultsPerPage);

		let offset = params.offset; 
		if (offset=== undefined || isNaN(resultsPerPage)) 
			offset = 0
		else
			offset = parseInt(offset);
		if (offset < 0) offset = 0;
		sqlValues.push(offset);

		let sql = `SELECT * FROM offers ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker
		// TODO order by
		// TODO field selection 

		const result = await db.query(sql, sqlValues);
		if (result.code) 
			throw new Error(result.code);
		const offerList = [];
		for (let offerRecord of result) 
			offerList.push( offerObjectHelper.convertOfferFromDb(offerRecord) );
		return offerList;
	}

	static async getOfferById(idOffer) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (idOffer === undefined)
			throw new Error('Argument <idOffer> required');
		if (isNaN(idOffer) === undefined)
			throw new Error('Argument <idOffer> is not a number');
		let sql = `SELECT * FROM offers WHERE id = ?`;
		const result = await db.query(sql, [idOffer]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const offer = offerObjectHelper.convertOfferFromDb(result[0]);
		return offer;
	}

	static async getChildrenCountList(idOffer) {
		if (idOffer === undefined)
			throw new Error('Argument <idOffer> required');
		if (isNaN(idOffer) === undefined)
			throw new Error('Argument <idOffer> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;

		const childrenCounterList = {}

		let sql = `
			SELECT COUNT(id) AS counter 
			FROM subscriptions 
			WHERE id_offer = ?
			`
		let result = await db.query(sql, [idOffer]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['subscriptions'] = result[0].counter

		sql = `
			SELECT COUNT(companies.id) AS counter
			FROM subscriptions INNER JOIN companies 
				ON subscriptions.id_company = companies.id 
			WHERE id_offer = ?
			`
		result = await db.query(sql, [idOffer]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['companies'] = result[0].counter

		return childrenCounterList;
	}


	static async createOffer(offer) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = offerObjectHelper.controlObjectOffer(offer, /*fullCheck=*/true, /*checkId=*/false)
		if ( error)
			throw new Error(error)

		const offerDb = offerObjectHelper.convertOfferToDb(offer)

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
		//console.log("SQL request", sqlRequest);
		//console.log("SQL params ", sqlParams);
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const offerId = result.insertId;
		offer = this.getOfferById(offerId)
		return offer;
	}

	static async editOffer(offer) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = offerObjectHelper.controlObjectOffer(offer, /*fullCheck=*/false, /*checkId=*/true)
		if ( error)
			throw new Error(error)

		const offerDb = offerObjectHelper.convertOfferToDb(offer)
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

		//console.log("SQL request", sqlRequest);
		//console.log("SQL params ", sqlParams);

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

