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
	#SectionModel = null;
	#EquipmentFamilyModel = null;
	#EquipmentTypeModel = null;
	#EquipmentModel = null;
	#ArticleCategoryModel = null;
	#ArticleSubCategoryModel = null;
	#ArticleModel = null;
	#ComponentModel = null;
	#NomenclatureModel = null;
	#InventoryModel = null;
	#WorkOrderModel = null;
	#AssignationModel = null;
	#ArticleToChangeModel = null;
	#InterventionModel = null;
	#IntervenantModel = null;
	#ChangedArticleModel = null;
	#SupplierModel = null;
	#CatalogModel = null;
	#OrderModel = null;
	#OrderLineModel = null;
	
	#SelectorModel = null;

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
		this.#OfferModel = require('./offer-model.js')(this.#config);
		this.#SubscriptionModel = require('./subscription-model.js')(this.#config);
		this.#CompanyModel = require('./company-model.js')(this.#config);
		this.#UserModel = require('./user-model.js')(this.#config);
		this.#TokenModel = require('./token-model.js')(this.#config);
		this.#UnitModel = require('./unit-model.js')(this.#config);
		this.#SectionModel = require('./section-model.js')(this.#config);
		this.#EquipmentFamilyModel = require('./equipment-family-model.js')(this.#config);
		this.#EquipmentTypeModel = require('./equipment-type-model.js')(this.#config);
		this.#EquipmentModel = require('./equipment-model.js')(this.#config);
		this.#ArticleCategoryModel = require('./article-category-model.js')(this.#config);
		this.#ArticleSubCategoryModel = require('./article-sub-category-model.js')(this.#config);
		this.#ArticleModel = require('./article-model.js')(this.#config);
		this.#ComponentModel = require('./component-model.js')(this.#config);
		this.#NomenclatureModel = require('./nomenclature-model.js')(this.#config);
		this.#InventoryModel = require('./inventory-model.js')(this.#config);
		this.#WorkOrderModel = require('./work-order-model.js')(this.#config);
		this.#AssignationModel = require('./assignation-model.js')(this.#config);
		this.#ArticleToChangeModel = require('./article-to-change-model.js')(this.#config);
		this.#InterventionModel = require('./intervention-model.js')(this.#config);
		this.#IntervenantModel = require('./intervenant-model.js')(this.#config);
		this.#ChangedArticleModel = require('./changed-article-model.js')(this.#config);
		this.#SupplierModel = require('./supplier-model.js')(this.#config);
		this.#CatalogModel = require('./catalog-model.js')(this.#config);
		this.#OrderModel = require('./order-model.js')(this.#config);
		this.#OrderLineModel = require('./order-line-model.js')(this.#config);

		
		this.#SelectorModel = require('./selector-model.js')(this.#config);
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
	
	getSectionModel() {
		return this.#SectionModel;
	}
	
	getEquipmentFamilyModel() {
		return this.#EquipmentFamilyModel;
	}
	
	getEquipmentTypeModel() {
		return this.#EquipmentTypeModel;
	}
	
	getEquipmentModel() {
		return this.#EquipmentModel;
	}
	
	getArticleCategoryModel() {
		return this.#ArticleCategoryModel;
	}
	
	getArticleSubCategoryModel() {
		return this.#ArticleSubCategoryModel;
	}
	
	getArticleModel() {
		return this.#ArticleModel;
	}
	
	getComponentModel() {
		return this.#ComponentModel;
	}
	
	getNomenclatureModel() {
		return this.#NomenclatureModel;
	}
	
	getInventoryModel() {
		return this.#InventoryModel;
	}
	
	getWorkOrderModel() {
		return this.#WorkOrderModel;
	}
	
	getAssignationModel() {
		return this.#AssignationModel;
	}
	
	getArticleToChangeModel() {
		return this.#ArticleToChangeModel;
	}
	
	getInterventionModel() {
		return this.#InterventionModel;
	}
	
	getIntervenantModel() {
		return this.#IntervenantModel;
	}
	
	getChangedArticleModel() {
		return this.#ChangedArticleModel;
	}
	
	getSupplierModel() {
		return this.#SupplierModel;
	}
	
	getCatalogModel() {
		return this.#CatalogModel;
	}
	
	getOrderModel() {
		return this.#OrderModel;
	}
	
	getOrderLineModel() {
		return this.#OrderLineModel;
	}

	getSelectorModel() {
		return this.#SelectorModel;
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
