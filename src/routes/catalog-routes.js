/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * catalog-routes.js
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



'use script';
const assert = require('assert');
const {withAuth} = require('./auth-routes');

module.exports = (app, CatalogModel, View) => {

	app.get('/api/v1/catalog/list', withAuth, async (request, response) => {
		const filters = {};
		let supplierId = request.query.supplierId;
		if (supplierId !== undefined) {
			if (isNaN(supplierId))
				throw new Error('Query <supplierId> is not a number');
			supplierId = parseInt(supplierId);
			filters.supplierId = supplierId;
		}
		let articleId = request.query.articleId;
		if (articleId !== undefined) {
			if (isNaN(articleId))
				throw new Error('Query <articleId> is not a number');
			articleId = parseInt(articleId);
			filters.articleId = articleId;
		}
		let companyId = request.query.companyId;
		if (companyId !== undefined) {
			if (isNaN(companyId))
				throw new Error('Query <companyId> is not a number');
			companyId = parseInt(companyId);
			filters.companyId = companyId;
		}
		assert(request.companyId !== undefined);
		try {
			if (filters.companyId === undefined) {
				filters.companyId = request.companyId;
			}
			else {
				if (filters.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let resultsPerPage = request.query.resultsPerPage;
			let offset = request.query.offset;
			const params = {
				resultsPerPage : resultsPerPage,
				offset : offset
			};
			const catalogList = await CatalogModel.findCatalogList(filters, params);
			View.sendJsonResult(response, { catalogList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/catalog/:catalogId', withAuth, async (request, response) => {
		let catalogId = request.params.catalogId;
		assert (catalogId !== undefined);
		if (isNaN(catalogId)) {
			View.sendJsonError(response, `Catalog ID <${ catalogId}> is not a number`);
			return;
		}
		catalogId = parseInt(catalogId);
		try {
			const catalog = await CatalogModel.getCatalogById(catalogId);
			if (catalog === null)
				throw new Error(`Catalog ID <${ catalogId }> not found`);
			// control root property 
			if (request.companyId !== catalog.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { catalog });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/catalog/:catalogId/children-count', withAuth, async (request, response) => {
		let catalogId = request.params.catalogId;
		assert (catalogId !== undefined);
		if (isNaN(catalogId)) {
			View.sendJsonError(response, `Offer ID <${ catalogId}> is not a number`);
			return;
		}
		catalogId = parseInt(catalogId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(catalogId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ catalogId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/catalog/create', withAuth, async (request, response) => {
		try {
			const catalog = request.body.catalog;
			if (catalog === undefined)
				throw new Error(`Can't find <catalog> object in request body`);
			// control root property 
			if (catalog.companyId === undefined) {
				catalog.companyId = request.companyId;
			}
			else {
				if (catalog.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newCatalog = await CatalogModel.createCatalog(catalog, request.t);
			if (newCatalog.id === undefined)
				throw new Error(`Can't find ID of newly created Catalog`);
			View.sendJsonResult(response, { catalog : newCatalog });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.put('/api/v1/catalog/:catalogId', withAuth, async (request, response) => {
		try {
			let catalogId = request.params.catalogId;
			assert (catalogId !== undefined);
			if (isNaN(catalogId))
				throw new Error(`Catalog ID <${ catalogId}> is not a number`);
			catalogId = parseInt(catalogId);

			const catalog = request.body.catalog
			if (catalog === undefined)
				throw new Error(`Can't find <catalog> object in request body`)

			if (catalog.id !== undefined && catalog.id != catalogId )
				throw new Error(`<Catalog> ID does not match`)

			// control root property 
			if (catalog.companyId === undefined) {
				catalog.companyId = request.companyId;
			}
			else {
				if (catalog.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedCatalog = await CatalogModel.editCatalog(catalog, request.t)
			if (editedCatalog.id !== catalog.id)
				throw new Error(`Edited Catalog ID does not match`)
			View.sendJsonResult(response, { catalog : editedCatalog })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.delete('/api/v1/catalog/:catalogId', withAuth, async (request, response) => {
		let catalogId = request.params.catalogId;
		assert (catalogId !== undefined);
		if (isNaN(catalogId)) {
			View.sendJsonError(response, `Catalog ID <${ catalogId}> is not a number`);
			return;
		}
		catalogId = parseInt(catalogId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const catalog = await CatalogModel.getCatalogById(catalogId);
			if (catalog === null)
				throw new Error(`Catalog ID <${ catalogId }> not found`);
			// control root property 
			if (request.companyId !== catalog.companyId)
				throw new Error('Unauthorized access');
			const success = await CatalogModel.deleteById(catalogId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

