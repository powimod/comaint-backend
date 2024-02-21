/* Comaint Single Page Application frontend (Single page application frontend of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * intervenant-object-def.cjs
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


const intervenantObjectDef = {
	"id" : {
		"type": "id",
		"mandatory": "true",
	}, 
	"userId" : {
		"type": "link",
		"target" : "User",
		"field" : "id_user",
		"table" : "users"
	}, 
	"interventionId" : {
		"type": "link",
		"target" : "Intervention",
		"field" : "id_intervention",
		"table" : "interventions"
	}, 
	"companyId" : {
		"type": "link",
		"target" : "Company",
		"field" : "id_company",
		"table" : "companies"
	},
}

module.exports = {
	intervenantObjectDef
}
