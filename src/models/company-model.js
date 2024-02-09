/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * company-model.js
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

const companyObjectHelper = require('../objects/company-object-helper.cjs')

class CompanyModel {

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
		if (filters.managerId !== undefined) {
			sqlFilters.push('id_manager = ?')
			sqlValues.push(filters.managerId)
		}
		const whereClause = sqlFilters.length === 0 ? '' : 'WHERE ' + sqlFilters.join(' AND ')

		let sql = `SELECT id FROM companies ${whereClause}`
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
		sqlFilters.push('id = ?')
		sqlValues.push(filters.companyId);
		if (filters.managerId !== undefined) {
			sqlFilters.push('id_manager = ?')
			sqlValues.push(filters.managerId);
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

		let sql = `SELECT * FROM companies ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker
		// TODO order by
		// TODO field selection 

		const result = await db.query(sql, sqlValues);
		if (result.code) 
			throw new Error(result.code);
		const companyList = [];
		for (let companyRecord of result) 
			companyList.push( companyObjectHelper.convertCompanyFromDb(companyRecord) );
		return companyList;
	}

	static async getCompanyById(idCompany) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (idCompany === undefined)
			throw new Error('Argument <idCompany> required');
		if (isNaN(idCompany) === undefined)
			throw new Error('Argument <idCompany> is not a number');
		let sql = `SELECT * FROM companies WHERE id = ?`;
		const result = await db.query(sql, [idCompany]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const company = companyObjectHelper.convertCompanyFromDb(result[0]);
		return company;
	}

	static async createCompany(company) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = companyObjectHelper.controlObjectCompany(company, /*fullCheck=*/true, /*checkId=*/false)
		if ( error)
			throw new Error(error)

		const companyDb = companyObjectHelper.convertCompanyToDb(company)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(companyDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO companies(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		//console.log("SQL request", sqlRequest);
		//console.log("SQL params ", sqlParams);
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const companyId = result.insertId;
		company = this.getCompanyById(companyId)
		return company;
	}

	static async editCompany(company) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = companyObjectHelper.controlObjectCompany(company, /*fullCheck=*/false, /*checkId=*/true)
		if ( error)
			throw new Error(error)

		const companyDb = companyObjectHelper.convertCompanyToDb(company)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(companyDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE companies
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(company.id) // WHERE clause

		//console.log("SQL request", sqlRequest);
		//console.log("SQL params ", sqlParams);

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const companyId = company.id
		company = this.getCompanyById(companyId)
		return company;
	}

	static async deleteById(companyId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (companyId === undefined)
			throw new Error('Argument <companyId> required');
		if (isNaN(companyId) === undefined)
			throw new Error('Argument <companyId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(companyId))
				throw new Error(`Can not delete Company ID <${ companyId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM companies WHERE id = ?`;
		const result = await db.query(sql, [companyId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}
	static async getSubscriptionCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM subscriptions
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getCompanyCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM companies
			WHERE id_manager = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getUserCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM users
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getUnitCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM units
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	

	static async hasChildren(companyId) {
		if (await this.getSubscriptionCount(companyId) > 0) 
			return true
		if (await this.getCompanyCount(companyId) > 0) 
			return true
		if (await this.getUserCount(companyId) > 0) 
			return true
		if (await this.getUnitCount(companyId) > 0) 
			return true
		return false
	}

}

module.exports = () => {
	CompanyModel.initialize();
	return CompanyModel;
}

