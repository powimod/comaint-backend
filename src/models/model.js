/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * model.js
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

class Model {

	#config = null;
	#db = null;
	#promise_mysql = null;

	#AuthModel = null;
	#OfferModel = null;
	#SubscriptionModel = null;
	#CompanyModel = null;
	#UserModel = null;
	#TokenModel = null;
	#UnitModel = null;
	

	get db() {
		return this.#db;
	}	

	async connectDb() {
		const self = this;
		let promise_mysql = require('promise-mysql');
		const tempo = this.#config.db.reconnection.interval;
		assert(tempo !== undefined);

		function sleep(tempo) {
			return new Promise( (resolve) => {
				setTimeout(() => { resolve(); }, tempo);
			});
		}

		// connection retry loop
		this.#db = null;
		let db = null;
		const maxRetries = this.#config.db.reconnection.maxRetries;
		assert(maxRetries !== undefined);
		for (let retry = 0; retry < maxRetries ; retry++){
			console.log(`Connecting database...`);
			try {
				db = await promise_mysql.createConnection(this.#config.db);
				if (db.code === undefined) {
					break;
				}
				console.error(`Can not open database : ${db.code}`);
				db = null;
			}
			catch (error) {
				console.log(`Database connection error : ${error.message}`);
			}
			console.log(`Connection retry n°${retry+1}/${maxRetries} : waiting ${tempo}ms...`);
			await sleep(tempo);
		}
		this.#db = db;
		if (this.#db === null) 
			throw new Error('Can not connect database');
		this.#db.on('error', function(err) {
			self.#db = null;
			if (!err.fatal) return;
			if (err.code !== 'PROTOCOL_CONNECTION_LOST')
				throw err;
			console.log('DB connection lost...'); // : ' + err.stack);
			self.connectDb();
		});
		console.log("Database connection success");

	}

	async initialize(config) {
		assert(config !== undefined);
		assert (typeof(config) === 'object');
		if (this.#db != null)
			return;
		this.#config = config;

		console.log("Initializing Model");
		await this.connectDb();

		// setting regular database ping to keep connection alive
		const pingInterval = this.#config.db.pingInterval;
		console.log(`Database ping interval : ${pingInterval}ms`);
		setInterval( () => {
			if (this.#db === null)
				return;
			try {
				this.#db.query('SELECT 1');
			} catch(error) {
				console.log(`Database ping error : ${error.message}`);
			}
		}, pingInterval);

		this.#AuthModel = require('./auth-model.js')(this.#config);
		this.#OfferModel = require('./offer-model.js')();
		this.#SubscriptionModel = require('./subscription-model.js')();
		this.#CompanyModel = require('./company-model.js')();
		this.#UserModel = require('./user-model.js')();
		this.#TokenModel = require('./token-model.js')();
		this.#UnitModel = require('./unit-model.js')();
		
	}

	getAuthModel() {
		return this.#AuthModel;
	}

	
	getOfferModel() {
		return this.#OfferModel;
	}
	
	getSubscriptionModel() {
		return this.#SubscriptionModel;
	}
	
	getCompanyModel() {
		return this.#CompanyModel;
	}
	
	getUserModel() {
		return this.#UserModel;
	}
	
	getTokenModel() {
		return this.#TokenModel;
	}
	
	getUnitModel() {
		return this.#UnitModel;
	}
	
}

class ModelSingleton {
	constructor() {
		throw new Error('Can not instanciate singleton object!');
	}
	static getInstance() {
		if (! ModelSingleton.instance)
			ModelSingleton.instance = new Model();
		return ModelSingleton.instance;
	}
}

module.exports = ModelSingleton;
