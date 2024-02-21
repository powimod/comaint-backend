/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * article-category-model.js
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

const { articleCategoryObjectDef } = require('../objects/article-category-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class ArticleCategoryModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getArticleCategoryIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(articleCategoryObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM article_categories ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findArticleCategoryCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(articleCategoryObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM article_categories ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findArticleCategoryList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(articleCategoryObjectDef, filters)
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

		let sql = `SELECT * FROM article_categories ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const articleCategoryList = [];
		for (let articleCategoryRecord of result) 
			articleCategoryList.push( objectUtils.convertObjectFromDb(articleCategoryObjectDef, articleCategoryRecord, /*filter=*/true) )
		return articleCategoryList;
	}

	static async getArticleCategoryById(articleCategoryId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (articleCategoryId === undefined)
			throw new Error('Argument <articleCategoryId> required');
		if (isNaN(articleCategoryId) === undefined)
			throw new Error('Argument <articleCategoryId> is not a number');
		let sql = `SELECT * FROM article_categories WHERE id = ?`;
		const result = await db.query(sql, [articleCategoryId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const articleCategory = objectUtils.convertObjectFromDb(articleCategoryObjectDef, result[0], /*filter=*/false)
		return articleCategory;
	}
	


	static async getChildrenCountList(articleCategoryId) {
		if (articleCategoryId === undefined)
			throw new Error('Argument <articleCategoryId> required');
		if (isNaN(articleCategoryId) === undefined)
			throw new Error('Argument <articleCategoryId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		
		sql = `
			SELECT COUNT(id) AS counter 
			FROM article_subcategories
			WHERE id_article_category = ?
			`
		result = await db.query(sql, [ articleCategoryId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['ArticleSubCategory'] = result[0].counter

		return childrenCounterList;
	}


	static async createArticleCategory(articleCategory, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(articleCategoryObjectDef, articleCategory, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const articleCategoryDb = objectUtils.convertObjectToDb(articleCategoryObjectDef, articleCategory)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(articleCategoryDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO article_categories(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const articleCategoryId = result.insertId;
		articleCategory = this.getArticleCategoryById(articleCategoryId)
		return articleCategory;
	}

	static async editArticleCategory(articleCategory, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(articleCategoryObjectDef, articleCategory, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const articleCategoryDb = objectUtils.convertObjectToDb(articleCategoryObjectDef, articleCategory)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(articleCategoryDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE article_categories
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(articleCategory.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const articleCategoryId = articleCategory.id
		articleCategory = this.getArticleCategoryById(articleCategoryId)
		return articleCategory;
	}

	
	static async deleteById(articleCategoryId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (articleCategoryId === undefined)
			throw new Error('Argument <articleCategoryId> required');
		if (isNaN(articleCategoryId) === undefined)
			throw new Error('Argument <articleCategoryId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(articleCategoryId))
				throw new Error(`Can not delete ArticleCategory ID <${ articleCategoryId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM article_categories WHERE id = ?`;
		const result = await db.query(sql, [articleCategoryId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	
	static async getArticleSubCategoryCount(articleCategoryId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM article_subcategories
			WHERE id_category = ?
			`
		const result = await db.query(sql, [articleCategoryId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	

	static async hasChildren(articleCategoryId) {
		if (await this.getArticleSubCategoryCount(articleCategoryId) > 0) 
			return true
		return false
	}
}

module.exports = () => {
	ArticleCategoryModel.initialize();
	return ArticleCategoryModel;
}

