/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * unit-routes.js
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

module.exports = (app, UnitModel, View) => {

	app.get('/api/v1/unit/list', withAuth, async (request, response) => {
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
			const list = await UnitModel.getList(filters, params);
			View.sendJsonResult(response, { unitList: list } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/unit/:unitId', withAuth, async (request, response) => {
		let unitId = request.params.unitId;
		assert (unitId !== undefined);
		if (isNaN(unitId)) {
			View.sendJsonError(response, `Unit ID <${ unitId}> is not a number`);
			return;
		}
		unitId = parseInt(unitId);
		try {
			const unit = await UnitModel.getUnitById(unitId);
			if (unit === null)
				throw new Error(`Unit ID <${ unitId }> not found`);
			// control root property 
			if (request.companyId !== unit.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { unit: unit} );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/unit/create', withAuth, async (request, response) => {
		try {
			const unit = request.body.unit;
			if (unit === undefined)
				throw new Error(`Can't find <unit> object in request body`);
			let newUnit = await UnitModel.createUnit(unit);
			if (newUnit.id === undefined)
				throw new Error(`Can't find ID of newly created Unit`);
			response.json({ ok: true, unit : newUnit });
		}
		catch (error) {
			const errorMessage = (error.message !== undefined) ? error.message : error;
			response.json({ ok : false, error: errorMessage  });
		}
	});

	app.post('/api/v1/unit/edit', withAuth, async (request, response) => {
		try {
			const unit = request.body.unit
			if (unit === undefined)
				throw new Error(`Can't find <unit> object in request body`)
			let editedUnit = await UnitModel.editUnit(unit)
			if (editedUnit.id !== unit.id)
				throw new Error(`Edited Unit ID does not match`)
			response.json({ ok: true, unit : editedUnit })
		}
		catch (error) {
			const errorMessage = (error.message !== undefined) ? error.message : error
			response.json({ ok : false, error: errorMessage  })
		}
	});


	app.post('/api/v1/unit/:unitId/delete', withAuth, async (request, response) => {
		let unitId = request.params.unitId;
		assert (unitId !== undefined);
		if (isNaN(unitId)) {
			View.sendJsonError(response, `Unit ID <${ unitId}> is not a number`);
			return;
		}
		unitId = parseInt(unitId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const unit = await UnitModel.getUnitById(unitId);
			if (unit === null)
				throw new Error(`Unit ID <${ unitId }> not found`);
			// control root property 
			if (request.companyId !== unit.companyId)
				throw new Error('Unauthorized access');
			const success = await UnitModel.deleteById(unitId, recursive);
			View.sendJsonResult(response, {success} );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

