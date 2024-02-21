/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * equipment-model.js
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

const { equipmentObjectDef } = require('../objects/equipment-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class EquipmentModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getEquipmentIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(equipmentObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM equipments ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findEquipmentCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(equipmentObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM equipments ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findEquipmentList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(equipmentObjectDef, filters)
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

		let sql = `SELECT * FROM equipments ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const equipmentList = [];
		for (let equipmentRecord of result) 
			equipmentList.push( objectUtils.convertObjectFromDb(equipmentObjectDef, equipmentRecord, /*filter=*/true) )
		return equipmentList;
	}

	static async getEquipmentById(equipmentId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (equipmentId === undefined)
			throw new Error('Argument <equipmentId> required');
		if (isNaN(equipmentId) === undefined)
			throw new Error('Argument <equipmentId> is not a number');
		let sql = `SELECT * FROM equipments WHERE id = ?`;
		const result = await db.query(sql, [equipmentId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const equipment = objectUtils.convertObjectFromDb(equipmentObjectDef, result[0], /*filter=*/false)
		return equipment;
	}
	


	static async getChildrenCountList(equipmentId) {
		if (equipmentId === undefined)
			throw new Error('Argument <equipmentId> required');
		if (isNaN(equipmentId) === undefined)
			throw new Error('Argument <equipmentId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		
		sql = `
			SELECT COUNT(id) AS counter 
			FROM work_orders
			WHERE id_equipment = ?
			`
		result = await db.query(sql, [ equipmentId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['WorkOrder'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM interventions
			WHERE id_equipment = ?
			`
		result = await db.query(sql, [ equipmentId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Intervention'] = result[0].counter

		return childrenCounterList;
	}


	static async createEquipment(equipment, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(equipmentObjectDef, equipment, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const equipmentDb = objectUtils.convertObjectToDb(equipmentObjectDef, equipment)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(equipmentDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO equipments(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const equipmentId = result.insertId;
		equipment = this.getEquipmentById(equipmentId)
		return equipment;
	}

	static async editEquipment(equipment, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(equipmentObjectDef, equipment, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const equipmentDb = objectUtils.convertObjectToDb(equipmentObjectDef, equipment)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(equipmentDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE equipments
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(equipment.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const equipmentId = equipment.id
		equipment = this.getEquipmentById(equipmentId)
		return equipment;
	}

	
	static async deleteById(equipmentId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (equipmentId === undefined)
			throw new Error('Argument <equipmentId> required');
		if (isNaN(equipmentId) === undefined)
			throw new Error('Argument <equipmentId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(equipmentId))
				throw new Error(`Can not delete Equipment ID <${ equipmentId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM equipments WHERE id = ?`;
		const result = await db.query(sql, [equipmentId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	
	static async getWorkOrderCount(equipmentId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM work_orders
			WHERE id_equipment = ?
			`
		const result = await db.query(sql, [equipmentId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getInterventionCount(equipmentId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM interventions
			WHERE id_equipment = ?
			`
		const result = await db.query(sql, [equipmentId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	

	static async hasChildren(equipmentId) {
		if (await this.getWorkOrderCount(equipmentId) > 0) 
			return true
		if (await this.getInterventionCount(equipmentId) > 0) 
			return true
		return false
	}
}

module.exports = () => {
	EquipmentModel.initialize();
	return EquipmentModel;
}

