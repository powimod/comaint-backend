/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * user-model.js
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
const bcrypt = require('bcrypt');

const { userObjectDef } = require('../objects/user-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class UserModel {
	static #config = null;
	static #model = null;

	static initialize = (config) => {
		assert(this.#model === null);
		assert(config !== undefined)
		this.#config = config;
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getUserIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(userObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM users ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findUserCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(userObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM users ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findUserList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(userObjectDef, filters)
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

		let sql = `SELECT * FROM users ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const userList = [];
		for (let userRecord of result) 
			userList.push( objectUtils.convertObjectFromDb(userObjectDef, userRecord, /*filter=*/true) )
		return userList;
	}

	static async getUserById(userId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (userId === undefined)
			throw new Error('Argument <userId> required');
		if (isNaN(userId) === undefined)
			throw new Error('Argument <userId> is not a number');
		let sql = `SELECT * FROM users WHERE id = ?`;
		const result = await db.query(sql, [userId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const user = objectUtils.convertObjectFromDb(userObjectDef, result[0], /*filter=*/false)
		return user;
	}
	
	static async getUserByEmail(email) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (email === undefined)
			throw new Error('Argument <email> required');
		let sql = `SELECT * FROM users WHERE email = ?`;
		const result = await db.query(sql, [email]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const user = objectUtils.convertObjectFromDb(userObjectDef, result[0], /*filter=*/false)
		return user;
	}
	


	static async getChildrenCountList(userId) {
		if (userId === undefined)
			throw new Error('Argument <userId> required');
		if (isNaN(userId) === undefined)
			throw new Error('Argument <userId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		
		sql = `
			SELECT COUNT(id) AS counter 
			FROM tokens
			WHERE id_user = ?
			`
		result = await db.query(sql, [ userId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Token'] = result[0].counter

		return childrenCounterList;
	}


	static async createUser(user, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(userObjectDef, user, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)
		// Encrypt password
		if (user.password === undefined || user.password === null)
			throw new Error('User password missing')
		await this.encryptPasswordIfPresent(user)

		const userDb = objectUtils.convertObjectToDb(userObjectDef, user)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(userDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO users(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const userId = result.insertId;
		user = this.getUserById(userId)
		return user;
	}

	static async editUser(user, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(userObjectDef, user, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)
		await this.encryptPasswordIfPresent(user)

		const userDb = objectUtils.convertObjectToDb(userObjectDef, user)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(userDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE users
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(user.id) // WHERE clause

		console.log("dOm sql:", sqlRequest)
		console.log("dOm params:", sqlParams)

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const userId = user.id
		user = this.getUserById(userId)
		return user;
	}

	
	static async deleteById(userId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (userId === undefined)
			throw new Error('Argument <userId> required');
		if (isNaN(userId) === undefined)
			throw new Error('Argument <userId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(userId))
				throw new Error(`Can not delete User ID <${ userId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM users WHERE id = ?`;
		const result = await db.query(sql, [userId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	
	static async getTokenCount(userId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM tokens
			WHERE id_user = ?
			`
		const result = await db.query(sql, [userId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	

	static async hasChildren(userId) {
		if (await this.getTokenCount(userId) > 0) 
			return true
		return false
	}

	static async checkPassword(user, password) {
		assert (user !== undefined)
		assert (user.password !== undefined)
		assert (password !== undefined)
		const isValid = await bcrypt.compare(password, user.password);
		return isValid
	}

	static async encryptPasswordIfPresent(user) {
		assert (user !== undefined)
		if (user.password === undefined)
			return
		assert(this.#config.security.hashSalt !== undefined);
		const saltRounds = this.#config.security.hashSalt;
		user.password = await bcrypt.hash(user.password, saltRounds)
	}
}

module.exports = (config) => {
	UserModel.initialize(config);
	return UserModel;
}

