/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * assignation-routes.js
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

module.exports = (app, AssignationModel, View) => {

	app.get('/api/v1/assignation/list', withAuth, async (request, response) => {
		const filters = {};
		let userId = request.query.userId;
		if (userId !== undefined) {
			if (isNaN(userId))
				throw new Error('Query <userId> is not a number');
			userId = parseInt(userId);
			filters.userId = userId;
		}
		let workOrderId = request.query.workOrderId;
		if (workOrderId !== undefined) {
			if (isNaN(workOrderId))
				throw new Error('Query <workOrderId> is not a number');
			workOrderId = parseInt(workOrderId);
			filters.workOrderId = workOrderId;
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
			const assignationList = await AssignationModel.findAssignationList(filters, params);
			View.sendJsonResult(response, { assignationList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/assignation/:assignationId', withAuth, async (request, response) => {
		let assignationId = request.params.assignationId;
		assert (assignationId !== undefined);
		if (isNaN(assignationId)) {
			View.sendJsonError(response, `Assignation ID <${ assignationId}> is not a number`);
			return;
		}
		assignationId = parseInt(assignationId);
		try {
			const assignation = await AssignationModel.getAssignationById(assignationId);
			if (assignation === null)
				throw new Error(`Assignation ID <${ assignationId }> not found`);
			// control root property 
			if (request.companyId !== assignation.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { assignation });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/assignation/:assignationId/children-count', withAuth, async (request, response) => {
		let assignationId = request.params.assignationId;
		assert (assignationId !== undefined);
		if (isNaN(assignationId)) {
			View.sendJsonError(response, `Offer ID <${ assignationId}> is not a number`);
			return;
		}
		assignationId = parseInt(assignationId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(assignationId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ assignationId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/assignation/create', withAuth, async (request, response) => {
		try {
			const assignation = request.body.assignation;
			if (assignation === undefined)
				throw new Error(`Can't find <assignation> object in request body`);
			// control root property 
			if (assignation.companyId === undefined) {
				assignation.companyId = request.companyId;
			}
			else {
				if (assignation.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newAssignation = await AssignationModel.createAssignation(assignation, request.t);
			if (newAssignation.id === undefined)
				throw new Error(`Can't find ID of newly created Assignation`);
			View.sendJsonResult(response, { assignation : newAssignation });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/assignation/edit', withAuth, async (request, response) => {
		try {
			const assignation = request.body.assignation
			if (assignation === undefined)
				throw new Error(`Can't find <assignation> object in request body`)
			// control root property 
			if (assignation.companyId === undefined) {
				assignation.companyId = request.companyId;
			}
			else {
				if (assignation.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedAssignation = await AssignationModel.editAssignation(assignation, request.t)
			if (editedAssignation.id !== assignation.id)
				throw new Error(`Edited Assignation ID does not match`)
			View.sendJsonResult(response, { assignation : editedAssignation })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.post('/api/v1/assignation/:assignationId/delete', withAuth, async (request, response) => {
		let assignationId = request.params.assignationId;
		assert (assignationId !== undefined);
		if (isNaN(assignationId)) {
			View.sendJsonError(response, `Assignation ID <${ assignationId}> is not a number`);
			return;
		}
		assignationId = parseInt(assignationId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const assignation = await AssignationModel.getAssignationById(assignationId);
			if (assignation === null)
				throw new Error(`Assignation ID <${ assignationId }> not found`);
			// control root property 
			if (request.companyId !== assignation.companyId)
				throw new Error('Unauthorized access');
			const success = await AssignationModel.deleteById(assignationId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

