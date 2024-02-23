/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * nomenclature-routes.js
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

module.exports = (app, NomenclatureModel, View) => {

	app.get('/api/v1/nomenclature/list', withAuth, async (request, response) => {
		const filters = {};
		let equipmentTypeId = request.query.equipmentTypeId;
		if (equipmentTypeId !== undefined) {
			if (isNaN(equipmentTypeId))
				throw new Error('Query <equipmentTypeId> is not a number');
			equipmentTypeId = parseInt(equipmentTypeId);
			filters.equipmentTypeId = equipmentTypeId;
		}
		let articleId = request.query.articleId;
		if (articleId !== undefined) {
			if (isNaN(articleId))
				throw new Error('Query <articleId> is not a number');
			articleId = parseInt(articleId);
			filters.articleId = articleId;
		}
		let componentId = request.query.componentId;
		if (componentId !== undefined) {
			if (isNaN(componentId))
				throw new Error('Query <componentId> is not a number');
			componentId = parseInt(componentId);
			filters.componentId = componentId;
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
			const nomenclatureList = await NomenclatureModel.findNomenclatureList(filters, params);
			View.sendJsonResult(response, { nomenclatureList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/nomenclature/:nomenclatureId', withAuth, async (request, response) => {
		let nomenclatureId = request.params.nomenclatureId;
		assert (nomenclatureId !== undefined);
		if (isNaN(nomenclatureId)) {
			View.sendJsonError(response, `Nomenclature ID <${ nomenclatureId}> is not a number`);
			return;
		}
		nomenclatureId = parseInt(nomenclatureId);
		try {
			const nomenclature = await NomenclatureModel.getNomenclatureById(nomenclatureId);
			if (nomenclature === null)
				throw new Error(`Nomenclature ID <${ nomenclatureId }> not found`);
			// control root property 
			if (request.companyId !== nomenclature.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { nomenclature });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/nomenclature/:nomenclatureId/children-count', withAuth, async (request, response) => {
		let nomenclatureId = request.params.nomenclatureId;
		assert (nomenclatureId !== undefined);
		if (isNaN(nomenclatureId)) {
			View.sendJsonError(response, `Offer ID <${ nomenclatureId}> is not a number`);
			return;
		}
		nomenclatureId = parseInt(nomenclatureId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(nomenclatureId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ nomenclatureId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/nomenclature/create', withAuth, async (request, response) => {
		try {
			const nomenclature = request.body.nomenclature;
			if (nomenclature === undefined)
				throw new Error(`Can't find <nomenclature> object in request body`);
			// control root property 
			if (nomenclature.companyId === undefined) {
				nomenclature.companyId = request.companyId;
			}
			else {
				if (nomenclature.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newNomenclature = await NomenclatureModel.createNomenclature(nomenclature, request.t);
			if (newNomenclature.id === undefined)
				throw new Error(`Can't find ID of newly created Nomenclature`);
			View.sendJsonResult(response, { nomenclature : newNomenclature });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.put('/api/v1/nomenclature/:nomenclatureId', withAuth, async (request, response) => {
		try {
			let nomenclatureId = request.params.nomenclatureId;
			assert (nomenclatureId !== undefined);
			if (isNaN(nomenclatureId)) {
				throw new Error(`Nomenclature ID <${ nomenclatureId}> is not a number`);
			nomenclatureId = parseInt(nomenclatureId);

			const nomenclature = request.body.nomenclature
			if (nomenclature === undefined)
				throw new Error(`Can't find <nomenclature> object in request body`)

			if (nomenclature.id !== undefined && nomenclature.id != nomenclatureId )
				throw new Error(`<Nomenclature> ID does not match`)

			// control root property 
			if (nomenclature.companyId === undefined) {
				nomenclature.companyId = request.companyId;
			}
			else {
				if (nomenclature.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedNomenclature = await NomenclatureModel.editNomenclature(nomenclature, request.t)
			if (editedNomenclature.id !== nomenclature.id)
				throw new Error(`Edited Nomenclature ID does not match`)
			View.sendJsonResult(response, { nomenclature : editedNomenclature })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.delete('/api/v1/nomenclature/:nomenclatureId', withAuth, async (request, response) => {
		let nomenclatureId = request.params.nomenclatureId;
		assert (nomenclatureId !== undefined);
		if (isNaN(nomenclatureId)) {
			View.sendJsonError(response, `Nomenclature ID <${ nomenclatureId}> is not a number`);
			return;
		}
		nomenclatureId = parseInt(nomenclatureId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const nomenclature = await NomenclatureModel.getNomenclatureById(nomenclatureId);
			if (nomenclature === null)
				throw new Error(`Nomenclature ID <${ nomenclatureId }> not found`);
			// control root property 
			if (request.companyId !== nomenclature.companyId)
				throw new Error('Unauthorized access');
			const success = await NomenclatureModel.deleteById(nomenclatureId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

