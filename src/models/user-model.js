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

const userObjectHelper = require('../objects/user-object-helper.cjs')

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

	static async getIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const sqlValues = [];
		const sqlFilters = [];
		if (filters.companyId !== undefined) {
			sqlFilters.push('id_company = ?')
			sqlValues.push(filters.companyId)
		}
		const whereClause = sqlFilters.length === 0 ? '' : 'WHERE ' + sqlFilters.join(' AND ')

		let sql = `SELECT id FROM users ${whereClause}`
		const result = await db.query(sql, sqlValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findUserCount(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const sqlValues = [];
		const sqlFilters = [];
		if (filters.companyId !== undefined) {
			sqlFilters.push('id_company = ?')
			sqlValues.push(filters.companyId)
		}
		if (filters.administrator !== undefined) {
			sqlFilters.push('administrator = ?')
			sqlValues.push(filters.administrator)
		}
		const whereClause = sqlFilters.length === 0 ? '' : 'WHERE ' + sqlFilters.join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM users ${whereClause}`
		const result = await db.query(sql, sqlValues)
		if (result.code) 
			throw new Error(result.code)
		return result[0].counter;
	}

	static async getList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const sqlValues = [];
		const sqlFilters = [];
		if (filters.companyId !== undefined) {
			sqlFilters.push('id_company = ?')
			sqlValues.push(filters.companyId);
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

		let sql = `SELECT * FROM users ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker
		// TODO order by
		// TODO field selection 

		const result = await db.query(sql, sqlValues);
		if (result.code) 
			throw new Error(result.code);
		const userList = [];
		for (let userRecord of result) 
			userList.push( userObjectHelper.convertUserFromDb(userRecord), /*filter=*/true );
		return userList;
	}

	static async getUserById(idUser) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (idUser === undefined)
			throw new Error('Argument <idUser> required');
		if (isNaN(idUser) === undefined)
			throw new Error('Argument <idUser> is not a number');
		let sql = `SELECT * FROM users WHERE id = ?`;
		const result = await db.query(sql, [idUser]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const user = userObjectHelper.convertUserFromDb(result[0], /*filter=*/false);
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
		const user = userObjectHelper.convertUserFromDb(result[0], /*filter=*/ false);
		return user;
	}


	static async createUser(user) {
		assert(this.#model !== null);
		const db = this.#model.db;

		// TODO pass i18n_t function to object helper
		const error = userObjectHelper.controlObjectUser(user, /*fullCheck=*/true, /*checkId=*/false)
		if ( error)
			throw new Error(error)

		// make a hash of the password
		if (user.password === undefined || user.password === null)
			throw new Error('User password missing')
		await this.encryptPasswordIfPresent(user)
		
		const userDb = userObjectHelper.convertUserToDb(user)

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
		user = this.getUserById(userId) // to get all properties with defaults values
		return user;
	}

	static async editUser(user) {
		assert(this.#model !== null)
		const db = this.#model.db

		// TODO pass i18n_t function to object helper
		const error = userObjectHelper.controlObjectUser(user, /*fullCheck=*/false, /*checkId=*/true)
		if ( error)
			throw new Error(error)

		await this.encryptPasswordIfPresent(user)

		const userDb = userObjectHelper.convertUserToDb(user)
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
		const passwordValid = await bcrypt.compare(password, user.password);
		return passwordValid
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

