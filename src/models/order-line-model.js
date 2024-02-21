/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * order-line-model.js
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

const { orderLineObjectDef } = require('../objects/order-line-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class OrderLineModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getOrderLineIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(orderLineObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM order_lines ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findOrderLineCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(orderLineObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM order_lines ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findOrderLineList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(orderLineObjectDef, filters)
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

		let sql = `SELECT * FROM order_lines ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const orderLineList = [];
		for (let orderLineRecord of result) 
			orderLineList.push( objectUtils.convertObjectFromDb(orderLineObjectDef, orderLineRecord, /*filter=*/true) )
		return orderLineList;
	}

	static async getOrderLineById(orderLineId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (orderLineId === undefined)
			throw new Error('Argument <orderLineId> required');
		if (isNaN(orderLineId) === undefined)
			throw new Error('Argument <orderLineId> is not a number');
		let sql = `SELECT * FROM order_lines WHERE id = ?`;
		const result = await db.query(sql, [orderLineId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const orderLine = objectUtils.convertObjectFromDb(orderLineObjectDef, result[0], /*filter=*/false)
		return orderLine;
	}
	


	static async getChildrenCountList(orderLineId) {
		if (orderLineId === undefined)
			throw new Error('Argument <orderLineId> required');
		if (isNaN(orderLineId) === undefined)
			throw new Error('Argument <orderLineId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		

		return childrenCounterList;
	}


	static async createOrderLine(orderLine, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(orderLineObjectDef, orderLine, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const orderLineDb = objectUtils.convertObjectToDb(orderLineObjectDef, orderLine)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(orderLineDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO order_lines(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const orderLineId = result.insertId;
		orderLine = this.getOrderLineById(orderLineId)
		return orderLine;
	}

	static async editOrderLine(orderLine, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(orderLineObjectDef, orderLine, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const orderLineDb = objectUtils.convertObjectToDb(orderLineObjectDef, orderLine)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(orderLineDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE order_lines
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(orderLine.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const orderLineId = orderLine.id
		orderLine = this.getOrderLineById(orderLineId)
		return orderLine;
	}

	
	static async deleteById(orderLineId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (orderLineId === undefined)
			throw new Error('Argument <orderLineId> required');
		if (isNaN(orderLineId) === undefined)
			throw new Error('Argument <orderLineId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(orderLineId))
				throw new Error(`Can not delete OrderLine ID <${ orderLineId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM order_lines WHERE id = ?`;
		const result = await db.query(sql, [orderLineId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	

	static async hasChildren(orderLineId) {
		return false
	}
}

module.exports = () => {
	OrderLineModel.initialize();
	return OrderLineModel;
}

