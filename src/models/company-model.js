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

const { companyObjectDef } = require('../objects/company-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class CompanyModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getCompanyIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(companyObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM companies ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findCompanyCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(companyObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM companies ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findCompanyList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(companyObjectDef, filters)
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

		let sql = `SELECT * FROM companies ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const companyList = [];
		for (let companyRecord of result) 
			companyList.push( objectUtils.convertObjectFromDb(companyObjectDef, companyRecord, /*filter=*/true) )
		return companyList;
	}

	static async getCompanyById(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (companyId === undefined)
			throw new Error('Argument <companyId> required');
		if (isNaN(companyId) === undefined)
			throw new Error('Argument <companyId> is not a number');
		let sql = `SELECT * FROM companies WHERE id = ?`;
		const result = await db.query(sql, [companyId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const company = objectUtils.convertObjectFromDb(companyObjectDef, result[0], /*filter=*/false)
		return company;
	}
	
	static async getCompanyByName(name) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (name === undefined)
			throw new Error('Argument <name> required');
		let sql = `SELECT * FROM companies WHERE name = ?`;
		const result = await db.query(sql, [name]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const company = objectUtils.convertObjectFromDb(companyObjectDef, result[0], /*filter=*/false)
		return company;
	}
	


	static async getChildrenCountList(companyId) {
		if (companyId === undefined)
			throw new Error('Argument <companyId> required');
		if (isNaN(companyId) === undefined)
			throw new Error('Argument <companyId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		
		sql = `
			SELECT COUNT(id) AS counter 
			FROM subscriptions
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Subscription'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM companies
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Company'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM users
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['User'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM units
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Unit'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM sections
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Section'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM equipment_families
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['EquipmentFamily'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM equipment_types
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['EquipmentType'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM equipments
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Equipment'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM article_categories
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['ArticleCategory'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM article_subcategories
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['ArticleSubCategory'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM articles
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Article'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM components
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Component'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM nomenclatures
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Nomenclature'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM inventories
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Inventory'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM work_orders
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['WorkOrder'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM assignation
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Assignation'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM articles_to_change
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['ArticleToChange'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM interventions
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Intervention'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM intervenant
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Intervenant'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM changed_articles
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['ChangedArticle'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM suppliers
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Supplier'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM catalog
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Catalog'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM orders
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Order'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM order_lines
			WHERE id_company = ?
			`
		result = await db.query(sql, [ companyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['OrderLine'] = result[0].counter

		return childrenCounterList;
	}


	static async createCompany(company, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(companyObjectDef, company, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const companyDb = objectUtils.convertObjectToDb(companyObjectDef, company)

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
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const companyId = result.insertId;
		company = this.getCompanyById(companyId)
		return company;
	}

	static async editCompany(company, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(companyObjectDef, company, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const companyDb = objectUtils.convertObjectToDb(companyObjectDef, company)
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

	static async getSectionCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM sections
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getEquipmentFamilyCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM equipment_families
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getEquipmentTypeCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM equipment_types
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getEquipmentCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM equipments
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getArticleCategoryCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM article_categories
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getArticleSubCategoryCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM article_subcategories
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getArticleCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM articles
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getComponentCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM components
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getNomenclatureCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM nomenclatures
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getInventoryCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM inventories
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getWorkOrderCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM work_orders
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getAssignationCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM assignation
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getArticleToChangeCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM articles_to_change
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getInterventionCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM interventions
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getIntervenantCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM intervenant
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getChangedArticleCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM changed_articles
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getSupplierCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM suppliers
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getCatalogCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM catalog
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getOrderCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM orders
			WHERE id_company = ?
			`
		const result = await db.query(sql, [companyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getOrderLineCount(companyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM order_lines
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
		if (await this.getSectionCount(companyId) > 0) 
			return true
		if (await this.getEquipmentFamilyCount(companyId) > 0) 
			return true
		if (await this.getEquipmentTypeCount(companyId) > 0) 
			return true
		if (await this.getEquipmentCount(companyId) > 0) 
			return true
		if (await this.getArticleCategoryCount(companyId) > 0) 
			return true
		if (await this.getArticleSubCategoryCount(companyId) > 0) 
			return true
		if (await this.getArticleCount(companyId) > 0) 
			return true
		if (await this.getComponentCount(companyId) > 0) 
			return true
		if (await this.getNomenclatureCount(companyId) > 0) 
			return true
		if (await this.getInventoryCount(companyId) > 0) 
			return true
		if (await this.getWorkOrderCount(companyId) > 0) 
			return true
		if (await this.getAssignationCount(companyId) > 0) 
			return true
		if (await this.getArticleToChangeCount(companyId) > 0) 
			return true
		if (await this.getInterventionCount(companyId) > 0) 
			return true
		if (await this.getIntervenantCount(companyId) > 0) 
			return true
		if (await this.getChangedArticleCount(companyId) > 0) 
			return true
		if (await this.getSupplierCount(companyId) > 0) 
			return true
		if (await this.getCatalogCount(companyId) > 0) 
			return true
		if (await this.getOrderCount(companyId) > 0) 
			return true
		if (await this.getOrderLineCount(companyId) > 0) 
			return true
		return false
	}
}

module.exports = () => {
	CompanyModel.initialize();
	return CompanyModel;
}

