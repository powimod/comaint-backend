/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * controller.js
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

'use strict';

const util = require('../util.js');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');

class Controller {
	#app = null; // Express application
	#config = null;
	#model;
	#view; 

	#authRoutes = null;
	#OfferRoutes = null;
	#SubscriptionRoutes = null;
	#CompanyRoutes = null;
	#UserRoutes = null;
	#TokenRoutes = null;
	#UnitRoutes = null;
	#SectionRoutes = null;
	#EquipmentFamilyRoutes = null;
	#EquipmentTypeRoutes = null;
	#EquipmentRoutes = null;
	#ArticleCategoryRoutes = null;
	#ArticleSubCategoryRoutes = null;
	#ArticleRoutes = null;
	#ComponentRoutes = null;
	#NomenclatureRoutes = null;
	#InventoryRoutes = null;
	#WorkOrderRoutes = null;
	#AssignationRoutes = null;
	#ArticleToChangeRoutes = null;
	#InterventionRoutes = null;
	#IntervenantRoutes = null;
	#ChangedArticleRoutes = null;
	#SupplierRoutes = null;
	#CatalogRoutes = null;
	#OrderRoutes = null;
	#OrderLineRoutes = null;
	
	#SelectorRoutes = null;

	initialize(config, model, view) {
		if (! config instanceof Object)
			throw new Error('Invalid config argument');
		if (! model instanceof Object || model.constructor.name !== 'Model')
			throw new Error('Invalid model argument');
		if (! view instanceof Object || view.constructor.name !== 'View')
			throw new Error('Invalid view argument');

		this.#config = config;
		this.#model = model;
		this.#view = view; 

		const express = require('express');
		this.#app = express();
		this.#app.use(express.json())
		this.#app.use(express.urlencoded({extended: true}));
		this.#app.use(i18nextMiddleware.handle(i18next));

		const cors = require('cors')
		this.#app.use(cors());

		// TODO add session

		// initialize auth routes FIRST since it declares the cookie loader middleware
		this.#authRoutes = require('./auth-routes.js');
		this.#authRoutes.initialize(this.#app, this.#model.getAuthModel(), this.#view, config);

		this.#app.get('/', (request, response) => {
			this.#view.sendJsonResult(response, 'API comaint frontend ready');
		});

		this.#app.get('/version', (request, response) => {
			this.#view.sendJsonResult(response, '0.0.2');
		});

		this.#app.get('/api/version', (request, response) => {
			this.#view.sendJsonResult(response, 'v1');
		});

		this.#app.get('/api/v1', (request, response) => {
			this.#view.sendJsonResult(response, 'comaint backend API v1 ready');
		});

		this.#app.post('/sendMail', async (request, response) => {
			try {
				const email = request.body.email;
				if (email === undefined)
					throw new Error(`Can't find <email> in request body`);
				const subject = request.body.subject;
				if (subject === undefined)
					throw new Error(`Can't find <subject> in request body`);
				const textBody = request.body.text;
				if (textBody === undefined)
					throw new Error(`Can't find <text> in request body`);
				const htmlBody = `<p>${textBody}</p>`;
				const result = await util.sendMail(
					email,
					subject,
					textBody,
					htmlBody,
					this.#config.mail
				); 
				this.#view.sendJsonResult(response, result);
			}
			catch (error) {
				const errorMessage = (error.message !== undefined) ? error.message : error;
				console.error(errorMessage);
				response.json({ ok : false, error: errorMessage });
			}
		});

		
		this.#OfferRoutes = require('./offer-routes.js')(this.#app, this.#model.getOfferModel(), this.#view);
		this.#SubscriptionRoutes = require('./subscription-routes.js')(this.#app, this.#model.getSubscriptionModel(), this.#view);
		this.#CompanyRoutes = require('./company-routes.js')(this.#app, this.#model.getCompanyModel(), this.#view);
		this.#UserRoutes = require('./user-routes.js')(this.#app, this.#model.getUserModel(), this.#view);
		this.#TokenRoutes = require('./token-routes.js')(this.#app, this.#model.getTokenModel(), this.#view);
		this.#UnitRoutes = require('./unit-routes.js')(this.#app, this.#model.getUnitModel(), this.#view);
		this.#SectionRoutes = require('./section-routes.js')(this.#app, this.#model.getSectionModel(), this.#view);
		this.#EquipmentFamilyRoutes = require('./equipment-family-routes.js')(this.#app, this.#model.getEquipmentFamilyModel(), this.#view);
		this.#EquipmentTypeRoutes = require('./equipment-type-routes.js')(this.#app, this.#model.getEquipmentTypeModel(), this.#view);
		this.#EquipmentRoutes = require('./equipment-routes.js')(this.#app, this.#model.getEquipmentModel(), this.#view);
		this.#ArticleCategoryRoutes = require('./article-category-routes.js')(this.#app, this.#model.getArticleCategoryModel(), this.#view);
		this.#ArticleSubCategoryRoutes = require('./article-sub-category-routes.js')(this.#app, this.#model.getArticleSubCategoryModel(), this.#view);
		this.#ArticleRoutes = require('./article-routes.js')(this.#app, this.#model.getArticleModel(), this.#view);
		this.#ComponentRoutes = require('./component-routes.js')(this.#app, this.#model.getComponentModel(), this.#view);
		this.#NomenclatureRoutes = require('./nomenclature-routes.js')(this.#app, this.#model.getNomenclatureModel(), this.#view);
		this.#InventoryRoutes = require('./inventory-routes.js')(this.#app, this.#model.getInventoryModel(), this.#view);
		this.#WorkOrderRoutes = require('./work-order-routes.js')(this.#app, this.#model.getWorkOrderModel(), this.#view);
		this.#AssignationRoutes = require('./assignation-routes.js')(this.#app, this.#model.getAssignationModel(), this.#view);
		this.#ArticleToChangeRoutes = require('./article-to-change-routes.js')(this.#app, this.#model.getArticleToChangeModel(), this.#view);
		this.#InterventionRoutes = require('./intervention-routes.js')(this.#app, this.#model.getInterventionModel(), this.#view);
		this.#IntervenantRoutes = require('./intervenant-routes.js')(this.#app, this.#model.getIntervenantModel(), this.#view);
		this.#ChangedArticleRoutes = require('./changed-article-routes.js')(this.#app, this.#model.getChangedArticleModel(), this.#view);
		this.#SupplierRoutes = require('./supplier-routes.js')(this.#app, this.#model.getSupplierModel(), this.#view);
		this.#CatalogRoutes = require('./catalog-routes.js')(this.#app, this.#model.getCatalogModel(), this.#view);
		this.#OrderRoutes = require('./order-routes.js')(this.#app, this.#model.getOrderModel(), this.#view);
		this.#OrderLineRoutes = require('./order-line-routes.js')(this.#app, this.#model.getOrderLineModel(), this.#view);

		this.#SelectorRoutes = require('./selector-routes.js')(this.#app, this.#model.getSelectorModel(), this.#view);
	}

	get config() {
		return this.#config;
	}

	
	getOfferRoutes() {
		return this.#OfferRoutes;
	}
	
	getSubscriptionRoutes() {
		return this.#SubscriptionRoutes;
	}
	
	getCompanyRoutes() {
		return this.#CompanyRoutes;
	}
	
	getUserRoutes() {
		return this.#UserRoutes;
	}
	
	getTokenRoutes() {
		return this.#TokenRoutes;
	}
	
	getUnitRoutes() {
		return this.#UnitRoutes;
	}
	
	getSectionRoutes() {
		return this.#SectionRoutes;
	}
	
	getEquipmentFamilyRoutes() {
		return this.#EquipmentFamilyRoutes;
	}
	
	getEquipmentTypeRoutes() {
		return this.#EquipmentTypeRoutes;
	}
	
	getEquipmentRoutes() {
		return this.#EquipmentRoutes;
	}
	
	getArticleCategoryRoutes() {
		return this.#ArticleCategoryRoutes;
	}
	
	getArticleSubCategoryRoutes() {
		return this.#ArticleSubCategoryRoutes;
	}
	
	getArticleRoutes() {
		return this.#ArticleRoutes;
	}
	
	getComponentRoutes() {
		return this.#ComponentRoutes;
	}
	
	getNomenclatureRoutes() {
		return this.#NomenclatureRoutes;
	}
	
	getInventoryRoutes() {
		return this.#InventoryRoutes;
	}
	
	getWorkOrderRoutes() {
		return this.#WorkOrderRoutes;
	}
	
	getAssignationRoutes() {
		return this.#AssignationRoutes;
	}
	
	getArticleToChangeRoutes() {
		return this.#ArticleToChangeRoutes;
	}
	
	getInterventionRoutes() {
		return this.#InterventionRoutes;
	}
	
	getIntervenantRoutes() {
		return this.#IntervenantRoutes;
	}
	
	getChangedArticleRoutes() {
		return this.#ChangedArticleRoutes;
	}
	
	getSupplierRoutes() {
		return this.#SupplierRoutes;
	}
	
	getCatalogRoutes() {
		return this.#CatalogRoutes;
	}
	
	getOrderRoutes() {
		return this.#OrderRoutes;
	}
	
	getOrderLineRoutes() {
		return this.#OrderLineRoutes;
	}
	
	getSelectorRoutes() {
		return this.#SelectorRoutes;
	}

	async run () {
		if (this.#app === null)
			throw new Error('Controller not initialized');
		this.#app.listen(this.#config.server.port, 
			() => { // success
				console.log(`Listening on port ${this.#config.server.port}`);
			}
		);
	}
}

class ControllerSingleton {
	constructor() {
		throw new Error('Can not instanciate singleton object!');
	}
	static getInstance() {
		if (! ControllerSingleton.instance)
			ControllerSingleton.instance = new Controller();
		return ControllerSingleton.instance;
	}
}

module.exports = ControllerSingleton;
