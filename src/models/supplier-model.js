/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * supplier-model.js
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

const { supplierObjectDef } = require('../objects/supplier-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class SupplierModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getSupplierIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(supplierObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM suppliers ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findSupplierCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(supplierObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM suppliers ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findSupplierList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(supplierObjectDef, filters)
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

		let sql = `SELECT * FROM suppliers ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const supplierList = [];
		for (let supplierRecord of result) 
			supplierList.push( objectUtils.convertObjectFromDb(supplierObjectDef, supplierRecord, /*filter=*/true) )
		return supplierList;
	}

	static async getSupplierById(supplierId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (supplierId === undefined)
			throw new Error('Argument <supplierId> required');
		if (isNaN(supplierId) === undefined)
			throw new Error('Argument <supplierId> is not a number');
		let sql = `SELECT * FROM suppliers WHERE id = ?`;
		const result = await db.query(sql, [supplierId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const supplier = objectUtils.convertObjectFromDb(supplierObjectDef, result[0], /*filter=*/false)
		return supplier;
	}
	


	static async getChildrenCountList(supplierId) {
		if (supplierId === undefined)
			throw new Error('Argument <supplierId> required');
		if (isNaN(supplierId) === undefined)
			throw new Error('Argument <supplierId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		
		sql = `
			SELECT COUNT(id) AS counter 
			FROM catalog
			WHERE id_supplier = ?
			`
		result = await db.query(sql, [ supplierId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Catalog'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM orders
			WHERE id_supplier = ?
			`
		result = await db.query(sql, [ supplierId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Order'] = result[0].counter

		return childrenCounterList;
	}


	static async createSupplier(supplier, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(supplierObjectDef, supplier, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const supplierDb = objectUtils.convertObjectToDb(supplierObjectDef, supplier)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(supplierDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO suppliers(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const supplierId = result.insertId;
		supplier = this.getSupplierById(supplierId)
		return supplier;
	}

	static async editSupplier(supplier, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(supplierObjectDef, supplier, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const supplierDb = objectUtils.convertObjectToDb(supplierObjectDef, supplier)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(supplierDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE suppliers
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(supplier.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const supplierId = supplier.id
		supplier = this.getSupplierById(supplierId)
		return supplier;
	}

	
	static async deleteById(supplierId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (supplierId === undefined)
			throw new Error('Argument <supplierId> required');
		if (isNaN(supplierId) === undefined)
			throw new Error('Argument <supplierId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(supplierId))
				throw new Error(`Can not delete Supplier ID <${ supplierId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM suppliers WHERE id = ?`;
		const result = await db.query(sql, [supplierId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	
	static async getCatalogCount(supplierId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM catalog
			WHERE id_supplier = ?
			`
		const result = await db.query(sql, [supplierId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getOrderCount(supplierId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM orders
			WHERE id_supplier = ?
			`
		const result = await db.query(sql, [supplierId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	

	static async hasChildren(supplierId) {
		if (await this.getCatalogCount(supplierId) > 0) 
			return true
		if (await this.getOrderCount(supplierId) > 0) 
			return true
		return false
	}
}

module.exports = () => {
	SupplierModel.initialize();
	return SupplierModel;
}

