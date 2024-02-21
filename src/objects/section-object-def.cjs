/* Comaint Single Page Application frontend (Single page application frontend of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * section-object-def.cjs
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


const sectionObjectDef = {
	"id" : {
		"type": "id",
		"mandatory": "true",
	},
	"name" : {
		"type": "string",
		"minimum": "2",
		"maximum": "32",
		"mandatory": "true",
	},
	"xPos" : {
		"type": "integer",
		"field": "x_pos",
		"default": "-1",
		"mandatory": "true",
	},
	"yPos" : {
		"type": "integer",
		"field": "y_pos",
		"default": "-1",
		"mandatory": "true",
	},
	"xSize" : {
		"type": "integer",
		"field": "x_size",
		"default": "-1",
		"mandatory": "true",
	},
	"ySize" : {
		"type": "integer",
		"field": "y_size",
		"default": "-1",
		"mandatory": "true",
	}, 
	"unitId" : {
		"type": "link",
		"target" : "Unit",
		"field" : "id_unit",
		"table" : "units"
	}, 
	"companyId" : {
		"type": "link",
		"target" : "Company",
		"field" : "id_company",
		"table" : "companies"
	},
}

module.exports = {
	sectionObjectDef
}
