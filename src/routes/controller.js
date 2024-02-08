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
