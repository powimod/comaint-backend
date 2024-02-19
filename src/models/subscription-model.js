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

const { subscriptionObjectDef } = require('../objects/subscription-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class SubscriptionModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getSubscriptionIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(subscriptionObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM subscriptions ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findSubscriptionCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(subscriptionObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM subscriptions ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findSubscriptionList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(subscriptionObjectDef, filters)
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

		let sql = `SELECT * FROM subscriptions ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const subscriptionList = [];
		for (let subscriptionRecord of result) 
			subscriptionList.push( objectUtils.convertObjectFromDb(subscriptionObjectDef, subscriptionRecord, /*filter=*/true) )
		return subscriptionList;
	}

	static async getSubscriptionById(subscriptionId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (subscriptionId === undefined)
			throw new Error('Argument <subscriptionId> required');
		if (isNaN(subscriptionId) === undefined)
			throw new Error('Argument <subscriptionId> is not a number');
		let sql = `SELECT * FROM subscriptions WHERE id = ?`;
		const result = await db.query(sql, [subscriptionId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const subscription = objectUtils.convertObjectFromDb(subscriptionObjectDef, result[0], /*filter=*/false)
		return subscription;
	}
	


	static async getChildrenCountList(subscriptionId) {
		if (subscriptionId === undefined)
			throw new Error('Argument <subscriptionId> required');
		if (isNaN(subscriptionId) === undefined)
			throw new Error('Argument <subscriptionId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		

		return childrenCounterList;
	}


	static async createSubscription(subscription, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(subscriptionObjectDef, subscription, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const subscriptionDb = objectUtils.convertObjectToDb(subscriptionObjectDef, subscription)

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
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const subscriptionId = result.insertId;
		subscription = this.getSubscriptionById(subscriptionId)
		return subscription;
	}

	static async editSubscription(subscription, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(subscriptionObjectDef, subscription, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const subscriptionDb = objectUtils.convertObjectToDb(subscriptionObjectDef, subscription)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(subscriptionDb)) {
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

