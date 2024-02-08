/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * subscription-model.js
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

const subscriptionObjectHelper = require('../objects/subscription-object-helper.cjs')

class SubscriptionModel {

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
		if (filters.offerId !== undefined) {
			sqlFilters.push('id_offer = ?')
			sqlValues.push(filters.offerId)
		}
		if (filters.companyId !== undefined) {
			sqlFilters.push('id_company = ?')
			sqlValues.push(filters.companyId)
		}
		const whereClause = sqlFilters.length === 0 ? '' : 'WHERE ' + sqlFilters.join(' AND ')

		let sql = `SELECT id FROM subscriptions ${whereClause}`
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
		if (filters.offerId !== undefined) {
			sqlFilters.push('id_offer = ?')
			sqlValues.push(filters.offerId);
		}
		if (filters.companyId !== undefined) {
			sqlFilters.push('id_company = ?')
			sqlValues.push(filters.companyId);
		}
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

		let sql = `SELECT * FROM subscriptions ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker
		// TODO order by
		// TODO field selection 

		const result = await db.query(sql, sqlValues);
		if (result.code) 
			throw new Error(result.code);
		const subscriptionList = [];
		for (let subscriptionRecord of result) 
			subscriptionList.push( subscriptionObjectHelper.convertSubscriptionFromDb(subscriptionRecord) );
		return subscriptionList;
	}

	static async getSubscriptionById(idSubscription) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (idSubscription === undefined)
			throw new Error('Argument <idSubscription> required');
		if (isNaN(idSubscription) === undefined)
			throw new Error('Argument <idSubscription> is not a number');
		let sql = `SELECT * FROM subscriptions WHERE id = ?`;
		const result = await db.query(sql, [idSubscription]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const subscription = subscriptionObjectHelper.convertSubscriptionFromDb(result[0]);
		return subscription;
	}

	static async createSubscription(subscription) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = subscriptionObjectHelper.controlObjectSubscription(subscription, /*fullCheck=*/true, /*checkId=*/false)
		if ( error)
			throw new Error(error)

		const subscriptionDb = subscriptionObjectHelper.convertSubscriptionToDb(subscription)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(subscriptionDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO subscriptions(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		//console.log("SQL request", sqlRequest);
		//console.log("SQL params ", sqlParams);
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const subscriptionId = result.insertId;
		subscription = this.getSubscriptionById(subscriptionId)
		return subscription;
	}

	static async editSubscription(subscription) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = subscriptionObjectHelper.controlObjectSubscription(subscription, /*fullCheck=*/false, /*checkId=*/true)
		if ( error)
			throw new Error(error)

		const subscriptionDb = subscriptionObjectHelper.convertSubscriptionToDb(subscription)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(userDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE subscriptions
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(subscription.id) // WHERE clause

		//console.log("SQL request", sqlRequest);
		//console.log("SQL params ", sqlParams);

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const subscriptionId = subscription.id
		subscription = this.getSubscriptionById(subscriptionId)
		return subscription;
	}

	static async deleteById(subscriptionId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (subscriptionId === undefined)
			throw new Error('Argument <subscriptionId> required');
		if (isNaN(subscriptionId) === undefined)
			throw new Error('Argument <subscriptionId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(subscriptionId))
				throw new Error(`Can not delete Subscription ID <${ subscriptionId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM subscriptions WHERE id = ?`;
		const result = await db.query(sql, [subscriptionId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	static async hasChildren(subscriptionId) {
		return false
	}

}

module.exports = () => {
	SubscriptionModel.initialize();
	return SubscriptionModel;
}

