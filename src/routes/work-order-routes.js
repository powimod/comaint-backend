/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * work-order-routes.js
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

module.exports = (app, WorkOrderModel, View) => {

	app.get('/api/v1/work-order/list', withAuth, async (request, response) => {
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
			const workOrderList = await WorkOrderModel.findWorkOrderList(filters, params);
			View.sendJsonResult(response, { workOrderList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/work-order/:workOrderId', withAuth, async (request, response) => {
		let workOrderId = request.params.workOrderId;
		assert (workOrderId !== undefined);
		if (isNaN(workOrderId)) {
			View.sendJsonError(response, `WorkOrder ID <${ workOrderId}> is not a number`);
			return;
		}
		workOrderId = parseInt(workOrderId);
		try {
			const workOrder = await WorkOrderModel.getWorkOrderById(workOrderId);
			if (workOrder === null)
				throw new Error(`WorkOrder ID <${ workOrderId }> not found`);
			// control root property 
			if (request.companyId !== workOrder.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { workOrder });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/work-order/:workOrderId/children-count', withAuth, async (request, response) => {
		let workOrderId = request.params.workOrderId;
		assert (workOrderId !== undefined);
		if (isNaN(workOrderId)) {
			View.sendJsonError(response, `Offer ID <${ workOrderId}> is not a number`);
			return;
		}
		workOrderId = parseInt(workOrderId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(workOrderId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ workOrderId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/work_order/create', withAuth, async (request, response) => {
		try {
			const workOrder = request.body.workOrder;
			if (workOrder === undefined)
				throw new Error(`Can't find <workOrder> object in request body`);
			// control root property 
			if (workOrder.companyId === undefined) {
				workOrder.companyId = request.companyId;
			}
			else {
				if (workOrder.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newWorkOrder = await WorkOrderModel.createWorkOrder(workOrder, request.t);
			if (newWorkOrder.id === undefined)
				throw new Error(`Can't find ID of newly created WorkOrder`);
			View.sendJsonResult(response, { workOrder : newWorkOrder });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/work_order/edit', withAuth, async (request, response) => {
		try {
			const workOrder = request.body.workOrder
			if (workOrder === undefined)
				throw new Error(`Can't find <workOrder> object in request body`)
			// control root property 
			if (workOrder.companyId === undefined) {
				workOrder.companyId = request.companyId;
			}
			else {
				if (workOrder.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedWorkOrder = await WorkOrderModel.editWorkOrder(workOrder, request.t)
			if (editedWorkOrder.id !== workOrder.id)
				throw new Error(`Edited WorkOrder ID does not match`)
			View.sendJsonResult(response, { workOrder : editedWorkOrder })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.post('/api/v1/work-order/:workOrderId/delete', withAuth, async (request, response) => {
		let workOrderId = request.params.workOrderId;
		assert (workOrderId !== undefined);
		if (isNaN(workOrderId)) {
			View.sendJsonError(response, `WorkOrder ID <${ workOrderId}> is not a number`);
			return;
		}
		workOrderId = parseInt(workOrderId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const workOrder = await WorkOrderModel.getWorkOrderById(workOrderId);
			if (workOrder === null)
				throw new Error(`WorkOrder ID <${ workOrderId }> not found`);
			// control root property 
			if (request.companyId !== workOrder.companyId)
				throw new Error('Unauthorized access');
			const success = await WorkOrderModel.deleteById(workOrderId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

