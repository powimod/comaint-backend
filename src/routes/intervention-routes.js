/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * intervention-routes.js
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

module.exports = (app, InterventionModel, View) => {

	app.get('/api/v1/intervention/list', withAuth, async (request, response) => {
		const filters = {};
		let equipmentId = request.query.equipmentId;
		if (equipmentId !== undefined) {
			if (isNaN(equipmentId))
				throw new Error('Query <equipmentId> is not a number');
			equipmentId = parseInt(equipmentId);
			filters.equipmentId = equipmentId;
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
			const interventionList = await InterventionModel.findInterventionList(filters, params);
			View.sendJsonResult(response, { interventionList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/intervention/:interventionId', withAuth, async (request, response) => {
		let interventionId = request.params.interventionId;
		assert (interventionId !== undefined);
		if (isNaN(interventionId)) {
			View.sendJsonError(response, `Intervention ID <${ interventionId}> is not a number`);
			return;
		}
		interventionId = parseInt(interventionId);
		try {
			const intervention = await InterventionModel.getInterventionById(interventionId);
			if (intervention === null)
				throw new Error(`Intervention ID <${ interventionId }> not found`);
			// control root property 
			if (request.companyId !== intervention.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { intervention });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/intervention/:interventionId/children-count', withAuth, async (request, response) => {
		let interventionId = request.params.interventionId;
		assert (interventionId !== undefined);
		if (isNaN(interventionId)) {
			View.sendJsonError(response, `Offer ID <${ interventionId}> is not a number`);
			return;
		}
		interventionId = parseInt(interventionId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(interventionId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ interventionId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/intervention/create', withAuth, async (request, response) => {
		try {
			const intervention = request.body.intervention;
			if (intervention === undefined)
				throw new Error(`Can't find <intervention> object in request body`);
			// control root property 
			if (intervention.companyId === undefined) {
				intervention.companyId = request.companyId;
			}
			else {
				if (intervention.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newIntervention = await InterventionModel.createIntervention(intervention, request.t);
			if (newIntervention.id === undefined)
				throw new Error(`Can't find ID of newly created Intervention`);
			View.sendJsonResult(response, { intervention : newIntervention });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.put('/api/v1/intervention/:interventionId', withAuth, async (request, response) => {
		try {
			let interventionId = request.params.interventionId;
			assert (interventionId !== undefined);
			if (isNaN(interventionId)) {
				throw new Error(`Intervention ID <${ interventionId}> is not a number`);
			interventionId = parseInt(interventionId);

			const intervention = request.body.intervention
			if (intervention === undefined)
				throw new Error(`Can't find <intervention> object in request body`)

			if (intervention.id !== undefined && intervention.id != interventionId )
				throw new Error(`<Intervention> ID does not match`)

			// control root property 
			if (intervention.companyId === undefined) {
				intervention.companyId = request.companyId;
			}
			else {
				if (intervention.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedIntervention = await InterventionModel.editIntervention(intervention, request.t)
			if (editedIntervention.id !== intervention.id)
				throw new Error(`Edited Intervention ID does not match`)
			View.sendJsonResult(response, { intervention : editedIntervention })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.delete('/api/v1/intervention/:interventionId', withAuth, async (request, response) => {
		let interventionId = request.params.interventionId;
		assert (interventionId !== undefined);
		if (isNaN(interventionId)) {
			View.sendJsonError(response, `Intervention ID <${ interventionId}> is not a number`);
			return;
		}
		interventionId = parseInt(interventionId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const intervention = await InterventionModel.getInterventionById(interventionId);
			if (intervention === null)
				throw new Error(`Intervention ID <${ interventionId }> not found`);
			// control root property 
			if (request.companyId !== intervention.companyId)
				throw new Error('Unauthorized access');
			const success = await InterventionModel.deleteById(interventionId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

