/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * section-model.js
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

const { sectionObjectDef } = require('../objects/section-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class SectionModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getSectionIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(sectionObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM sections ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findSectionCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(sectionObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM sections ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findSectionList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(sectionObjectDef, filters)
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

		let sql = `SELECT * FROM sections ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const sectionList = [];
		for (let sectionRecord of result) 
			sectionList.push( objectUtils.convertObjectFromDb(sectionObjectDef, sectionRecord, /*filter=*/true) )
		return sectionList;
	}

	static async getSectionById(sectionId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (sectionId === undefined)
			throw new Error('Argument <sectionId> required');
		if (isNaN(sectionId) === undefined)
			throw new Error('Argument <sectionId> is not a number');
		let sql = `SELECT * FROM sections WHERE id = ?`;
		const result = await db.query(sql, [sectionId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const section = objectUtils.convertObjectFromDb(sectionObjectDef, result[0], /*filter=*/false)
		return section;
	}
	


	static async getChildrenCountList(sectionId) {
		if (sectionId === undefined)
			throw new Error('Argument <sectionId> required');
		if (isNaN(sectionId) === undefined)
			throw new Error('Argument <sectionId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		
		sql = `
			SELECT COUNT(id) AS counter 
			FROM equipments
			WHERE id_section = ?
			`
		result = await db.query(sql, [ sectionId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Equipment'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM articles
			WHERE id_section = ?
			`
		result = await db.query(sql, [ sectionId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Article'] = result[0].counter

		return childrenCounterList;
	}


	static async createSection(section, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(sectionObjectDef, section, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const sectionDb = objectUtils.convertObjectToDb(sectionObjectDef, section)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(sectionDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO sections(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const sectionId = result.insertId;
		section = this.getSectionById(sectionId)
		return section;
	}

	static async editSection(section, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(sectionObjectDef, section, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const sectionDb = objectUtils.convertObjectToDb(sectionObjectDef, section)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(sectionDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE sections
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(section.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const sectionId = section.id
		section = this.getSectionById(sectionId)
		return section;
	}

	
	static async deleteById(sectionId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (sectionId === undefined)
			throw new Error('Argument <sectionId> required');
		if (isNaN(sectionId) === undefined)
			throw new Error('Argument <sectionId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(sectionId))
				throw new Error(`Can not delete Section ID <${ sectionId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM sections WHERE id = ?`;
		const result = await db.query(sql, [sectionId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	
	static async getEquipmentCount(sectionId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM equipments
			WHERE id_section = ?
			`
		const result = await db.query(sql, [sectionId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getArticleCount(sectionId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM articles
			WHERE id_section = ?
			`
		const result = await db.query(sql, [sectionId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	

	static async hasChildren(sectionId) {
		if (await this.getEquipmentCount(sectionId) > 0) 
			return true
		if (await this.getArticleCount(sectionId) > 0) 
			return true
		return false
	}
}

module.exports = () => {
	SectionModel.initialize();
	return SectionModel;
}

