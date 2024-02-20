/* Comaint Single Page Application frontend (Single page application frontend of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * offer-object-def.cjs
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


const offerObjectDef = {
	"id" : {
		"type": "id",
		"mandatory": "true",
	},
	"title" : {
		"type": "string",
		"minimum": "1",
		"maximum": "64",
		"mandatory": "true",
	},
	"description" : {
		"type": "text",
		"maximum": "256",
		"mandatory": "true",
	},
	"active" : {
		"type": "boolean",
		"default": "true",
		"mandatory": "true",
	},
	"duration" : {
		"type": "integer",
		"default": "0",
		"mandatory": "true",
	},
	"price" : {
		"type": "price",
		"default": "0",
		"mandatory": "true",
	},
	"userLimit" : {
		"type": "integer",
		"field": "user_limit",
		"default": "0",
		"mandatory": "true",
	},
	"equipmentLimit" : {
		"type": "integer",
		"field": "equipment_limit",
		"default": "0",
		"mandatory": "true",
	},
	"articleLimit" : {
		"type": "integer",
		"field": "article_limit",
		"default": "0",
		"mandatory": "true",
	},
	"interventionLimit" : {
		"type": "integer",
		"field": "intervention_limit",
		"default": "0",
		"mandatory": "true",
	},
	"storageLimit" : {
		"type": "integer",
		"field": "storage_limit",
		"default": "0",
		"mandatory": "true",
	},
}

module.exports = {
	offerObjectDef
}
