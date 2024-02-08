/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * view.js
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

'use strict'

class View {
	sendJsonResult(response, data) {
		response.json({ ok : true, data: data })
	}
	sendJsonError(response, error) {
		if (error === undefined) error = 'Unknown error'
		const message = (error.message) ? error.message : error
		response.json({ ok : false, error: message})
	}
}

class ViewSingleton {
	constructor() {
		throw new Error('Can not instanciate singleton object!');
	}
	static getInstance() {
		if (! ViewSingleton.instance)
			ViewSingleton.instance = new View();
		return ViewSingleton.instance;
	}
}

module.exports = ViewSingleton;
