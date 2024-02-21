/* Comaint Single Page Application frontend (Single page application frontend of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * work-order-object-def.cjs
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


const workOrderObjectDef = {
	"id" : {
		"type": "id",
		"mandatory": "true",
	},
	"status" : {
		"type": "integer",
		"minimum": "1",
		"maximum": "10",
		"mandatory": "true",
	},
	"description" : {
		"type": "text",
		"default": "",
		"mandatory": "true",
	},
	"notes" : {
		"type": "text",
		"maximum": "255",
		"mandatory": "false",
	},
	"maintenanceType" : {
		"type": "integer",
		"field": "maintenance_type",
		"minimum": "1",
		"maximum": "2",
		"mandatory": "true",
	}, 
	"equipmentId" : {
		"type": "link",
		"target" : "Equipment",
		"field" : "id_equipment",
		"table" : "equipments"
	}, 
	"companyId" : {
		"type": "link",
		"target" : "Company",
		"field" : "id_company",
		"table" : "companies"
	},
}

module.exports = {
	workOrderObjectDef
}
