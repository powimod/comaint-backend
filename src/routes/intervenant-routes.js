/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * intervenant-routes.js
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

module.exports = (app, IntervenantModel, View) => {

	app.get('/api/v1/intervenant/list', withAuth, async (request, response) => {
		const filters = {};
		let userId = request.query.userId;
		if (userId !== undefined) {
			if (isNaN(userId))
				throw new Error('Query <userId> is not a number');
			userId = parseInt(userId);
			filters.userId = userId;
		}
		let interventionId = request.query.interventionId;
		if (interventionId !== undefined) {
			if (isNaN(interventionId))
				throw new Error('Query <interventionId> is not a number');
			interventionId = parseInt(interventionId);
			filters.interventionId = interventionId;
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
			const intervenantList = await IntervenantModel.findIntervenantList(filters, params);
			View.sendJsonResult(response, { intervenantList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/intervenant/:intervenantId', withAuth, async (request, response) => {
		let intervenantId = request.params.intervenantId;
		assert (intervenantId !== undefined);
		if (isNaN(intervenantId)) {
			View.sendJsonError(response, `Intervenant ID <${ intervenantId}> is not a number`);
			return;
		}
		intervenantId = parseInt(intervenantId);
		try {
			const intervenant = await IntervenantModel.getIntervenantById(intervenantId);
			if (intervenant === null)
				throw new Error(`Intervenant ID <${ intervenantId }> not found`);
			// control root property 
			if (request.companyId !== intervenant.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { intervenant });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/intervenant/:intervenantId/children-count', withAuth, async (request, response) => {
		let intervenantId = request.params.intervenantId;
		assert (intervenantId !== undefined);
		if (isNaN(intervenantId)) {
			View.sendJsonError(response, `Offer ID <${ intervenantId}> is not a number`);
			return;
		}
		intervenantId = parseInt(intervenantId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(intervenantId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ intervenantId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/intervenant/create', withAuth, async (request, response) => {
		try {
			const intervenant = request.body.intervenant;
			if (intervenant === undefined)
				throw new Error(`Can't find <intervenant> object in request body`);
			// control root property 
			if (intervenant.companyId === undefined) {
				intervenant.companyId = request.companyId;
			}
			else {
				if (intervenant.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newIntervenant = await IntervenantModel.createIntervenant(intervenant, request.t);
			if (newIntervenant.id === undefined)
				throw new Error(`Can't find ID of newly created Intervenant`);
			View.sendJsonResult(response, { intervenant : newIntervenant });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/intervenant/edit', withAuth, async (request, response) => {
		try {
			const intervenant = request.body.intervenant
			if (intervenant === undefined)
				throw new Error(`Can't find <intervenant> object in request body`)
			// control root property 
			if (intervenant.companyId === undefined) {
				intervenant.companyId = request.companyId;
			}
			else {
				if (intervenant.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedIntervenant = await IntervenantModel.editIntervenant(intervenant, request.t)
			if (editedIntervenant.id !== intervenant.id)
				throw new Error(`Edited Intervenant ID does not match`)
			View.sendJsonResult(response, { intervenant : editedIntervenant })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.post('/api/v1/intervenant/:intervenantId/delete', withAuth, async (request, response) => {
		let intervenantId = request.params.intervenantId;
		assert (intervenantId !== undefined);
		if (isNaN(intervenantId)) {
			View.sendJsonError(response, `Intervenant ID <${ intervenantId}> is not a number`);
			return;
		}
		intervenantId = parseInt(intervenantId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const intervenant = await IntervenantModel.getIntervenantById(intervenantId);
			if (intervenant === null)
				throw new Error(`Intervenant ID <${ intervenantId }> not found`);
			// control root property 
			if (request.companyId !== intervenant.companyId)
				throw new Error('Unauthorized access');
			const success = await IntervenantModel.deleteById(intervenantId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

