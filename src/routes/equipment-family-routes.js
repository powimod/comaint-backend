/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * equipment-family-routes.js
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

module.exports = (app, EquipmentFamilyModel, View) => {

	app.get('/api/v1/equipment-family/list', withAuth, async (request, response) => {
		const filters = {};
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
			const equipmentFamilyList = await EquipmentFamilyModel.findEquipmentFamilyList(filters, params);
			View.sendJsonResult(response, { equipmentFamilyList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/equipment-family/:equipmentFamilyId', withAuth, async (request, response) => {
		let equipmentFamilyId = request.params.equipmentFamilyId;
		assert (equipmentFamilyId !== undefined);
		if (isNaN(equipmentFamilyId)) {
			View.sendJsonError(response, `EquipmentFamily ID <${ equipmentFamilyId}> is not a number`);
			return;
		}
		equipmentFamilyId = parseInt(equipmentFamilyId);
		try {
			const equipmentFamily = await EquipmentFamilyModel.getEquipmentFamilyById(equipmentFamilyId);
			if (equipmentFamily === null)
				throw new Error(`EquipmentFamily ID <${ equipmentFamilyId }> not found`);
			// control root property 
			if (request.companyId !== equipmentFamily.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { equipmentFamily });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/equipment-family/:equipmentFamilyId/children-count', withAuth, async (request, response) => {
		let equipmentFamilyId = request.params.equipmentFamilyId;
		assert (equipmentFamilyId !== undefined);
		if (isNaN(equipmentFamilyId)) {
			View.sendJsonError(response, `Offer ID <${ equipmentFamilyId}> is not a number`);
			return;
		}
		equipmentFamilyId = parseInt(equipmentFamilyId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(equipmentFamilyId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ equipmentFamilyId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/equipment_family/create', withAuth, async (request, response) => {
		try {
			const equipmentFamily = request.body.equipmentFamily;
			if (equipmentFamily === undefined)
				throw new Error(`Can't find <equipmentFamily> object in request body`);
			// control root property 
			if (equipmentFamily.companyId === undefined) {
				equipmentFamily.companyId = request.companyId;
			}
			else {
				if (equipmentFamily.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newEquipmentFamily = await EquipmentFamilyModel.createEquipmentFamily(equipmentFamily, request.t);
			if (newEquipmentFamily.id === undefined)
				throw new Error(`Can't find ID of newly created EquipmentFamily`);
			View.sendJsonResult(response, { equipmentFamily : newEquipmentFamily });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/equipment_family/edit', withAuth, async (request, response) => {
		try {
			const equipmentFamily = request.body.equipmentFamily
			if (equipmentFamily === undefined)
				throw new Error(`Can't find <equipmentFamily> object in request body`)
			// control root property 
			if (equipmentFamily.companyId === undefined) {
				equipmentFamily.companyId = request.companyId;
			}
			else {
				if (equipmentFamily.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedEquipmentFamily = await EquipmentFamilyModel.editEquipmentFamily(equipmentFamily, request.t)
			if (editedEquipmentFamily.id !== equipmentFamily.id)
				throw new Error(`Edited EquipmentFamily ID does not match`)
			View.sendJsonResult(response, { equipmentFamily : editedEquipmentFamily })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.post('/api/v1/equipment-family/:equipmentFamilyId/delete', withAuth, async (request, response) => {
		let equipmentFamilyId = request.params.equipmentFamilyId;
		assert (equipmentFamilyId !== undefined);
		if (isNaN(equipmentFamilyId)) {
			View.sendJsonError(response, `EquipmentFamily ID <${ equipmentFamilyId}> is not a number`);
			return;
		}
		equipmentFamilyId = parseInt(equipmentFamilyId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const equipmentFamily = await EquipmentFamilyModel.getEquipmentFamilyById(equipmentFamilyId);
			if (equipmentFamily === null)
				throw new Error(`EquipmentFamily ID <${ equipmentFamilyId }> not found`);
			// control root property 
			if (request.companyId !== equipmentFamily.companyId)
				throw new Error('Unauthorized access');
			const success = await EquipmentFamilyModel.deleteById(equipmentFamilyId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

