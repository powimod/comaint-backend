/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * work-order-model.js
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

const { workOrderObjectDef } = require('../objects/work-order-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class WorkOrderModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getWorkOrderIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(workOrderObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM work_orders ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findWorkOrderCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(workOrderObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM work_orders ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findWorkOrderList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(workOrderObjectDef, filters)
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

		let sql = `SELECT * FROM work_orders ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const workOrderList = [];
		for (let workOrderRecord of result) 
			workOrderList.push( objectUtils.convertObjectFromDb(workOrderObjectDef, workOrderRecord, /*filter=*/true) )
		return workOrderList;
	}

	static async getWorkOrderById(workOrderId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (workOrderId === undefined)
			throw new Error('Argument <workOrderId> required');
		if (isNaN(workOrderId) === undefined)
			throw new Error('Argument <workOrderId> is not a number');
		let sql = `SELECT * FROM work_orders WHERE id = ?`;
		const result = await db.query(sql, [workOrderId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const workOrder = objectUtils.convertObjectFromDb(workOrderObjectDef, result[0], /*filter=*/false)
		return workOrder;
	}
	


	static async getChildrenCountList(workOrderId) {
		if (workOrderId === undefined)
			throw new Error('Argument <workOrderId> required');
		if (isNaN(workOrderId) === undefined)
			throw new Error('Argument <workOrderId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		
		sql = `
			SELECT COUNT(id) AS counter 
			FROM assignation
			WHERE id_work_order = ?
			`
		result = await db.query(sql, [ workOrderId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Assignation'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM articles_to_change
			WHERE id_work_order = ?
			`
		result = await db.query(sql, [ workOrderId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['ArticleToChange'] = result[0].counter

		return childrenCounterList;
	}


	static async createWorkOrder(workOrder, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(workOrderObjectDef, workOrder, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const workOrderDb = objectUtils.convertObjectToDb(workOrderObjectDef, workOrder)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(workOrderDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO work_orders(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const workOrderId = result.insertId;
		workOrder = this.getWorkOrderById(workOrderId)
		return workOrder;
	}

	static async editWorkOrder(workOrder, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(workOrderObjectDef, workOrder, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const workOrderDb = objectUtils.convertObjectToDb(workOrderObjectDef, workOrder)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(workOrderDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE work_orders
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(workOrder.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const workOrderId = workOrder.id
		workOrder = this.getWorkOrderById(workOrderId)
		return workOrder;
	}

	
	static async deleteById(workOrderId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (workOrderId === undefined)
			throw new Error('Argument <workOrderId> required');
		if (isNaN(workOrderId) === undefined)
			throw new Error('Argument <workOrderId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(workOrderId))
				throw new Error(`Can not delete WorkOrder ID <${ workOrderId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM work_orders WHERE id = ?`;
		const result = await db.query(sql, [workOrderId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	
	static async getAssignationCount(workOrderId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM assignation
			WHERE id_workOrder = ?
			`
		const result = await db.query(sql, [workOrderId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getArticleToChangeCount(workOrderId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM articles_to_change
			WHERE id_workOrder = ?
			`
		const result = await db.query(sql, [workOrderId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	

	static async hasChildren(workOrderId) {
		if (await this.getAssignationCount(workOrderId) > 0) 
			return true
		if (await this.getArticleToChangeCount(workOrderId) > 0) 
			return true
		return false
	}
}

module.exports = () => {
	WorkOrderModel.initialize();
	return WorkOrderModel;
}

