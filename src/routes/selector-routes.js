/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * selector-routes.js
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



'use script'
const assert = require('assert')
const {withAuth} = require('./auth-routes')

module.exports = (app, SelectorModel, View) => {

	app.post('/api/v1/selector/request', /* TODO enable withAuth,*/ async (request, response) => {
		const selectors = request.body.article
		if (selectors === undefined)
			throw new Error(`Can't find <selectors> object in request body`)
		try {
			if (selectors.companyId === undefined) {
				selectors.companyId = request.companyId
			}
			else {
				if (selectors.companyId !== request.companyId)
					throw new Error('Unauthorized access')
			}
			const results = await SelectorModel.query(filters)
			View.sendJsonResult(response, { results })
		}
		catch (error) {
			View.sendJsonError(response, error)
		}
	})
}

