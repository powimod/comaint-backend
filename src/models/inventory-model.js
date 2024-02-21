/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * inventory-model.js
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

const { inventoryObjectDef } = require('../objects/inventory-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class InventoryModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getInventoryIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(inventoryObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM inventories ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findInventoryCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(inventoryObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM inventories ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findInventoryList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(inventoryObjectDef, filters)
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

		let sql = `SELECT * FROM inventories ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const inventoryList = [];
		for (let inventoryRecord of result) 
			inventoryList.push( objectUtils.convertObjectFromDb(inventoryObjectDef, inventoryRecord, /*filter=*/true) )
		return inventoryList;
	}

	static async getInventoryById(inventoryId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (inventoryId === undefined)
			throw new Error('Argument <inventoryId> required');
		if (isNaN(inventoryId) === undefined)
			throw new Error('Argument <inventoryId> is not a number');
		let sql = `SELECT * FROM inventories WHERE id = ?`;
		const result = await db.query(sql, [inventoryId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const inventory = objectUtils.convertObjectFromDb(inventoryObjectDef, result[0], /*filter=*/false)
		return inventory;
	}
	


	static async getChildrenCountList(inventoryId) {
		if (inventoryId === undefined)
			throw new Error('Argument <inventoryId> required');
		if (isNaN(inventoryId) === undefined)
			throw new Error('Argument <inventoryId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		

		return childrenCounterList;
	}


	static async createInventory(inventory, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(inventoryObjectDef, inventory, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const inventoryDb = objectUtils.convertObjectToDb(inventoryObjectDef, inventory)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(inventoryDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO inventories(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const inventoryId = result.insertId;
		inventory = this.getInventoryById(inventoryId)
		return inventory;
	}

	static async editInventory(inventory, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(inventoryObjectDef, inventory, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const inventoryDb = objectUtils.convertObjectToDb(inventoryObjectDef, inventory)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(inventoryDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE inventories
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(inventory.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const inventoryId = inventory.id
		inventory = this.getInventoryById(inventoryId)
		return inventory;
	}

	
	static async deleteById(inventoryId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (inventoryId === undefined)
			throw new Error('Argument <inventoryId> required');
		if (isNaN(inventoryId) === undefined)
			throw new Error('Argument <inventoryId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(inventoryId))
				throw new Error(`Can not delete Inventory ID <${ inventoryId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM inventories WHERE id = ?`;
		const result = await db.query(sql, [inventoryId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	

	static async hasChildren(inventoryId) {
		return false
	}
}

module.exports = () => {
	InventoryModel.initialize();
	return InventoryModel;
}

