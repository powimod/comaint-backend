/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * equipment-type-routes.js
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

module.exports = (app, EquipmentTypeModel, View) => {

	app.get('/api/v1/equipment-type/list', withAuth, async (request, response) => {
		const filters = {};
		let equipmentFamilyId = request.query.equipmentFamilyId;
		if (equipmentFamilyId !== undefined) {
			if (isNaN(equipmentFamilyId))
				throw new Error('Query <equipmentFamilyId> is not a number');
			equipmentFamilyId = parseInt(equipmentFamilyId);
			filters.equipmentFamilyId = equipmentFamilyId;
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
			const equipmentTypeList = await EquipmentTypeModel.findEquipmentTypeList(filters, params);
			View.sendJsonResult(response, { equipmentTypeList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/equipment-type/:equipmentTypeId', withAuth, async (request, response) => {
		let equipmentTypeId = request.params.equipmentTypeId;
		assert (equipmentTypeId !== undefined);
		if (isNaN(equipmentTypeId)) {
			View.sendJsonError(response, `EquipmentType ID <${ equipmentTypeId}> is not a number`);
			return;
		}
		equipmentTypeId = parseInt(equipmentTypeId);
		try {
			const equipmentType = await EquipmentTypeModel.getEquipmentTypeById(equipmentTypeId);
			if (equipmentType === null)
				throw new Error(`EquipmentType ID <${ equipmentTypeId }> not found`);
			// control root property 
			if (request.companyId !== equipmentType.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { equipmentType });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/equipment-type/:equipmentTypeId/children-count', withAuth, async (request, response) => {
		let equipmentTypeId = request.params.equipmentTypeId;
		assert (equipmentTypeId !== undefined);
		if (isNaN(equipmentTypeId)) {
			View.sendJsonError(response, `Offer ID <${ equipmentTypeId}> is not a number`);
			return;
		}
		equipmentTypeId = parseInt(equipmentTypeId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(equipmentTypeId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ equipmentTypeId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/equipment_type/create', withAuth, async (request, response) => {
		try {
			const equipmentType = request.body.equipmentType;
			if (equipmentType === undefined)
				throw new Error(`Can't find <equipmentType> object in request body`);
			// control root property 
			if (equipmentType.companyId === undefined) {
				equipmentType.companyId = request.companyId;
			}
			else {
				if (equipmentType.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newEquipmentType = await EquipmentTypeModel.createEquipmentType(equipmentType, request.t);
			if (newEquipmentType.id === undefined)
				throw new Error(`Can't find ID of newly created EquipmentType`);
			View.sendJsonResult(response, { equipmentType : newEquipmentType });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.put('/api/v1/equipment-type/:equipmentTypeId', withAuth, async (request, response) => {
		try {
			let equipmentTypeId = request.params.equipmentTypeId;
			assert (equipmentTypeId !== undefined);
			if (isNaN(equipmentTypeId)) {
				throw new Error(`EquipmentType ID <${ equipmentTypeId}> is not a number`);
			equipmentTypeId = parseInt(equipmentTypeId);

			const equipmentType = request.body.equipmentType
			if (equipmentType === undefined)
				throw new Error(`Can't find <equipmentType> object in request body`)

			if (equipmentType.id !== undefined && equipmentType.id != equipmentTypeId )
				throw new Error(`<EquipmentType> ID does not match`)

			// control root property 
			if (equipmentType.companyId === undefined) {
				equipmentType.companyId = request.companyId;
			}
			else {
				if (equipmentType.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedEquipmentType = await EquipmentTypeModel.editEquipmentType(equipmentType, request.t)
			if (editedEquipmentType.id !== equipmentType.id)
				throw new Error(`Edited EquipmentType ID does not match`)
			View.sendJsonResult(response, { equipmentType : editedEquipmentType })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.delete('/api/v1/equipment-type/:equipmentTypeId', withAuth, async (request, response) => {
		let equipmentTypeId = request.params.equipmentTypeId;
		assert (equipmentTypeId !== undefined);
		if (isNaN(equipmentTypeId)) {
			View.sendJsonError(response, `EquipmentType ID <${ equipmentTypeId}> is not a number`);
			return;
		}
		equipmentTypeId = parseInt(equipmentTypeId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const equipmentType = await EquipmentTypeModel.getEquipmentTypeById(equipmentTypeId);
			if (equipmentType === null)
				throw new Error(`EquipmentType ID <${ equipmentTypeId }> not found`);
			// control root property 
			if (request.companyId !== equipmentType.companyId)
				throw new Error('Unauthorized access');
			const success = await EquipmentTypeModel.deleteById(equipmentTypeId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

