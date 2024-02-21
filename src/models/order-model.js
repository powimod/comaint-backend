/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * order-model.js
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

const { orderObjectDef } = require('../objects/order-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class OrderModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getOrderIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(orderObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM orders ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findOrderCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(orderObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM orders ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findOrderList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(orderObjectDef, filters)
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

		let sql = `SELECT * FROM orders ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const orderList = [];
		for (let orderRecord of result) 
			orderList.push( objectUtils.convertObjectFromDb(orderObjectDef, orderRecord, /*filter=*/true) )
		return orderList;
	}

	static async getOrderById(orderId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (orderId === undefined)
			throw new Error('Argument <orderId> required');
		if (isNaN(orderId) === undefined)
			throw new Error('Argument <orderId> is not a number');
		let sql = `SELECT * FROM orders WHERE id = ?`;
		const result = await db.query(sql, [orderId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const order = objectUtils.convertObjectFromDb(orderObjectDef, result[0], /*filter=*/false)
		return order;
	}
	


	static async getChildrenCountList(orderId) {
		if (orderId === undefined)
			throw new Error('Argument <orderId> required');
		if (isNaN(orderId) === undefined)
			throw new Error('Argument <orderId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		
		sql = `
			SELECT COUNT(id) AS counter 
			FROM order_lines
			WHERE id_order = ?
			`
		result = await db.query(sql, [ orderId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['OrderLine'] = result[0].counter

		return childrenCounterList;
	}


	static async createOrder(order, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(orderObjectDef, order, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const orderDb = objectUtils.convertObjectToDb(orderObjectDef, order)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(orderDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO orders(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const orderId = result.insertId;
		order = this.getOrderById(orderId)
		return order;
	}

	static async editOrder(order, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(orderObjectDef, order, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const orderDb = objectUtils.convertObjectToDb(orderObjectDef, order)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(orderDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE orders
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(order.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const orderId = order.id
		order = this.getOrderById(orderId)
		return order;
	}

	
	static async deleteById(orderId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (orderId === undefined)
			throw new Error('Argument <orderId> required');
		if (isNaN(orderId) === undefined)
			throw new Error('Argument <orderId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(orderId))
				throw new Error(`Can not delete Order ID <${ orderId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM orders WHERE id = ?`;
		const result = await db.query(sql, [orderId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	
	static async getOrderLineCount(orderId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM order_lines
			WHERE id_order = ?
			`
		const result = await db.query(sql, [orderId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	

	static async hasChildren(orderId) {
		if (await this.getOrderLineCount(orderId) > 0) 
			return true
		return false
	}
}

module.exports = () => {
	OrderModel.initialize();
	return OrderModel;
}

