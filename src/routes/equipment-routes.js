/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * equipment-routes.js
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

module.exports = (app, EquipmentModel, View) => {

	app.get('/api/v1/equipment/list', withAuth, async (request, response) => {
		const filters = {};
		let equipmentTypeId = request.query.equipmentTypeId;
		if (equipmentTypeId !== undefined) {
			if (isNaN(equipmentTypeId))
				throw new Error('Query <equipmentTypeId> is not a number');
			equipmentTypeId = parseInt(equipmentTypeId);
			filters.equipmentTypeId = equipmentTypeId;
		}
		let sectionId = request.query.sectionId;
		if (sectionId !== undefined) {
			if (isNaN(sectionId))
				throw new Error('Query <sectionId> is not a number');
			sectionId = parseInt(sectionId);
			filters.sectionId = sectionId;
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
			const equipmentList = await EquipmentModel.findEquipmentList(filters, params);
			View.sendJsonResult(response, { equipmentList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/equipment/:equipmentId', withAuth, async (request, response) => {
		let equipmentId = request.params.equipmentId;
		assert (equipmentId !== undefined);
		if (isNaN(equipmentId)) {
			View.sendJsonError(response, `Equipment ID <${ equipmentId}> is not a number`);
			return;
		}
		equipmentId = parseInt(equipmentId);
		try {
			const equipment = await EquipmentModel.getEquipmentById(equipmentId);
			if (equipment === null)
				throw new Error(`Equipment ID <${ equipmentId }> not found`);
			// control root property 
			if (request.companyId !== equipment.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { equipment });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/equipment/:equipmentId/children-count', withAuth, async (request, response) => {
		let equipmentId = request.params.equipmentId;
		assert (equipmentId !== undefined);
		if (isNaN(equipmentId)) {
			View.sendJsonError(response, `Offer ID <${ equipmentId}> is not a number`);
			return;
		}
		equipmentId = parseInt(equipmentId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(equipmentId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ equipmentId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/equipment/create', withAuth, async (request, response) => {
		try {
			const equipment = request.body.equipment;
			if (equipment === undefined)
				throw new Error(`Can't find <equipment> object in request body`);
			// control root property 
			if (equipment.companyId === undefined) {
				equipment.companyId = request.companyId;
			}
			else {
				if (equipment.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newEquipment = await EquipmentModel.createEquipment(equipment, request.t);
			if (newEquipment.id === undefined)
				throw new Error(`Can't find ID of newly created Equipment`);
			View.sendJsonResult(response, { equipment : newEquipment });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.put('/api/v1/equipment/:equipmentId', withAuth, async (request, response) => {
		try {
			let equipmentId = request.params.equipmentId;
			assert (equipmentId !== undefined);
			if (isNaN(equipmentId)) {
				throw new Error(`Equipment ID <${ equipmentId}> is not a number`);
			equipmentId = parseInt(equipmentId);

			const equipment = request.body.equipment
			if (equipment === undefined)
				throw new Error(`Can't find <equipment> object in request body`)

			if (equipment.id !== undefined && equipment.id != equipmentId )
				throw new Error(`<Equipment> ID does not match`)

			// control root property 
			if (equipment.companyId === undefined) {
				equipment.companyId = request.companyId;
			}
			else {
				if (equipment.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedEquipment = await EquipmentModel.editEquipment(equipment, request.t)
			if (editedEquipment.id !== equipment.id)
				throw new Error(`Edited Equipment ID does not match`)
			View.sendJsonResult(response, { equipment : editedEquipment })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.delete('/api/v1/equipment/:equipmentId', withAuth, async (request, response) => {
		let equipmentId = request.params.equipmentId;
		assert (equipmentId !== undefined);
		if (isNaN(equipmentId)) {
			View.sendJsonError(response, `Equipment ID <${ equipmentId}> is not a number`);
			return;
		}
		equipmentId = parseInt(equipmentId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const equipment = await EquipmentModel.getEquipmentById(equipmentId);
			if (equipment === null)
				throw new Error(`Equipment ID <${ equipmentId }> not found`);
			// control root property 
			if (request.companyId !== equipment.companyId)
				throw new Error('Unauthorized access');
			const success = await EquipmentModel.deleteById(equipmentId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

